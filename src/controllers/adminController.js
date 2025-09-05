const adminService = require('../services/adminServices');
const { statusCode } = require('../config/constant')

exports.loginAdmin = async (req) => {
  const result = await adminService.login(req.body);
  return result;
};

exports.getAdminDashboard = async (req) => {
  const result = await adminService.getDashboard(req.admin.id);
  return result;
};

exports.createUser = async (req) => {
  const result = await adminService.createUser(req.body);
  return result;
};

exports.deleteUser = async (req) => {
  const result = await adminService.deleteUser(req.params.id);
  return result;
};

exports.getUserById = async (req) => {
  const result = await adminService.getUserById(req.params.id);
  return result;
};

exports.getAllUsers = async (req) => {
  const result = await adminService.getAllUsers(req.query);
  return result;
};

exports.banUnbanUser = async (req) => {
  const result = await adminService.banUnbanUser(req.params.id, req.body.isBanned);
  return result;
};

exports.updateUser = async (req) => {
  const result = await adminService.updateUser(req.params.id, req.body);
  return result;
};

exports.uploadScanner = async (req) => {
  const file = req.file;
  const upiId = req.body.upiId; 
  const result = await adminService.uploadScannerImage(req.admin.id, file, upiId);
  return result;
};

exports.getAllGames = async (req) => {
  const result = await adminService.getAllGames(req.query);
  return result;
};

exports.addCredit = async (req) => {
  const result = await adminService.addCredit(req.params.id, req.body.credit);
  return result;
};

exports.getUserGameStats = async (req) => {
  const result = await adminService.getUserGameStats(req.params.id, req.query);
  return result;
};

exports.uploadAssets = async (req) => {
  const banners = req.files["banners"] || [];
  const tournaments = req.files["tournaments"] || [];

  const result = await adminService.uploadAssetsService(
    banners,
    tournaments
  );

  return result;
};

exports.getAllPayments = async (req) => {
  const result = await adminService.getAllPayments(req.query);
  return result;
};

exports.approvePayment = async (req) => {
  const { id } = req.params;
  const { status } = req.body;
  const result = await adminService.approvePayment(id, status);
  return result;
};

exports.getUserPayments = async (req) => {
  const result = await adminService.getUserPayments(req.params.id, req.query);
  return result;
};

exports.getUserWithdraws = async (req) => {
  const result = await adminService.getUserWithdraws(req.params.id, req.query);
  return result;
};

exports.getAllWithdraws = async (req) => {
  const result = await adminService.getAllWithdraws(req.query);
  return result;
};

exports.approveWithdraw = async (req) => {
  const { id } = req.params;
  const { status } = req.body; 
  const result = await adminService.approveWithdraw(id, status);
  return result;
};

exports.getFilteredGames = async (req, res) => {
  const result = await adminService.getFilteredGames(req.query);
  return result;
};

exports.decideGame = async (req, res) => {
  const { gameId, winnerId } = req.body;
  const result = await adminService.decideGame(gameId, winnerId);
  return result;
};

exports.changeUserPasswordController = async (req) => {
    try {
        return await adminService.changeUserPassword(req);
    } catch (error) {
        return {
            status: statusCode.INTERNAL_SERVER_ERROR,
            success: false,
            message: error.message,
        };
    }
};