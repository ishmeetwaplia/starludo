const Joi = require("joi");

const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required(),
});

const createUserSchema = Joi.object({
  phone: Joi.string().pattern(/^[6-9]\d{9}$/).required(),
});

const updateUserSchema = Joi.object({
  fullName: Joi.string().min(2).max(100).optional(),
  isBanned: Joi.boolean().optional(),
  username: Joi.string().min(2).max(50).optional(),
  isActive: Joi.boolean().optional(),
  profile: Joi.string().optional()
});

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
});

module.exports = {
  loginSchema,
  createUserSchema,
  updateUserSchema,
  banUserSchema,
  getAllUsersSchema,
  getAllGamesSchema,
};
