const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const Game = require("../models/Game");
const { statusCode, resMessage } = require("../config/constant");
const fs = require("fs");
const path = require("path");
const Payment = require("../models/Payment");
const Withdraw = require("../models/Withdraw")

exports.login = async ({ email, password }) => {
  try {
    const admin = await User.findOne({ email, role: "admin" }).select("+password");
    if (!admin) {
      return {
        status: statusCode.UNAUTHORIZED,
        success: false,
        message: resMessage.INVALID_CREDENTIALS
      };
    }
    const isMatch = await bcrypt.compare(password, admin.password);
    
    if (!isMatch) {
      return {
        status: statusCode.UNAUTHORIZED,
        success: false,
        message: resMessage.INVALID_CREDENTIALS
      };
    }

    const token = jwt.sign(
      { id: admin._id, email: admin.email, role: "admin" },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    admin.token = token;
    await admin.save();

    return {
      success: true,
      status: statusCode.OK,
      message: resMessage.LOGIN_SUCCESS,
      data: { id: admin._id, email: admin.email, role: admin.role, token }
    };
  } catch (error) {
    return {
      status: statusCode.INTERNAL_SERVER_ERROR,
      success: false,
      message: error.message || resMessage.Server_error
    };
  }
};

exports.getDashboard = async (adminId) => {
  try {
    const admin = await User.findOne({ _id: adminId, role: "admin" }).select("-password");
    if (!admin) {
      return {
        status: statusCode.NOT_FOUND,
        success: false,
        message: resMessage.ADMIN_NOT_FOUND
      };
    }

    return {
      success: true,
      status: statusCode.OK,
      message: resMessage.DASHBOARD_FETCHED,
      data: admin
    };
  } catch (error) {
    return {
      status: statusCode.INTERNAL_SERVER_ERROR,
      success: false,
      message: error.message || resMessage.Server_error
    };
  }
};

exports.createUser = async ({ phone }) => {
  try {
    if (!User) throw new Error(resMessage.USER_MODEL_NOT_INITIALIZED);

    const existing = await User.findOne({ phone });
    if (existing) {
      return {
        status: statusCode.CONFLICT,
        success: false,
        message: resMessage.USER_EXISTS
      };
    }

    const newUser = await User.create({ phone, isRegistered: false });

    return {
      success: true,
      status: statusCode.CREATED,
      message: resMessage.USER_CREATED,
      data: newUser
    };
  } catch (error) {
    return {
      status: statusCode.INTERNAL_SERVER_ERROR,
      success: false,
      message: error.message || resMessage.Server_error
    };
  }
};

exports.deleteUser = async (userId) => {
  try {
    if (!User) throw new Error(resMessage.USER_MODEL_NOT_INITIALIZED);

    const deleted = await User.findByIdAndDelete(userId);
    if (!deleted) {
      return {
        status: statusCode.NOT_FOUND,
        success: false,
        message: resMessage.USER_NOT_FOUND
      };
    }

    return {
      success: true,
      status: statusCode.OK,
      message: resMessage.USER_DELETED
    };
  } catch (error) {
    return {
      status: statusCode.INTERNAL_SERVER_ERROR,
      success: false,
      message: error.message || resMessage.Server_error
    };
  }
};

exports.getUserById = async (userId) => {
  try {
    if (!User) throw new Error(resMessage.USER_MODEL_NOT_INITIALIZED);

    const user = await User.findById(userId);
    if (!user) {
      return {
        status: statusCode.NOT_FOUND,
        success: false,
        message: resMessage.USER_NOT_FOUND
      };
    }

    return {
      success: true,
      status: statusCode.OK,
      message: resMessage.USER_FETCHED,
      data: user
    };
  } catch (error) {
    return {
      status: statusCode.INTERNAL_SERVER_ERROR,
      success: false,
      message: error.message || resMessage.Server_error
    };
  }
};

exports.getAllUsers = async (query) => {
  try {
    if (!User) throw new Error(resMessage.USER_MODEL_NOT_INITIALIZED);

    const {
      isActive,
      isBanned,
      search,
      page = 1,
      limit = 10
    } = query;

    const filter = {};

    filter.role = "user";
    if (isActive !== undefined) filter.isActive = isActive === "true"; 
    if (isBanned !== undefined) filter.isBanned = isBanned === "true"; 

    if (search) {
      filter.$or = [
        { fullName: { $regex: search, $options: "i" } },
        { username: { $regex: search, $options: "i" } },
        { phone: { $regex: search, $options: "i" } }
      ];
    }

    const skip = (page - 1) * limit;
    const users = await User.find(filter)
      .skip(skip)
      .limit(Number(limit));

    const total = await User.countDocuments(filter);

    return {
      success: true,
      status: statusCode.OK,
      message: resMessage.USERS_FETCHED,
      data: {
        users,
        total,
        page: Number(page),
        pages: Math.ceil(total / limit)
      }
    };
  } catch (error) {
    return {
      status: statusCode.INTERNAL_SERVER_ERROR,
      success: false,
      message: error.message || resMessage.Server_error
    };
  }
};

exports.banUnbanUser = async (userId, isBanned) => {
  try {
    if (!User) throw new Error(resMessage.USER_MODEL_NOT_INITIALIZED);

    const user = await User.findById(userId);
    if (!user) {
      return {
        status: statusCode.NOT_FOUND,
        success: false,
        message: resMessage.USER_NOT_FOUND
      };
    }

    user.isBanned = isBanned;
    await user.save();

    return {
      success: true,
      status: statusCode.OK,
      message: isBanned ? resMessage.USER_BANNED : resMessage.USER_UNBANNED,
      data: user
    };
  } catch (error) {
    return {
      status: statusCode.INTERNAL_SERVER_ERROR,
      success: false,
      message: error.message || resMessage.Server_error
    };
  }
};

exports.updateUser = async (userId, userData) => {
  try {
    if (!User) throw new Error(resMessage.USER_MODEL_NOT_INITIALIZED);

    const user = await User.findById(userId);
    if (!user) {
      return {
        status: statusCode.NOT_FOUND,
        success: false,
        message: resMessage.USER_NOT_FOUND
      };
    }

    for (const key of Object.keys(userData)) {
      user[key] = userData[key];
    }

    await user.save();

    return {
      success: true,
      status: statusCode.OK,
      message: resMessage.USER_UPDATED,
      data: user
    };
  } catch (error) {
    return {
      status: statusCode.INTERNAL_SERVER_ERROR,
      success: false,
      message: error.message || resMessage.Server_error
    };
  }
};

exports.uploadScannerImage = async (adminId, file, upiId) => {
  try {
    if (!file) {
      return {
        status: statusCode.BAD_REQUEST,
        success: false,
        message: "No image uploaded"
      };
    }

    if (!upiId || typeof upiId !== "string") {
      return {
        status: statusCode.BAD_REQUEST,
        success: false,
        message: "Valid UPI ID is required"
      };
    }

    const assetFilePath = path.join(__dirname, "../../asset.json");

    let assetData = { scanners: [] };
    if (fs.existsSync(assetFilePath)) {
      const fileContent = fs.readFileSync(assetFilePath, "utf-8");
      try {
        assetData = JSON.parse(fileContent);
      } catch (e) {
        assetData = { scanners: [] };
      }
    }

    if (!Array.isArray(assetData.scanners)) {
      assetData.scanners = [];
    }

    // 🔹 Set all scanners inactive
    assetData.scanners = assetData.scanners.map(scanner => ({
      image: scanner.image,
      upiId: scanner.upiId,
      isActive: false
    }));

    const relativePath = `/uploads/scanners/${file.filename}`;

    assetData.scanners.push({
      image: relativePath,
      upiId: String(upiId).trim(),
      isActive: true
    });

    fs.writeFileSync(assetFilePath, JSON.stringify(assetData, null, 2));

    return {
      success: true,
      status: statusCode.OK,
      message: "Scanner uploaded successfully",
      data: { image: relativePath, upiId: String(upiId).trim(), isActive: true }
    };
  } catch (error) {
    return {
      status: statusCode.INTERNAL_SERVER_ERROR,
      success: false,
      message: error.message || resMessage.Server_error
    };
  }
};

exports.getAllGames = async (query) => {
  try {
    const {
      status,
      betAmountMin,
      betAmountMax,
      winningAmountMin,
      winningAmountMax,
      search, 
      page = 1,
      limit = 10,
    } = query;

    const filter = {};

    if (status) filter.status = status;

    if (betAmountMin || betAmountMax) {
      filter.betAmount = {};
      if (betAmountMin) filter.betAmount.$gte = Number(betAmountMin);
      if (betAmountMax) filter.betAmount.$lte = Number(betAmountMax);
    }

    if (winningAmountMin || winningAmountMax) {
      filter.winningAmount = {};
      if (winningAmountMin) filter.winningAmount.$gte = Number(winningAmountMin);
      if (winningAmountMax) filter.winningAmount.$lte = Number(winningAmountMax);
    }

    // fetch without skip/limit first
    let games = await Game.find(filter)
      .populate("createdBy", "_id username")
      .populate("acceptedBy", "_id username");

    // Apply search filter if provided
    if (search) {
      const searchLower = search.toLowerCase();
      games = games.filter(
        (g) =>
          (g.createdBy?.username?.toLowerCase().includes(searchLower)) ||
          (g.acceptedBy?.username?.toLowerCase().includes(searchLower))
      );
    }

    const total = games.length; 

    // Apply pagination AFTER search
    const skip = (page - 1) * limit;
    games = games.slice(skip, skip + Number(limit));

    return {
      success: true,
      status: statusCode.OK,
      message: "Games fetched successfully",
      data: {
        games,
        total,
        page: Number(page),
        pages: Math.ceil(total / limit),
      },
    };
  } catch (error) {
    return {
      status: statusCode.INTERNAL_SERVER_ERROR,
      success: false,
      message: error.message || resMessage.Server_error,
    };
  }
};

exports.addCredit = async (userId, creditToAdd) => {
  try {
    if (!User) throw new Error(resMessage.USER_MODEL_NOT_INITIALIZED);

    const user = await User.findById(userId);
    if (!user) {
      return {
        status: statusCode.NOT_FOUND,
        success: false,
        message: resMessage.USER_NOT_FOUND
      };
    }

    // Add credit to the user’s account
    user.credit = (user.credit || 0) + creditToAdd;

    await user.save();

    return {
      success: true,
      status: statusCode.OK,
      message: "Credit added successfully",
      data: { userId: user._id, credit: user.credit }
    };
  } catch (error) {
    return {
      status: statusCode.INTERNAL_SERVER_ERROR,
      success: false,
      message: error.message || resMessage.Server_error
    };
  }
};

exports.getUserGameStats = async (userId, query) => {
  try {
    const user = await User.findById(userId);
    if (!user) {
      return {
        status: statusCode.NOT_FOUND,
        success: false,
        message: resMessage.USER_NOT_FOUND
      };
    }

    let { page = 1, limit = 10, type } = query;
    page = Number(page);
    limit = Number(limit);
    const skip = (page - 1) * limit;

    // Build filter based on type
    let filter = {};
    if (type === "created") {
      filter.createdBy = userId;
    } else if (type === "accepted") {
      filter.acceptedBy = userId;
    } else if (type === "won") {
      filter.winner = userId;
    } else if (type === "lost") {
      filter.loser = userId;
    } else if (type === "quit") {
      filter.quitBy = userId;
    } else if (type === "played") {
      filter.$or = [{ createdBy: userId }, { acceptedBy: userId }];
    }

    // Fetch games with pagination
    const games = await Game.find(filter)
      .populate("createdBy", "_id username")
      .populate("acceptedBy", "_id username")
      .populate("winner", "_id username")
      .populate("loser", "_id username")
      .populate("quitBy", "_id username")
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 });

    const total = await Game.countDocuments(filter);

    // Pre-calculate all counts
    const createdCount = await Game.countDocuments({ createdBy: userId });
    const acceptedCount = await Game.countDocuments({ acceptedBy: userId });
    const playedCount = await Game.countDocuments({ 
      $or: [{ createdBy: userId }, { acceptedBy: userId }]
    });
    const wonCount = await Game.countDocuments({ winner: userId });
    const lostCount = await Game.countDocuments({ loser: userId });
    const quitCount = await Game.countDocuments({ quitBy: userId });

    return {
      success: true,
      status: statusCode.OK,
      message: "User game stats fetched successfully",
      data: {
        userId,
        createdCount,
        acceptedCount,
        playedCount,
        wonCount,
        lostCount,
        quitCount,
        games,
        total,
        page,
        pages: Math.ceil(total / limit)
      }
    };
  } catch (error) {
    return {
      status: statusCode.INTERNAL_SERVER_ERROR,
      success: false,
      message: error.message || resMessage.Server_error
    };
  }
};

