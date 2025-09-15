const express = require('express');
const adminController = require('../controllers/adminController');
const { protect } = require('../middleware/authMiddleware');
const { responseHandler } = require('../middleware/responseHandler');
const validate = require('../middleware/validate');
const upload = require('../middleware/upload');

const {
  loginSchema,
  createUserSchema,
  updateUserSchema,
  banUserSchema,
  getAllUsersSchema,
  getAllGamesSchema,
  addCreditSchema,
  getUserGameStatsQuerySchema,
  getAllPaymentsSchema,
  approvePaymentSchema,
  getAllWithdrawsSchema,
  approveWithdrawSchema,
  getFilteredGamesSchema,
  decideGameSchema,
  changeUserPasswordSchema,
  getAllReferralsSchema
} = require('../validations/adminValidations');

const router = express.Router();

router.post('/login', validate(loginSchema), responseHandler(adminController.loginAdmin));
router.get('/dashboard', protect, responseHandler(adminController.getAdminDashboard));
router.post("/upload-scanner", protect, upload.single("scanner"), responseHandler(adminController.uploadScanner));
router.post(
  "/upload-assets",
  protect,
  upload.fields([
    { name: "banners", maxCount: 10 },        
    { name: "tournaments", maxCount: 10 }    
  ]),
  responseHandler(adminController.uploadAssets)
);


// Admin -> manage users
router.post("/users", protect, validate(createUserSchema), responseHandler(adminController.createUser));
router.delete("/users/:id", protect, responseHandler(adminController.deleteUser));
router.get("/users/:id", protect, responseHandler(adminController.getUserById));
router.get("/users", protect, validate(getAllUsersSchema, "query"), responseHandler(adminController.getAllUsers));
router.patch("/users/:id/ban", protect, validate(banUserSchema), responseHandler(adminController.banUnbanUser));
router.put("/users/:id", protect, validate(updateUserSchema), responseHandler(adminController.updateUser));
router.put("/users/:id/credit", protect, validate(addCreditSchema), responseHandler(adminController.addCredit));
router.get("/users/:id/games", protect,  validate(getUserGameStatsQuerySchema, "query"), responseHandler(adminController.getUserGameStats));
router.get( "/users/:id/payments", protect ,responseHandler( adminController.getUserPayments));
router.get( "/users/:id/withdraws", protect, responseHandler(adminController.getUserWithdraws));
router.post('/user/:id/change-password', protect, validate(changeUserPasswordSchema), responseHandler(adminController.changeUserPasswordController));

//Admin -> game 
router.get("/games", protect, validate(getAllGamesSchema, "query"), responseHandler(adminController.getAllGames));
router.get( "/games-compleated", protect, validate(getFilteredGamesSchema), responseHandler(adminController.getFilteredGames));
router.post( "/games/decide", protect, validate(decideGameSchema), responseHandler(adminController.decideGame));

//Admin -> payments 
router.get("/payments", protect, validate(getAllPaymentsSchema, "query"), responseHandler(adminController.getAllPayments));
router.patch( "/payments/:id/approve", protect, validate(approvePaymentSchema), responseHandler(adminController.approvePayment));

router.get( '/withdraws', protect, validate(getAllWithdrawsSchema, 'query'), responseHandler(adminController.getAllWithdraws));
router.patch( "/withdraws/:id/approve", protect, validate(approveWithdrawSchema), responseHandler(adminController.approveWithdraw));

//Admin -> referrals
router.get("/referrals", protect, validate(getAllReferralsSchema), responseHandler(adminController.getAllReferralsController));

module.exports = router;
