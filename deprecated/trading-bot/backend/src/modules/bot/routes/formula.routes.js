const express = require('express');
const { authenticateJWT } = require('../../../middlewares/auth.middleware');
const { validate } = require('../../../middlewares/validation.middleware');
const formulaController = require('../controllers/formula.controller');
const formulaValidation = require('../middlewares/formula.validation');

const router = express.Router();

/**
 * @route   GET /api/bot/formulas
 * @desc    Get all formula configurations
 * @access  Private
 */
router.get(
  '/',
  authenticateJWT,
  formulaController.getAllFormulas
);

/**
 * @route   GET /api/bot/formulas/:id
 * @desc    Get formula configuration by ID
 * @access  Private
 */
router.get(
  '/:id',
  authenticateJWT,
  validate(formulaValidation.getFormulaById),
  formulaController.getFormulaById
);

/**
 * @route   POST /api/bot/formulas
 * @desc    Create a new formula configuration
 * @access  Private
 */
router.post(
  '/',
  authenticateJWT,
  validate(formulaValidation.createFormula),
  formulaController.createFormula
);

/**
 * @route   PUT /api/bot/formulas/:id
 * @desc    Update a formula configuration
 * @access  Private
 */
router.put(
  '/:id',
  authenticateJWT,
  validate(formulaValidation.updateFormula),
  formulaController.updateFormula
);

/**
 * @route   DELETE /api/bot/formulas/:id
 * @desc    Delete a formula configuration
 * @access  Private
 */
router.delete(
  '/:id',
  authenticateJWT,
  validate(formulaValidation.deleteFormula),
  formulaController.deleteFormula
);

module.exports = router;