exports.uploadAssetsService = async (banners, tournaments) => {
  try {
    if ((!banners || banners.length === 0) && (!tournaments || tournaments.length === 0)) {
      return {
        status: statusCode.BAD_REQUEST,
        success: false,
        message: "No images uploaded",
      };
    }

    const assetFilePath = path.join(__dirname, "../../asset.json");

    let assetData = { scanners: [], banners: [], tournaments: [] };
    if (fs.existsSync(assetFilePath)) {
      const fileContent = fs.readFileSync(assetFilePath, "utf-8");
      try {
        assetData = JSON.parse(fileContent);
      } catch (e) {
        assetData = { scanners: [], banners: [], tournaments: [] };
      }
    }

    if (!Array.isArray(assetData.scanners)) assetData.scanners = [];
    if (!Array.isArray(assetData.banners)) assetData.banners = [];
    if (!Array.isArray(assetData.tournaments)) assetData.tournaments = [];

    // 🔹 Deactivate old ones
    assetData.banners = assetData.banners.map((b) => ({ ...b, isActive: false }));
    assetData.tournaments = assetData.tournaments.map((t) => ({ ...t, isActive: false }));

    // 🔹 Build relative paths
    const newBanners = (banners || []).map((file) => ({
      image: `/uploads/banner/${file.filename}`,
      isActive: true,
    }));

    const newTournaments = (tournaments || []).map((file) => ({
      image: `/uploads/tournaments/${file.filename}`,
      isActive: true,
    }));

    // 🔹 Push new data
    assetData.banners.push(...newBanners);
    assetData.tournaments.push(...newTournaments);

    fs.writeFileSync(assetFilePath, JSON.stringify(assetData, null, 2));

    return {
      success: true,
      status: statusCode.OK,
      message: "Assets uploaded successfully",
      data: {
        banners: newBanners,
        tournaments: newTournaments,
      },
    };
  } catch (error) {
    return {
      status: statusCode.INTERNAL_SERVER_ERROR,
      success: false,
      message: error.message || resMessage.Server_error,
    };
  }
};

