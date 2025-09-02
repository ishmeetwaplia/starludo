const Joi = require("joi");

exports.createBet = Joi.object({
  betAmount: Joi.number().min(10).max(25000).required().messages({
    "number.base": "Bet amount must be a number",
    "number.min": "Bet must be at least 10 credits",
    "number.max": "Bet cannot exceed 25000 credits",
    "any.required": "Bet amount is required"
  }),
  roomId: Joi.string()
    .pattern(/^[0-9]{8}$/)
    .required()
    .messages({
      "string.pattern.base": "Room ID must be exactly 8 digits",
      "any.required": "Room ID is required"
    })
});

exports.submitWinning = Joi.object({
  gameId: Joi.string().required().messages({
    "any.required": "Game ID is required"
  }),
  result: Joi.string().valid("won", "lost").required().messages({
    "any.required": "Result is required",
    "any.only": "Result must be either 'won' or 'lost'"
  })
});
