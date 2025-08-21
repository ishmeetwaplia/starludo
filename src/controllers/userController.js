const { statusCode } = require('../config/constant');
const service = require('../services/userService');

exports.profileController = async (req) => {
    try {
        return await service.profile(req);
    } catch (error) {
        return {
            status: statusCode.INTERNAL_SERVER_ERROR,
            success: false,
            message: error.message,
        };
    }
}

exports.logoutController = async (req) => {
    try {
        return await service.logout(req);
    } catch (error) {
        return {
            status: statusCode.INTERNAL_SERVER_ERROR,
            success: false,
            message: error.message,
        };
    }
}

exports.updateProfileController = async (req) => {
    try {
        return await service.updateProfile(req);
    } catch (error) {
        return {
            status: statusCode.INTERNAL_SERVER_ERROR,
            success: false,
            message: error.message,
        };
    }
}

exports.addCreditController = async (req) => {
  try {
    return await service.addCredit(req);
  } catch (error) {
    return {
      status: statusCode.INTERNAL_SERVER_ERROR,
      success: false,
      message: error.message,
    };
  }
};

exports.getCreditController = async (req) => {
  try {
    return await service.getCredit(req);
  } catch (error) {
    return {
      status: statusCode.INTERNAL_SERVER_ERROR,
      success: false,
      message: error.message,
    };
  }
};