exports.getAllPayments = async (query) => {
  try {
    const {
      status,
      search,
      page = 1,
      limit = 10,
    } = query;

    const filter = {};
    if (status) filter.status = status;

    // fetch without skip/limit first
    let payments = await Payment.find(filter)
      .populate("userId", "_id username phone credit")
      .sort({ createdAt: -1 });

    // Apply search filter if provided
    if (search) {
      const searchLower = search.toLowerCase();
      payments = payments.filter(
        (p) =>
          p.utrNumber?.toLowerCase().includes(searchLower) ||
          p.userId?.username?.toLowerCase().includes(searchLower)
      );
    }

    const total = payments.length;

    // Apply pagination AFTER search
    const skip = (page - 1) * limit;
    payments = payments.slice(skip, skip + Number(limit));

    return {
      success: true,
      status: statusCode.OK,
      message: "Payments fetched successfully",
      data: {
        payments,
        total,
        page: Number(page),
        pages: Math.ceil(total / limit),
      },
    };
  } catch (error) {
    return {
      status: statusCode.INTERNAL_SERVER_ERROR,
      success: false,
      message: error.message || resMessage.Server_error,
    };
  }
};

exports.approvePayment = async (paymentId, status) => {
  const payment = await Payment.findById(paymentId);
  if (!payment) {
    throw new Error("Payment not found");
  }

  if (payment.status !== "pending") {
    throw new Error("Payment is already processed");
  }

  payment.status = status;
  await payment.save();

  if (status === "approved") {
    // Increase user credit
    const user = await User.findById(payment.userId);
    if (!user) {
      throw new Error("User not found");
    }

    user.credit = (user.credit || 0) + payment.amount;
    await user.save();
  }

  return {
    message: `Payment has been ${status}`,
    payment
  };
};

