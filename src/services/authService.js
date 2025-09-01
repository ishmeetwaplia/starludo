const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const User = require("../models/User");
const { statusCode, resMessage } = require('../config/constant');
const FUNC = require('../functions/function');

exports.register = async (req) => {
  try {
    const { phone, username, password } = req.body;

    let user = await User.findOne({ phone });
    if (user) {
      return {
        status: statusCode.BAD_REQUEST,
        success: false,
        message: "User already exists with this phone number",
      };
    }

    let existingUsername = await User.findOne({ username });
    if (existingUsername) {
      return {
        status: statusCode.BAD_REQUEST,
        success: false,
        message: "Username is already taken, please choose another one",
      };
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    user = new User({
      phone,
      username,
      password: hashedPassword,
      isRegistered: true,
    });

    await user.save();

    return {
      status: statusCode.OK,
      success: true,
      message: "User registered successfully",
    };
  } catch (error) {
    return {
      status: statusCode.INTERNAL_SERVER_ERROR,
      success: false,
      message: error.message,
    };
  }
};

exports.verifyOTP = async (req, res) => {
  try {
    const { phone, otp } = req.body;
    const user = await User.findOne({ phone });

    if (!user) {
      return {
        status: statusCode.BAD_REQUEST,
        success: false,
        message: resMessage.User_not_found,
      }
    }

    if (user.otp !== otp || user.otpExpire < Date.now()) {
      return {
        status: statusCode.BAD_REQUEST,
        success: false,
        message: resMessage.Invalid_or_expired_OTP,
      }
    }

    user.otp = null;
    user.otpExpire = null;

    const token = jwt.sign({ id: user._id, phone: user.phone }, process.env.JWT_SECRET, {
      expiresIn: "7d",
    });

    user.token = token;
    await user.save();

    if (user.isRegistered) {
      return {
        status: statusCode.OK,
        success: true,
        message: resMessage.OTP_verified_successfully,
        data: { token },
      }
    }

    return {
      status: statusCode.OK,
      success: true,
      message: resMessage.OTP_verified_successfully
    }
  } catch (error) {
    return {
      status: statusCode.INTERNAL_SERVER_ERROR,
      success: false,
      message: error.message
    };
  }
};

exports.password = async (req, res) => {
  try {
    const { phone, password, confirmPassword, referCode } = req.body;
    if (password !== confirmPassword) {
      return {
        status: statusCode.BAD_REQUEST,
        success: false,
        message: resMessage.Passwords_do_not_match,
      }
    }

    const user = await User.findOne({ phone });
    if (!user) {
      return {
        status: statusCode.BAD_REQUEST,
        success: false,
        message: resMessage.User_not_found,
      }
    }

    const existingRefer = await User.findOne({ referCode });
    if (referCode && !existingRefer) {
      return {
        status: statusCode.BAD_REQUEST,
        success: false,
        message: resMessage.Invalid_refer_code,
      }
    }

    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(password, salt);
    user.isRegistered = true;

    const token = jwt.sign({ id: user._id, phone: user.phone }, process.env.JWT_SECRET, {
      expiresIn: "7d",
    });
    
    user.referBy = existingRefer ? existingRefer._id : null;
    user.token = token;
    user.username = FUNC.generateUsername();
    user.referCode = FUNC.generateOTP();
    await user.save();

    return {
      status: statusCode.OK,
      success: true,
      message: resMessage.Password_created,
      data: { token }
    }
  } catch (error) {
    return {
      status: statusCode.INTERNAL_SERVER_ERROR,
      success: false,
      message: error.message
    };
  }
};

exports.resendOTP = async (req) => {
  try {
    const { phone } = req.body;

    let user = await User.findOne({ phone });
    if (!user) user = new User({ phone });

    const otp = "123456"
    user.otp = otp;
    user.otpExpire = Date.now() + 5 * 60 * 1000;

    await user.save();

    console.log(`OTP for ${phone} is ${otp}`);

    return {
      status: statusCode.OK,
      success: true,
      message: resMessage.OTP_SENT,
    }
  } catch (error) {
    return {
      status: statusCode.INTERNAL_SERVER_ERROR,
      success: false,
      message: error.message
    };
  }
};

exports.login = async (req) => {
  try {
    const { username, password } = req.body;

    const user = await User.findOne({ username }).select("+password");
    if (!user) {
      return {
        status: statusCode.BAD_REQUEST,
        success: false,
        message: resMessage.User_not_found || "User not found",
      };
    }

    if (!user.isRegistered) {
      return {
        status: statusCode.BAD_REQUEST,
        success: false,
        message: "User is not registered yet",
      };
    }

    if (user.isBanned) {
      return {
        status: statusCode.BAD_REQUEST,
        success: false,
        message: "User is banned",
      };
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return {
        status: statusCode.BAD_REQUEST,
        success: false,
        message: resMessage.Invalid_credentials || "Invalid username or password",
      };
    }

    const token = jwt.sign({ id: user._id.toString() }, process.env.JWT_SECRET, {
      expiresIn: "1d",
    });

    user.token = token;
    await user.save();

    return {
      status: statusCode.OK,
      success: true,
      message: resMessage.Login_success || "Login successful",
      data: {
        token,
        userId: user._id.toString(),
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

