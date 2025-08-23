const { getAssetsService, getScannersService } = require("../services/assetService");

exports.getAssets = async (req, res) => {
  const result = await getAssetsService();
  return res.status(result.status).json(result);
};

exports.getScanners = async (req, res) => {
  const result = await getScannersService();
  return res.status(result.status).json(result);
};