exports.getUserPayments = async (userId, query) => {
  try {
    const { status, minAmount, maxAmount, page = 1, limit = 10 } = query;

    const filter = { userId };
    if (status) filter.status = status;
    if (minAmount || maxAmount) {
      filter.amount = {};
      if (minAmount) filter.amount.$gte = Number(minAmount);
      if (maxAmount) filter.amount.$lte = Number(maxAmount);
    }

    const skip = (page - 1) * limit;

    const payments = await Payment.find(filter)
      .populate("userId", "_id username phone credit")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit));

    const total = await Payment.countDocuments(filter);

    return {
      success: true,
      status: statusCode.OK,
      message: "User payments fetched successfully",
      data: {
        items: payments,
        total,
        page: Number(page),
        pages: Math.ceil(total / limit),
      },
    };
  } catch (error) {
    return {
      success: false,
      status: statusCode.INTERNAL_SERVER_ERROR,
      message: error.message || resMessage.Server_error,
    };
  }
};

exports.getUserWithdraws = async (userId, query) => {
  try {
    const { status, minAmount, maxAmount, page = 1, limit = 10 } = query;

    const filter = { userId };
    if (status) filter.status = status;
    if (minAmount || maxAmount) {
      filter.amount = {};
      if (minAmount) filter.amount.$gte = Number(minAmount);
      if (maxAmount) filter.amount.$lte = Number(maxAmount);
    }

    const skip = (page - 1) * limit;

    const withdraws = await Withdraw.find(filter)
      .populate("userId", "_id username phone credit")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit));

    const total = await Withdraw.countDocuments(filter);

    return {
      success: true,
      status: statusCode.OK,
      message: "User withdraws fetched successfully",
      data: {
        items: withdraws,
        total,
        page: Number(page),
        pages: Math.ceil(total / limit),
      },
    };
  } catch (error) {
    return {
      success: false,
      status: statusCode.INTERNAL_SERVER_ERROR,
      message: error.message || resMessage.Server_error,
    };
  }
};

