const { statusCode, resMessage } = require('../config/constant');
const User = require('../models/User');
const Payment = require('../models/Payment');
const Withdraw = require("../models/Withdraw");
const bcrypt = require("bcryptjs");
const Referral = require("../models/Referral");
const mongoose = require("mongoose");

exports.profile = async (req) => {
  try {
    const { _id } = req.auth;
    const userInfo = await User.findById(_id);
    if (!userInfo) {
      return {
        status: statusCode.NOT_FOUND,
        success: false,
        message: resMessage.User_not_found
      };
    }
    return {
      status: statusCode.OK,
      success: true,
      message: resMessage.Profile_fetched_successfully,
      data: userInfo
    };
  } catch (error) {
    return {
      status: statusCode.INTERNAL_SERVER_ERROR,
      success: false,
      message: error.message
    };
  }
}

exports.logout = async (req, res) => {
  try {
    const { _id } = req.auth;

    const user = await User.findByIdAndUpdate(_id, { $unset: { token: "" } });
    if (!user) {
      return {
        status: statusCode.NOT_FOUND,
        success: false,
        message: resMessage.User_not_found
      }
    }

    return {
      status: statusCode.OK,
      success: true,
      message: resMessage.Logout_successful,
    }
  } catch (error) {
    return res.status(statusCode.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: error.message,
    });
  }
};

exports.updateProfile = async (req) => {
  try {
    const { _id } = req.auth;
    const { username } = req.body;
    const userInfo = await User.findById(_id);
    if (!userInfo) {
      return {
        status: statusCode.NOT_FOUND,
        success: false,
        message: resMessage.User_not_found
      };
    }

    if (!username || !userInfo.updateUsername) {
      return {
        status: statusCode.BAD_REQUEST,
        success: false,
        message: "Username can't be updated."
      };
    }
    userInfo.username = username;
    userInfo.updateUsername = false;

    await userInfo.save();

    return {
      status: statusCode.OK,
      success: true,
      message: resMessage.Profile_fetched_successfully,
      data: userInfo
    };
  } catch (error) {
    return {
      status: statusCode.INTERNAL_SERVER_ERROR,
      success: false,
      message: error.message
    };
  }
}

exports.addCredit = async (req) => {
  try {
    const { _id } = req.auth;
    const { amount } = req.body;

    if (!amount || amount < 10 || amount > 25000) {
      return {
        status: statusCode.BAD_REQUEST,
        success: false,
        message: "Credit amount must be between 10 and 25000"
      };
    }

    const user = await User.findById(_id);
    if (!user) {
      return {
        status: statusCode.NOT_FOUND,
        success: false,
        message: resMessage.User_not_found
      };
    }

    user.credit += amount;
    await user.save();

    return {
      status: statusCode.OK,
      success: true,
      message: "Credit added successfully",
      data: { credit: user.credit }
    };
  } catch (error) {
    return {
      status: statusCode.INTERNAL_SERVER_ERROR,
      success: false,
      message: error.message
    };
  }
};

exports.getCredit = async (req) => {
  try {
    const { _id } = req.auth;
    const user = await User.findById(_id);

    if (!user) {
      return {
        status: statusCode.NOT_FOUND,
        success: false,
        message: resMessage.User_not_found,
      };
    }
    const amount = user.credit + user.referralEarning;
    return {
      status: statusCode.OK,
      success: true,
      message: "Credit fetched successfully",
      data: { credit: amount || 0 },
    };
  } catch (error) {
    return {
      status: statusCode.INTERNAL_SERVER_ERROR,
      success: false,
      message: error.message,
    };
  }
};

