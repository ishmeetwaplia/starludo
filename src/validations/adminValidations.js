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
  dob: Joi.date().iso().optional(),
  gender: Joi.string().valid("Male", "Female", "Other").optional(),
  aadhaarNumber: Joi.string().pattern(/^\d{12}$/).optional(),
  address: Joi.string().max(200).optional(),
  email: Joi.string().email().optional(),
  isBanned: Joi.boolean().optional(),
  username: Joi.string().min(2).max(50).optional(),
  isActive: Joi.boolean().optional()
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

const getAllUsersFinance = Joi.object({
  isActive: Joi.boolean().optional(),
  isBanned: Joi.boolean().optional(),
  search: Joi.string().optional(),
  page: Joi.number().integer().min(1).optional(),
  limit: Joi.number().integer().min(1).max(100).optional(),
});

module.exports = {
  loginSchema,
  createUserSchema,
  updateUserSchema,
  banUserSchema,
  getAllUsersSchema,
  getAllUsersFinance,
};
