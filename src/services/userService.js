const { statusCode, resMessage } = require('../config/constant');
const User = require('../models/User');
const Payment = require('../models/Payment');
const Withdraw = require("../models/Withdraw");

exports.profile = async (req) => {
    try {
        const { _id } = req.auth;
        const userInfo = await User.findById(_id);
        if(!userInfo) {
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
    const {_id} = req.auth;

    const user = await User.findByIdAndUpdate(_id, { $unset: { token: "" } });
    if(!user) {
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

    if (username && userInfo.updateUsername) {
      userInfo.username = username;
      userInfo.updateUsername = false; 
    }

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

    return {
      status: statusCode.OK,
      success: true,
      message: "Credit fetched successfully",
      data: { credit: user.credit || 0 },
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

    const payments = await Payment.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

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
      upiId,
      bankAccount,
      ifsc
    });

    await withdraw.save();

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
