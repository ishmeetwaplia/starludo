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

exports.addCredit = async (req) => {
  try {
    const { _id } = req.auth;
    const { amount } = req.body;

    // validate amount
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

    // Add credit
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
