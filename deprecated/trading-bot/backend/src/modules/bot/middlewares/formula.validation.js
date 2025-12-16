const Joi = require('joi');

// Schema for formula interval validation
const formulaIntervalSchema = Joi.string().valid('1m', '5m', '15m', '1h', '1d').required();

// Schema for formula parameters validation
const formulaParametersSchema = Joi.object().required();

// Get formula by ID validation
exports.getFormulaById = {
  params: Joi.object({
    id: Joi.string().uuid().required(),
  }),
};

// Create formula validation
exports.createFormula = {
  body: Joi.object({
    name: Joi.string().required(),
    symbol: Joi.string().required(),
    exchange: Joi.string().default('AMEX'),
    interval: formulaIntervalSchema,
    parameters: formulaParametersSchema,
    is_active: Joi.boolean().default(true),
  }),
};

// Update formula validation
exports.updateFormula = {
  params: Joi.object({
    id: Joi.string().uuid().required(),
  }),
  body: Joi.object({
    name: Joi.string(),
    symbol: Joi.string(),
    exchange: Joi.string(),
    interval: Joi.string().valid('1m', '5m', '15m', '1h', '1d'),
    parameters: Joi.object(),
    is_active: Joi.boolean(),
  }).min(1), // At least one field must be present
};

// Delete formula validation
exports.deleteFormula = {
  params: Joi.object({
    id: Joi.string().uuid().required(),
  }),
};