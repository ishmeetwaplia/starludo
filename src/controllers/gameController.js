const { statusCode } = require("../config/constant");
const service = require("../services/gameService");

exports.createBetController = async (req) => {
  try {
    return await service.createBet(req);
  } catch (error) {
    return {
      status: statusCode.INTERNAL_SERVER_ERROR,
      success: false,
      message: error.message
    };
  }
};

exports.submitWinningController = async (req) => {
  try {
    return await service.submitWinning(req);
  } catch (error) {
    return {
      status: statusCode.INTERNAL_SERVER_ERROR,
      success: false,
      message: error.message
    };
  }
};

exports.getUserGameHistoryController = async (req) => {
  try {
    return await service.getUserGameHistory(req);
  } catch (error) {
    return {
      status: statusCode.INTERNAL_SERVER_ERROR,
      success: false,
      message: error.message
    };
  }
};