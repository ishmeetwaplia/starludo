const Joi = require("joi");

const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required(),
});

const createUserSchema = Joi.object({
  phone: Joi.string().pattern(/^[6-9]\d{9}$/).required(),
});

const updateUserSchema = Joi.object({
  password: Joi.string().min(6).optional(),
  profile: Joi.string().optional(),
  username: Joi.string().min(2).max(50).optional(),
  cashWon: Joi.string().optional(),
  battlePlayed: Joi.string().optional(),
  penalty: Joi.string().optional(),
  winningAmount: Joi.string().optional(),
  completedGames: Joi.string().optional(),
  isRegistered: Joi.boolean().optional(),
  credit: Joi.number().optional(),
  isBanned: Joi.boolean().optional(),
  isActive: Joi.boolean().optional(),
  fullName: Joi.string().min(2).max(100).optional()
}).unknown(true);

const banUserSchema = Joi.object({
  isBanned: Joi.boolean().required(),
});

const getAllUsersSchema = Joi.object({
  isActive: Joi.boolean().optional(),
  isBanned: Joi.boolean().optional(),
  search: Joi.string().optional(),
  page: Joi.number().integer().min(1).optional(),
  limit: Joi.number().integer().min(1).max(100).optional(),
});

const getAllGamesSchema = Joi.object({
  status: Joi.string()
    .valid("pending", "accepted", "completed", "cancelled", "expired")
    .optional(),
  betAmountMin: Joi.number().min(0).optional(),
  betAmountMax: Joi.number().min(0).optional(),
  winningAmountMin: Joi.number().min(0).optional(),
  winningAmountMax: Joi.number().min(0).optional(),
  page: Joi.number().integer().min(1).optional(),
  limit: Joi.number().integer().min(1).max(100).optional(),
  search: Joi.string().trim().optional(),
});

const addCreditSchema = Joi.object({
  credit: Joi.number().min(1).required()
});

const getUserGameStatsQuerySchema = Joi.object({
  type: Joi.string().valid("created", "accepted", "won", "lost", "quit", "played").optional(),
  page: Joi.number().integer().min(1).optional(),
  limit: Joi.number().integer().min(1).max(100).optional(),
});

const updateScannerOrUpiSchema = Joi.object({
  scannerUrl: Joi.string().uri().optional(),
  upiId: Joi.string().pattern(/^[\w.-]+@[\w.-]+$/).optional(),
}).or("scannerUrl", "upiId");

const getAllPaymentsSchema = Joi.object({
  status: Joi.string()
    .valid("pending", "approved", "rejected")
    .optional(),
  search: Joi.string().trim().optional(),
  page: Joi.number().integer().min(1).optional(),
  limit: Joi.number().integer().min(1).max(100).optional(),
});

const approvePaymentSchema = Joi.object({
  status: Joi.string().valid("approved", "rejected").required()
});

const paymentValidation = {
  getUserPayments: {
    query: Joi.object({
      page: Joi.number().integer().min(1).default(1),
      limit: Joi.number().integer().min(1).max(100).default(10),
      minAmount: Joi.number().min(0),
      maxAmount: Joi.number().min(0),
      status: Joi.string().valid("pending", "approved", "rejected"),
    }),
  },
};

const withdrawValidation = {
  getUserWithdraws: {
    query: Joi.object({
      page: Joi.number().integer().min(1).default(1),
      limit: Joi.number().integer().min(1).max(100).default(10),
      minAmount: Joi.number().min(0),
      maxAmount: Joi.number().min(0),
      status: Joi.string().valid("unpaid", "paid", "rejected"),
    }),
  },
};

const getAllWithdrawsSchema = Joi.object({
  status: Joi.string()
    .valid("unpaid", "paid", "rejected")
    .optional(),
  search: Joi.string().trim().optional(),
  page: Joi.number().integer().min(1).optional(),
  limit: Joi.number().integer().min(1).max(100).optional(),
});

const getAllReferralsSchema = Joi.object({
  search: Joi.string().trim().optional(),
  minWinningAmount: Joi.number().integer().min(0).optional(),
  maxWinningAmount: Joi.number().integer().min(0).optional(),
  page: Joi.number().integer().min(1).optional(),
  limit: Joi.number().integer().min(1).max(100).optional(),
});

const approveWithdrawSchema = Joi.object({
  status: Joi.string().valid('paid', 'rejected').required()
});

const getFilteredGamesSchema = Joi.object({
  adminstatus: Joi.string().valid("pending", "approved", "rejected").optional(),
  search: Joi.string().optional(),
  page: Joi.number().integer().min(1).optional(),
  limit: Joi.number().integer().min(1).max(100).optional(),
});

const decideGameSchema = Joi.object({
  gameId: Joi.string().required().messages({
    "any.required": "Game ID is required"
  }),
  winnerId: Joi.string().required().messages({
    "any.required": "Winner user ID is required"
  })
});

const changeUserPasswordSchema = Joi.object({
  newPassword: Joi.string()
    .min(6)
    .optional()
    .messages({
      "string.empty": "Password cannot be empty",
      "string.min": "Password must be at least 6 characters long",
    }),
});

module.exports = {
  loginSchema,
  createUserSchema,
  updateUserSchema,
  banUserSchema,
  getAllUsersSchema,
  getAllGamesSchema,
  addCreditSchema,
  getUserGameStatsQuerySchema,
  updateScannerOrUpiSchema,
  getAllPaymentsSchema,
  approvePaymentSchema,
  paymentValidation,
  withdrawValidation,
  getAllWithdrawsSchema,
  approveWithdrawSchema,
  getFilteredGamesSchema,
  decideGameSchema,
  changeUserPasswordSchema,
  getAllReferralsSchema
};
