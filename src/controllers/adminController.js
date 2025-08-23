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

exports.uploadScanners = async (req) => {
  const files = req.files;
  const result = await adminService.uploadScannerImages(req.admin.id, files);
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