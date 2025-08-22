const express = require('express');
const adminController = require('../controllers/adminController');
const { protect } = require('../middleware/authMiddleware');
const { responseHandler } = require('../middleware/responseHandler');
const validate = require('../middleware/validate');
const {
  loginSchema,
  createUserSchema,
  updateUserSchema,
  banUserSchema,
  getAllUsersSchema,
} = require('../validations/adminValidations');

const router = express.Router();

router.post('/login', validate(loginSchema), responseHandler(adminController.loginAdmin));
router.get('/dashboard', protect, responseHandler(adminController.getAdminDashboard));

// Admin -> manage users
router.post("/users", protect, validate(createUserSchema), responseHandler(adminController.createUser));
router.delete("/users/:id", protect, responseHandler(adminController.deleteUser));
router.get("/users/:id", protect, responseHandler(adminController.getUserById));
router.get("/users", protect, validate(getAllUsersSchema, "query"), responseHandler(adminController.getAllUsers));
router.patch("/users/:id/ban", protect, validate(banUserSchema), responseHandler(adminController.banUnbanUser));
router.put("/users/:id", protect, validate(updateUserSchema), responseHandler(adminController.updateUser));

module.exports = router;
