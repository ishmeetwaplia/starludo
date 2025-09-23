const { Server } = require("socket.io");
const Game = require("./src/models/Game");
const Payment = require("./src/models/Payment");
const User = require("./src/models/User");
const Withdraw = require("./src/models/Withdraw");
const functions = require("./src/functions/function");

function initSocket(server) {
  const io = new Server(server, {
    path: "/socket.io",
    cors: {
      origin: "*",
      methods: ["GET", "POST"],
    },
  });

  // Map of userId => array of socketIds
  const userSocketMap = {};

  // Helper functions
  async function emitGamesList() {
    const updatedGames = await Game.find({ status: { $in: ["pending", "requested"] } })
      .populate("createdBy", "username credit");
    io.emit("games_list", updatedGames);
  }

  async function emitLiveGames() {
    const liveGames = await Game.find({ status: "started" })
      .populate("createdBy", "username credit")
      .populate("acceptedBy", "username credit");
    io.emit("live_games", liveGames);
  }

  // Interval to check game status every 10 seconds
  setInterval(async () => {
    try {
      const now = new Date();

      // Expire pending/requested games older than 5 min
      const expiredPendingGames = await Game.updateMany(
        { status: { $in: ["pending", "requested"] }, createdAt: { $lt: new Date(now - 5 * 60 * 1000) } },
        { status: "expired" }
      );

      // Complete started games older than 15 min
      const completedGames = await Game.updateMany(
        { status: "started", createdAt: { $lt: new Date(now - 15 * 60 * 1000) } },
        { status: "completed" }
      );

      // Cancel inactive started games older than 20 min since last update
      const inactiveGames = await Game.find({
        status: "started",
        updatedAt: { $lt: new Date(now - 20 * 60 * 1000) },
      }).populate("createdBy", "_id").populate("acceptedBy", "_id");

      for (const game of inactiveGames) {
        game.status = "cancelled";
        await game.save();

        const creatorSockets = userSocketMap[game.createdBy?._id?.toString()] || [];
        const accepterSockets = userSocketMap[game.acceptedBy?._id?.toString()] || [];

        [...creatorSockets, ...accepterSockets].forEach(socketId => {
          io.to(socketId).emit("game_over", {
            gameId: game._id,
            status: game.status,
            message: "Game cancelled due to inactivity",
          });
        });
      }

      // Emit updates to clients
      await emitGamesList();
      await emitLiveGames();

    } catch (err) {
      console.error("Error in game status interval:", err);
    }
  }, 10000); // every 10 seconds

  io.on("connection", (socket) => {
    console.log("User connected:", socket.id);
    // Register user socket
    socket.on("register_user", async (userId) => {
      if (!userSocketMap[userId]) userSocketMap[userId] = [];
      userSocketMap[userId].push(socket.id);
      socket.userId = userId;
      console.log("===========userSocketMap", JSON.stringify(userSocketMap, null, 2));
      global.userSocketMap = userSocketMap;
      await emitGamesList();
    });

    // Delete game
    socket.on("delete_game", async (gameId) => {
      try {
        await Game.findByIdAndDelete(gameId);
        await emitGamesList();
      } catch (error) {
        console.error("Error deleting game:", error);
      }
    });

    // Accept game request
    socket.on("accept_game_request", async (gameInfo) => {   
      try {
        const gameId = gameInfo?.gameId;
        const userId = gameInfo?.userId || null;
        const game = await Game.findById(gameId).populate("createdBy", "username");
        if (!game) return;

        const acceptingUser = await User.findById(userId);
        if (!acceptingUser) return;

        const availableBalance = 
          Number(acceptingUser.credit || 0) +
          Number(acceptingUser.referralEarning || 0) +
          Number(acceptingUser.winningAmount || 0) -
          Number(acceptingUser.penalty || 0);

        if (Number(game.betAmount || 0) > availableBalance) {
          return;
        }

        const updatedGame = await Game.findByIdAndUpdate(
          gameId,
          { status: "requested", acceptedBy: userId },
          { new: true }
        ).populate("createdBy", "username");

        if (!updatedGame) return;

        const creatorSockets = userSocketMap[updatedGame.createdBy._id.toString()] || [];
        creatorSockets.forEach(socketId => {
          io.to(socketId).emit("game_accepted", {
            gameId,
            acceptedBy: userId,
          });
        });

        await emitGamesList();
      } catch (error) {
        console.error("Error accepting game:", error);
      }
    });

    // Cancel game request
    socket.on("cancel_game_request", async (gameData) => {
      try {
        const gameId = gameData?._id;
        const userId = gameData?.userId || null;
        if (!gameId || !userId) return;

        const game = await Game.findById(gameId).populate("acceptedBy", "_id username");
        if (!game || !game.acceptedBy) return;

        const accepterSockets = userSocketMap[game.acceptedBy._id.toString()] || [];
        accepterSockets.forEach(socketId => {
          io.to(socketId).emit("game_request_canceled", {
            gameId,
            message: "The creator has canceled the game request.",
          });
        });

        if (game.createdBy.toString() === userId) {
          await Game.findByIdAndUpdate(gameId, { status: "cancelled"});
        } else if (game.acceptedBy && game.acceptedBy._id.toString() === userId) {
          await Game.findByIdAndUpdate(gameId, { status: "pending", acceptedBy: null });
        }

        await emitGamesList();
      } catch (error) {
        console.error("Error canceling game request:", error);
      }
    });

    // Start game
    socket.on("start_game", async (startGamePayload) => {
      try {
        const gameId = startGamePayload?._id;
        const incomingRoomId = startGamePayload?.roomId || null;

        const game = await Game.findById(gameId)
          .populate("createdBy", "_id username credit referralEarning winningAmount penalty")
          .populate("acceptedBy", "_id username credit referralEarning winningAmount penalty");

        if (!game || !game.acceptedBy) return;

        if (incomingRoomId) {
          const existing = await Game.findOne({ roomId: incomingRoomId }).select("_id");
          if (existing && existing._id.toString() !== String(gameId)) {
            console.warn(`start_game aborted: roomId ${incomingRoomId} already in use by game ${existing._id}`);
            const createrSockets = userSocketMap[game.createdBy._id.toString()] || [];
            createrSockets.forEach(socketId => {
              io.to(socketId).emit("invalid_game", {
                gameId,
                roomId: incomingRoomId,
                message: "Invalid game: roomId already in use.",
              });
            });
            return;
          }
        }

        const socketsToNotify = [
          ...(userSocketMap[game.acceptedBy._id.toString()] || []),
          ...(userSocketMap[game.createdBy._id.toString()] || []),
        ];

        socketsToNotify.forEach(socketId => {
          const isCreator = socketId === game.createdBy._id.toString();
          io.to(socketId).emit("start_game", {
            gameId,
            roomId: incomingRoomId,
            message: isCreator ? "You started the game." : "The creator has started the game.",
          });
        });

        const betAmount = Number(game.betAmount || 0);

        const deductAmountFromUser = async (userId, amountToDeduct) => {
          const user = await User.findById(userId);
          if (!user) throw new Error(`User ${userId} not found while starting game`);

          // Normalize values (schema uses mixed types)
          let credit = Number(user.credit || 0); // number
          let referral = Number(user.referralEarning || 0); // number
          let winning = Number(user.winningAmount || 0); // stored as string in schema, convert
          const bet = Number(amountToDeduct || 0);

          // Case 1: credit covers full bet
          if (credit >= bet) {
            credit = credit - bet;
            // Save back
            user.credit = credit;
            // referral and winning unchanged
            await user.save();
            return;
          }

          // Case 2: credit + referral covers full bet
          const creditPlusReferral = credit + referral;
          if (creditPlusReferral >= bet) {
            // use all credit, reduce referral by remaining
            const remainingAfterCredit = bet - credit; // > 0
            credit = 0;
            referral = referral - remainingAfterCredit;
            // Save back
            user.credit = credit;
            user.referralEarning = referral;
            await user.save();
            return;
          }

          // Case 3: need to use winning amount as well
          const totalAvailable = credit + referral + winning;
          if (totalAvailable < bet) {
            // Not enough funds in all pools — throw so caller can handle (or change to your desired behavior)
            throw new Error(`Insufficient funds for user ${userId}: available ${totalAvailable}, required ${bet}`);
          }

          // Use up credit and referral fully, then deduct remaining from winning
          const needAfterCreditReferral = bet - (credit + referral); // > 0
          credit = 0;
          referral = 0;
          winning = winning - needAfterCreditReferral; // remaining winning

          // Ensure not negative (shouldn't be because of earlier check)
          if (winning < 0) winning = 0;

          user.credit = credit; // number
          user.referralEarning = referral; // number
          user.winningAmount = String(winning); // schema stores as string
          await user.save();
        };

        await Promise.all([
          deductAmountFromUser(game.createdBy._id, betAmount),
          deductAmountFromUser(game.acceptedBy._id, betAmount),
        ]);

        await Game.findByIdAndUpdate(
          gameId,
          { status: "started", roomId: incomingRoomId ? String(incomingRoomId) : null },
          { new: true }
        );

        await emitGamesList();
        await emitLiveGames();
      } catch (error) {
        console.error("Error starting game:", error);
      }
    });

    // Payment status update
    socket.on("update_payment_status", async (paymentData) => {
      try {
        const paymentId =paymentData?.paymentId;
        const status = paymentData?.status || null;
        
        if (!["approved", "rejected", "pending"].includes(status)) return;

        const payment = await Payment.findById(paymentId).populate("userId", "username credit");
        if (!payment) return;

        payment.status = status;
        await payment.save();
        if (status === "approved" && payment.userId) {
          const user = payment.userId;
          const currentCredit = parseFloat(user.credit || "0"); // convert string to number
          const newCredit = currentCredit + payment.amount;

          // save back as string
          user.credit = newCredit.toString();
          await user.save();
        }

        const userSockets = userSocketMap[payment.userId._id.toString()] || [];
        userSockets.forEach(socketId => {
          io.to(socketId).emit("payment_update", {
            message: `Your payment has been ${status}`,
            payment,
          });
        });
      } catch (error) {
        console.error("Error updating payment:", error);
      }
    });

    // Withdraw status update
    socket.on("update_withdraw_status", async (withdrawData) => {
      try {
        const withdrawId =withdrawData?.withdrawId;
        const status = withdrawData?.status || null;
        
        if (!["paid", "rejected"].includes(status)) return;

        const withdraw = await Withdraw.findById(withdrawId).populate("userId", "username winningAmount");
        if (!withdraw) return;

        withdraw.status = status;
        await withdraw.save();

        if (status === "paid" && withdraw.userId) {
          const user = await User.findById(withdraw.userId._id);
          if (user) {
            const oldAmount = Number(user.winningAmount) || 0;
            const newAmount = Math.max(0, oldAmount - Number(withdraw.amount));
            user.winningAmount = String(newAmount);
            await user.save();
          }
        }
      } catch (error) {
        console.error("Error updating withdraw status:", error);
      }
    });

    // Admin winner decision
    socket.on("admin_winner_decision", async (gameObj) => { 
      try {
        const gameId = gameObj?.gameId;
        const winner = gameObj?.winner ?? null; 
        
        const game = await Game.findById(gameId)
          .populate("createdBy", "_id username")
          .populate("acceptedBy", "_id username");

        if (!game) return socket.emit("error_message", { message: "Game not found" });
        if (game.adminstatus === "decided") return socket.emit("error_message", { message: "Game already decided" });

        // if (winner && ![game.createdBy._id.toString(), game.acceptedBy._id.toString()].includes(winner)) {
        //   console.log("Winner not one of the players:", winner);
        //   return socket.emit("error_message", { message: "Winner must be one of the players" });
        // }

        if (!winner || winner === "none" || winner==="") {
          
          // Reject case: split winningAmount
          const splitAmount = Number(game.betAmount || 0);
          const users = [game.createdBy, game.acceptedBy];
          for (let u of users) {
            const user = await User.findById(u._id);
            if (user) {
              user.winningAmount = String((Number(user.credit) || 0) + splitAmount);
              await user.save();
            }
          }
          game.winner = null;
          game.loser = null;
        } else {
          // Normal winner case
          const loserId = game.createdBy._id.toString() === winner ? game.acceptedBy._id : game.createdBy._id;
          game.winner = winner;
          game.loser = loserId;

          const user = await User.findById(winner);
          if (user) {
            user.winningAmount = String((Number(user.winningAmount) || 0) + Number(game.winningAmount || 0));
            await user.save();

            if (user.referredBy) {
              const referrer = await User.findById(user.referredBy);
              if (referrer && referrer.isActive && !referrer.isBanned) {
                const bet = Number(game.betAmount) || 0;
                const referBonus = 0.02 * (2 * bet);
                referrer.referralEarning = (Number(referrer.referralEarning || 0) + referBonus);
                await referrer.save();

                try {
                  await functions.recordReferralWin({
                    winnerId: user._id,
                    referredById: referrer._id,
                    gameId: game._id,
                    winningAmount: Number(game.winningAmount) || 0,
                    betAmount: Number(game.betAmount) || 0,
                    roomId: game.roomId || null
                  });
                } catch (e) {
                  console.error("Failed to record referral in socket handler:", e);
                }
              }
            }
          }
        }

        game.adminstatus = "decided";
        game.status = "completed";
        await game.save();

      } catch (error) {
        console.error("Error in admin_winner_decision:", error);
      }
    });

    // Handle disconnect
    socket.on("disconnect", async () => {
      if (socket.userId && userSocketMap[socket.userId]) {
        userSocketMap[socket.userId] = userSocketMap[socket.userId].filter(id => id !== socket.id);
        if (userSocketMap[socket.userId].length === 0) delete userSocketMap[socket.userId];
      }

      await emitGamesList();
      console.log("User disconnected:", socket.id);
    });
  });

  return io;
}

module.exports = initSocket;
