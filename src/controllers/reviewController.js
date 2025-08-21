const { statusCode } = require('../config/constant');
const service = require('../services/reviewService');

exports.createController = async (req) => {
    try {
        return await service.create(req);
    } catch (error) {
        return {
            status: statusCode.INTERNAL_SERVER_ERROR,
            success: false,
            message: error.message,
        };
    }
}

exports.reviewListController = async () => {
    try {
        return await service.reviewList();
    } catch (error) {
        return {
            status: statusCode.INTERNAL_SERVER_ERROR,
            success: false,
            message: error.message,
        };
    }
}

exports.statsController = async () => {
    try {
        return await service.stats();
    } catch (error) {
        return {
            status: statusCode.INTERNAL_SERVER_ERROR,
            success: false,
            message: error.message,
        };
    }
}