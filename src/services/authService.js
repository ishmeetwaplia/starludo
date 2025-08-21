const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const User = require("../models/User");
const { statusCode, resMessage } = require('../config/constant');
const FUNC = require('../functions/function');

exports.sendOTP = async (req) => {
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
    const { phone, password, confirmPassword } = req.body;
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

    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(password, salt);
    user.isRegistered = true;

    const token = jwt.sign({ id: user._id, phone: user.phone }, process.env.JWT_SECRET, {
      expiresIn: "7d",
    });
    
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