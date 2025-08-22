const Joi = require("joi");

exports.credit = Joi.object({
  amount: Joi.number().required().messages({
    "number.base": "Amount must be a number",
    "any.required": "Rating is required"
  }),
});
