const express = require('express');
const router = express.Router();
const supplierEvaluationController = require('../controllers/supplierEvaluationController');
const authenticateToken = require('../middlewares/authMiddleware');

router.get('/', authenticateToken, supplierEvaluationController.getAll);
router.get('/:id', authenticateToken, supplierEvaluationController.getById);
router.post('/', authenticateToken, supplierEvaluationController.create);
router.put('/:id', authenticateToken, supplierEvaluationController.update);
router.delete('/:id', authenticateToken, supplierEvaluationController.delete);

module.exports = router;