exports.getAllWithdraws = async (query) => {
  try {
    const { status, search, minAmount, maxAmount, page = 1, limit = 10 } = query;

    const filter = {};
    if (status) filter.status = status;

    if (minAmount || maxAmount) {
      filter.amount = {};
      if (minAmount) filter.amount.$gte = Number(minAmount);
      if (maxAmount) filter.amount.$lte = Number(maxAmount);
    }

    let withdraws = await Withdraw.find(filter)
      .populate('userId', '_id username phone credit')
      .sort({ createdAt: -1 });

    if (search) {
      const searchLower = search.toLowerCase();
      withdraws = withdraws.filter(
        (w) =>
          w.userId?.username?.toLowerCase().includes(searchLower) ||
          w.userId?.phone?.toLowerCase().includes(searchLower)
      );
    }

    const total = withdraws.length;
    const skip = (page - 1) * limit;
    withdraws = withdraws.slice(skip, skip + Number(limit));

    return {
      success: true,
      status: statusCode.OK,
      message: 'Withdraw requests fetched successfully',
      data: {
        withdraws,
        total,
        page: Number(page),
        pages: Math.ceil(total / limit),
      },
    };
  } catch (error) {
    return {
      success: false,
      status: statusCode.INTERNAL_SERVER_ERROR,
      message: error.message || resMessage.Server_error,
    };
  }
};

