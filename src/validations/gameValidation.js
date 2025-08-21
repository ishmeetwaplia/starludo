const Joi = require("joi");

exports.createBet = Joi.object({
  betAmount: Joi.number().min(10).max(25000).required().messages({
    "number.base": "Bet amount must be a number",
    "number.min": "Bet must be at least 10 credits",
    "number.max": "Bet cannot exceed 25000 credits",
    "any.required": "Bet amount is required"
  })
});
