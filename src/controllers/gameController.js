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

exports.listGamesController = async (req) => {
  try {
    return await service.listGames(req);
  } catch (error) {
    return {
      status: statusCode.INTERNAL_SERVER_ERROR,
      success: false,
      message: error.message
    };
  }
};

