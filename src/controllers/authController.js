const service = require('../services/authService');
const { statusCode } = require('../config/constant');

exports.registerController = async (req) => {
    try {
        return await service.register(req);
    } catch (error) {
        return {
            status: statusCode.INTERNAL_SERVER_ERROR,
            success: false,
            message: error.message,
        };
    }
};

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
};

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
};

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
};

exports.loginController = async (req) => {
    try {
        return await service.login(req);
    } catch (error) {
        return {
            status: statusCode.INTERNAL_SERVER_ERROR,
            success: false,
            message: error.message,
        };
    }
};

exports.forgotPasswordController = async (req) => {
    try {
        return await service.forgotPassword(req);
    } catch (error) {
        return {
            status: statusCode.INTERNAL_SERVER_ERROR,
            success: false,
            message: error.message,
        };
    }
};

exports.verifyForgotPasswordController = async (req) => {
    try {
        return await service.verifyForgotPassword(req);
    } catch (error) {
        return {
            status: statusCode.INTERNAL_SERVER_ERROR,
            success: false,
            message: error.message,
        };
    }
};