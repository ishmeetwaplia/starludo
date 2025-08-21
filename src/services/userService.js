const { statusCode, resMessage } = require('../config/constant');
const User = require('../models/User');

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
        if(!userInfo) {
            return {
                status: statusCode.NOT_FOUND,
                success: false,
                message: resMessage.User_not_found
            };
        }
        userInfo.username = username;
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