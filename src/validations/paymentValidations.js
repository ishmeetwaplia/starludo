const Joi = require("joi");

const createPaymentSchema = Joi.object({
  utrNumber: Joi.string().trim().required(),
  amount: Joi.number().min(10).max(25000).required(),
});

module.exports = {
  createPaymentSchema,
  getUserPaymentsSchema,
};