exports.getUserPayments = async (req) => {
  try {
    const { _id } = req.auth;
    let { page = 1, limit = 10, minAmount, maxAmount, status, startDate, endDate } = req.query;

    page = Number(page);
    limit = Number(limit);

    const filter = { userId: _id };

    if (status && ["pending", "approved", "rejected"].includes(status)) {
      filter.status = status;
    }

    if (minAmount || maxAmount) {
      filter.amount = {};
      if (minAmount) filter.amount.$gte = Number(minAmount);
      if (maxAmount) filter.amount.$lte = Number(maxAmount);
    }

    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) filter.createdAt.$gte = new Date(startDate);
      if (endDate) filter.createdAt.$lte = new Date(endDate);
    }

    let payments = await Payment.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    payments = payments.map((p) => {
      const obj = p.toObject();
      if (obj.screenshot) {
        obj.screenshot = obj.screenshot.replace(
          "/www/indianludoking.com/staLudo",
          ""
        );
      }
      return obj;
    });

    const total = await Payment.countDocuments(filter);

    return {
      status: statusCode.OK,
      success: true,
      message: "Payments fetched successfully",
      data: {
        payments,
        pagination: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
        },
      },
    };
  } catch (error) {
    return {
      status: statusCode.INTERNAL_SERVER_ERROR,
      success: false,
      message: error.message,
    };
  }
};

exports.createWithdraw = async (req) => {
  try {
    const { _id } = req.auth;
    const { amount, upiId, bankAccount, ifsc } = req.body;

    const user = await User.findById(_id);
    if (!user) {
      return {
        status: statusCode.NOT_FOUND,
        success: false,
        message: resMessage.User_not_found
      };
    }

    if (Number(user.winningAmount) < 200) {
      return {
        status: statusCode.BAD_REQUEST,
        success: false,
        message: "You must have at least 200 in winning amount to withdraw"
      };
    }

    const maxWithdrawable =
      Number(user.winningAmount) -
      Number(user.penalty)

    if (amount > maxWithdrawable) {
      return {
        status: statusCode.BAD_REQUEST,
        success: false,
        message: `Maximum withdrawable amount is ${maxWithdrawable}`
      };
    }

    const existingWithdraw = await Withdraw.findOne({ userId: _id, status: "unpaid" });
    if (existingWithdraw) {
      return {
        status: statusCode.BAD_REQUEST,
        success: false,
        message: "You already have a pending withdraw request"
      };
    }

    const withdraw = new Withdraw({
      userId: _id,
      amount,
      userAmount:  Number(amount),
      upiId,
      bankAccount,
      ifsc
    });

    await withdraw.save();

    if (global.io) {
      global.io.emit("new_withdraw", withdraw);
    }

    return {
      status: statusCode.OK,
      success: true,
      message: "Withdraw request created successfully",
      data: withdraw
    };
  } catch (error) {
    return {
      status: statusCode.INTERNAL_SERVER_ERROR,
      success: false,
      message: error.message
    };
  }
};

exports.withdrawHistory = async (req) => {
  try {
    const { _id } = req.auth;

    const history = await Withdraw.find({ userId: _id })
      .sort({ createdAt: -1 });

    return {
      status: statusCode.OK,
      success: true,
      message: "Withdraw history fetched successfully",
      data: history
    }
  } catch (error) {
    return {
      status: statusCode.INTERNAL_SERVER_ERROR,
      success: false,
      message: error.message
    };
  }
}

exports.resetPassword = async (req) => {
  try {
    const { _id } = req.auth;
    const { oldPassword, newPassword } = req.body;

    if (!oldPassword || !newPassword) {
      return {
        status: statusCode.BAD_REQUEST,
        success: false,
        message: "Old password and new password are required",
      };
    }

    const user = await User.findById(_id).select("+password");
    if (!user) {
      return {
        status: statusCode.NOT_FOUND,
        success: false,
        message: resMessage.User_not_found || "User not found",
      };
    }

    if (user.role !== "user") {
      return {
        status: statusCode.FORBIDDEN,
        success: false,
        message: "Only users are allowed to reset password",
      };
    }

    const isMatch = await bcrypt.compare(oldPassword, user.password);
    if (!isMatch) {
      return {
        status: statusCode.BAD_REQUEST,
        success: false,
        message: "Old password is incorrect",
      };
    }

    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);
    user.token = null;
    await user.save();

    return {
      status: statusCode.OK,
      success: true,
      message: "Password updated successfully",
    };
  } catch (error) {
    return {
      status: statusCode.INTERNAL_SERVER_ERROR,
      success: false,
      message: error.message,
    };
  }
};