exports.approveWithdraw = async (withdrawId, status) => {
  if (!["paid", "rejected"].includes(status)) {
    throw new Error("Invalid status. Only 'paid' or 'rejected' allowed.");
  }

  const withdraw = await Withdraw.findById(withdrawId);
  if (!withdraw) {
    throw new Error("Withdraw request not found");
  }

  if (withdraw.status !== "unpaid") {
    throw new Error("Withdraw is already processed");
  }

  withdraw.status = status;
  await withdraw.save();

  if (status === "paid") {
    const user = await User.findById(withdraw.userId);
    if (!user) {
      throw new Error("User not found");
    }

    const oldWinningAmount = Number(user.winningAmount) || 0;
    const deductAmount = Number(withdraw.amount) || 0;
    const newWinningAmount = oldWinningAmount - deductAmount < 0 ? 0 : oldWinningAmount - deductAmount;

    user.winningAmount = String(newWinningAmount);
    await user.save();
  }

  return {
    message: `Withdraw has been ${status}`,
    withdraw
  };
};

exports.getFilteredGames = async (query) => {
  try {
    const {
      adminstatus,
      search,
      page = 1,
      limit = 10
    } = query;

    const filter = {
      status: { $in: ["completed", "quit"] },
    };

    if (adminstatus) filter.adminstatus = adminstatus;

    const userFilter = search
      ? { username: { $regex: search, $options: "i" } }
      : {};

    const skip = (page - 1) * limit;

    const games = await Game.find(filter)
      .populate({
        path: "createdBy acceptedBy",
        select: "username",
        match: userFilter
      })
      .skip(skip)
      .limit(parseInt(limit))
      .sort({ createdAt: -1 });

    const total = await Game.countDocuments(filter);

    return {
      status: statusCode.SUCCESS,
      success: true,
      message: "Games fetched successfully",
      data: games,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / limit),
      }
    };
  } catch (error) {
    console.error("Error in getFilteredGames:", error);
    return {
      status: statusCode.SERVER_ERROR,
      success: false,
      message: error.message
    };
  }
};

exports.decideGame = async (gameId, winnerId) => {
  try {
    const game = await Game.findById(gameId);
    if (!game) {
      return {
        status: statusCode.NOT_FOUND,
        success: false,
        message: "Game not found"
      };
    }

    if (game.adminstatus === "decided") {
      return {
        status: statusCode.BAD_REQUEST,
        success: false,
        message: "Game has already been decided"
      };
    }

    if (
      String(game.createdBy) !== String(winnerId) &&
      String(game.acceptedBy) !== String(winnerId)
    ) {
      return {
        status: statusCode.BAD_REQUEST,
        success: false,
        message: "Winner must be one of the players in this game"
      };
    }

    const loserId =
      String(game.createdBy) === String(winnerId)
        ? game.acceptedBy
        : game.createdBy;

    game.winner = winnerId;
    game.loser = loserId;
    game.adminstatus = "decided";
    game.status = "completed"; 
    await game.save();

    const user = await User.findById(winnerId);
    if (user) {
      const oldAmount = Number(user.winningAmount) || 0;
      const addAmount = Number(game.winningAmount) || 0;
      user.winningAmount = String(oldAmount + addAmount);
      await user.save();
    }

    return {
      status: statusCode.SUCCESS,
      success: true,
      message: "Game decided successfully",
      data: game
    };
  } catch (error) {
    console.error("Error in decideGame:", error);
    return {
      status: statusCode.SERVER_ERROR,
      success: false,
      message: error.message
    };
  }
};
