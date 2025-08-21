const Joi = require("joi");

exports.sendOTP = Joi.object({
  phone: Joi.string()
    .trim()
    .pattern(/^[0-9]+$/)
    .required()
    .messages({
      "any.required": "Phone is required",
      "string.pattern.base": "Phone can only contain numbers",
      "string.empty": "Phone cannot be empty",
    }),
});

exports.verifyOTP = Joi.object({
  phone: Joi.string()
    .trim()
    .pattern(/^[0-9]+$/)
    .required()
    .messages({
      "any.required": "Phone is required",
      "string.pattern.base": "Phone can only contain numbers",
      "string.empty": "Phone cannot be empty",
    }),
  otp: Joi.string()
    .trim()
    .length(6)
    .pattern(/^[0-9]+$/)
    .required()
    .messages({
      "any.required": "OTP is required",
      "string.length": "OTP must be 6 digits",
      "string.pattern.base": "OTP can only contain numbers",
      "string.empty": "OTP cannot be empty",
    }),
});

exports.password = Joi.object({
  phone: Joi.string()
    .trim()
    .pattern(/^[0-9]+$/)
    .required()
    .messages({
      "any.required": "Phone is required",
      "string.pattern.base": "Phone can only contain numbers",
      "string.empty": "Phone cannot be empty",
    }),
  password: Joi.string()
    .trim()
    .min(6)
    .required()
    .messages({
      "any.required": "Password is required",
      "string.min": "Password must be at least 6 characters long",
      "string.empty": "Password cannot be empty",
    }),
  confirmPassword: Joi.string()
    .trim()
    .min(6)
    .required()
    .messages({
      "any.required": "Password is required",
      "string.min": "Password must be at least 6 characters long",
      "string.empty": "Password cannot be empty",
    }),
});