exports.getReferrals = async (req) => {
  try {
    const { _id: currentUserId } = req.auth;
    let {
      page = 1,
      limit = 10,
      search,
      winningMin,
      winningMax,
      referralMin,
      referralMax,
      fromDate,
      toDate,
    } = req.query;

    page = Number(page) || 1;
    limit = Number(limit) || 10;
    const skip = (page - 1) * limit;
    const baseMatch = { referred_by: new mongoose.Types.ObjectId(String(currentUserId)) };
    const pipeline = [
      { $match: baseMatch },
      {
        $lookup: {
          from: "users",
          localField: "winner",
          foreignField: "_id",
          as: "winner"
        }
      },
      { $unwind: "$winner" }
    ];

    if (search && String(search).trim().length > 0) {
      pipeline.push({
        $match: {
          "winner.username": { $regex: String(search).trim(), $options: "i" }
        }
      });
    }

    pipeline.push({ $unwind: "$wins" });
    const winFilters = [];

    if (winningMin !== undefined) {
      const v = Number(winningMin);
      if (!Number.isNaN(v)) {
        winFilters.push({ "wins.winningAmount": { $gte: v } });
      } 
    }
    if (winningMax !== undefined) {
      const v = Number(winningMax);
      if (!Number.isNaN(v)) {
        winFilters.push({ "wins.winningAmount": { $lte: v } });
      }
    }

    if (referralMin !== undefined) {
      const v = Number(referralMin);
      if (!Number.isNaN(v)) {
        winFilters.push({ "wins.referralEarning": { $gte: v } });
      }
    }
    if (referralMax !== undefined) {
      const v = Number(referralMax);
      if (!Number.isNaN(v)) {
        winFilters.push({ "wins.referralEarning": { $lte: v } });
      }
    }

    if (fromDate) {
      const d = new Date(fromDate);
      if (!Number.isNaN(d.getTime())) {
        winFilters.push({ "wins.createdAt": { $gte: d } });
      }
    }
    if (toDate) {
      const d = new Date(toDate);
      if (!Number.isNaN(d.getTime())) {
        winFilters.push({ "wins.createdAt": { $lte: d } });
      }
    }

    if (winFilters.length > 0) {
      pipeline.push({ $match: { $and: winFilters } });
    }

    pipeline.push({
      $group: {
        _id: "$_id",
        winner: { $first: "$winner" },
        referred_by: { $first: "$referred_by" },
        wins: { $push: "$wins" },
        createdAt: { $first: "$createdAt" },
        updatedAt: { $first: "$updatedAt" }
      }
    });

    pipeline.push({ $sort: { createdAt: -1 } });

    pipeline.push({
      $facet: {
        data: [{ $skip: skip }, { $limit: limit }],
        totalCount: [{ $count: "total" }]
      }
    });

    const result = await Referral.aggregate(pipeline);

    const data = (result[0] && result[0].data) || [];
    const total = (result[0] && result[0].totalCount && result[0].totalCount[0] && result[0].totalCount[0].total) || 0;

    const items = data.map((doc) => ({
      id: doc._id,
      winner: {
        _id: doc.winner._id,
        username: doc.winner.username,
        profile: doc.winner.profile || null
      },
      referred_by: doc.referred_by,
      wins: doc.wins,
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt
    }));

    return {
      status: statusCode.OK,
      success: true,
      message: "Referrals fetched successfully",
      data: {
        items,
        pagination: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit)
        }
      }
    };
  } catch (error) {
    console.error("[getReferrals] error:", error);
    return {
      status: statusCode.INTERNAL_SERVER_ERROR,
      success: false,
      message: error.message
    };
  }
};
