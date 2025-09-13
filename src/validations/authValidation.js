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

exports.register = Joi.object({
  phone: Joi.string()
    .trim()
    .pattern(/^[0-9]+$/)
    .required()
    .messages({
      "any.required": "Phone is required",
      "string.pattern.base": "Phone can only contain numbers",
      "string.empty": "Phone cannot be empty",
    }),

  username: Joi.string()
    .trim()
    .min(3)
    .max(30)
    .required()
    .messages({
      "any.required": "Username is required",
      "string.empty": "Username cannot be empty",
      "string.min": "Username must be at least 3 characters long",
      "string.max": "Username must not be longer than 30 characters",
    }),

  password: Joi.string()
    .trim()
    .min(6)
    .required()
    .messages({
      "any.required": "Password is required",
      "string.empty": "Password cannot be empty",
      "string.min": "Password must be at least 6 characters long",
    }),

  securityQuestions: Joi.array()
    .items(
      Joi.object({
        question: Joi.string().required(),
        answer: Joi.string().required(),
      })
    )
    .optional(),

  referralCode: Joi.string()
    .alphanum()
    .trim()
    .optional()
    .messages({
      "string.alphanum": "Referral code must be alphanumeric",
      "string.empty": "Referral code cannot be empty",
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

exports.login = Joi.object({
  username: Joi.string().trim().required().messages({
    "any.required": "Username is required",
    "string.empty": "Username cannot be empty",
  }),
  password: Joi.string().min(6).required().messages({
    "any.required": "Password is required",
    "string.min": "Password must be at least 6 characters",
    "string.empty": "Password cannot be empty",
  }),
});

exports.forgotPassword = Joi.object({
  username: Joi.string().trim().required().messages({
    "any.required": "Username is required",
    "string.empty": "Username cannot be empty",
  })
});

exports.verifyForgotPassword = Joi.object({
  username: Joi.string()
    .trim()
    .required()
    .messages({
      "any.required": "Username is required",
      "string.empty": "Username cannot be empty",
    }),

  index: Joi.number()
    .integer()
    .min(0)
    .required()
    .messages({
      "any.required": "Security question index is required",
      "number.base": "Index must be a number",
      "number.min": "Index cannot be negative",
    }),

  answer: Joi.string()
    .trim()
    .required()
    .messages({
      "any.required": "Answer is required",
      "string.empty": "Answer cannot be empty",
    }),

  newPassword: Joi.string()
    .trim()
    .min(6)
    .required()
    .messages({
      "any.required": "New password is required",
      "string.empty": "New password cannot be empty",
      "string.min": "New password must be at least 6 characters long",
    }),
});
