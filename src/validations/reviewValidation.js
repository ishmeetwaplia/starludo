const Joi = require("joi");

exports.create = Joi.object({
  rating: Joi.number().min(1).max(5).precision(1).required().messages({
    "number.base": "Rating must be a number",
    "number.min": "Rating must be at least 1",
    "number.max": "Rating cannot be more than 5",
    "any.required": "Rating is required"
  }),

  comment: Joi.string().trim().required().messages({
    "string.base": "Comment must be a string",
    "string.empty": "Comment cannot be empty",
    "any.required": "Comment is required"
  })
});
