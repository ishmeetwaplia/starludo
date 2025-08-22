const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const Admin = require("../models/Admin");
const User = require("../models/User");
const { statusCode, resMessage } = require("../config/constant");

exports.login = async ({ email, password }) => {
  try {
    const admin = await Admin.findOne({ email });
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
      { id: admin._id, email: admin.email },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    return {
      success: true,
      status: statusCode.OK,
      message: resMessage.LOGIN_SUCCESS,
      data: { id: admin._id, email: admin.email, token }
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
    const admin = await Admin.findById(adminId).select("-password");
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

    // Fields that cannot be updated
    const restrictedFields = [
      "phone",
      "otp",
      "otpExpire",
      "isRegistered"
    ];

    for (const key of Object.keys(userData)) {
      if (restrictedFields.includes(key)) {
        continue;
      }
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

exports.getAllUsersFinance = async (query) => {
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
      .limit(Number(limit))
      .select("fullName username phone cashWon referralEarning penalty winningAmount credit");

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
