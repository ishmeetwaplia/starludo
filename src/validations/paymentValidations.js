const Joi = require("joi");

const createPaymentSchema = Joi.object({
  utrNumber: Joi.string()
    .trim()
    .required()
    .messages({
      "string.base": "UTR number must be a text value",
      "string.empty": "UTR number is required",
      "any.required": "UTR number is mandatory",
    }),

  amount: Joi.number()
    .min(10)
    .max(25000)
    .required()
    .messages({
      "number.base": "Amount must be a valid number",
      "number.min": "Amount must be at least 10",
      "number.max": "Amount cannot exceed 25,000",
      "any.required": "Amount is required",
    }),
  screenshot: Joi.any()
    .optional()
});

module.exports = {
  createPaymentSchema,
};
