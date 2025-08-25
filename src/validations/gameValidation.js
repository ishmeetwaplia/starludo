const Joi = require("joi");

exports.createBet = Joi.object({
  betAmount: Joi.number().min(10).max(25000).required().messages({
    "number.base": "Bet amount must be a number",
    "number.min": "Bet must be at least 10 credits",
    "number.max": "Bet cannot exceed 25000 credits",
    "any.required": "Bet amount is required"
  }),
  roomId: Joi.number()
    .integer()
    .min(10000000)
    .max(99999999)
    .required()
    .messages({
      "number.base": "Room ID must be a number",
      "number.min": "Room ID must be exactly 8 digits",
      "number.max": "Room ID must be exactly 8 digits",
      "any.required": "Room ID is required"
    })
});