const Joi = require("joi");

const createPaymentSchema = Joi.object({
  utrNumber: Joi.string().trim().required(),
  amount: Joi.number().min(10).max(25000).required(),
});

const getUserPaymentsSchema = Joi.object({
  page: Joi.number().integer().min(1).optional(),
  limit: Joi.number().integer().min(1).max(100).optional(),
});

module.exports = {
  createPaymentSchema,
  getUserPaymentsSchema,
};
