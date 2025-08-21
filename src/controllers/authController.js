const service = require('../services/authService');
const { statusCode } = require('../config/constant');

exports.sendOTPController = async (req) => {
    try {
        return await service.sendOTP(req);
    } catch (error) {
        return {
            status: statusCode.INTERNAL_SERVER_ERROR,
            success: false,
            message: error.message,
        };
    }
}

exports.verifyOTPController = async (req) => {
    try {
        return await service.verifyOTP(req);
    } catch (error) {
        return {
            status: statusCode.INTERNAL_SERVER_ERROR,
            success: false,
            message: error.message,
        };
    }
}

exports.passwordController = async (req) => {
    try {
        return await service.password(req);
    } catch (error) {
        return {
            status: statusCode.INTERNAL_SERVER_ERROR,
            success: false,
            message: error.message,
        };
    }
}

exports.resendOTPController = async (req) => {
    try {
        return await service.resendOTP(req);
    } catch (error) {
        return {
            status: statusCode.INTERNAL_SERVER_ERROR,
            success: false,
            message: error.message,
        };
    }
}