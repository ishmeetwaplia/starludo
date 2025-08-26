const adminService = require('../services/adminServices');

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
