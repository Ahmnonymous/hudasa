const express = require('express');
const router = express.Router();
const foodAssistanceController = require('../controllers/foodAssistanceController');
const authMiddleware = require('../middlewares/authMiddleware');
const roleMiddleware = require('../middlewares/roleMiddleware');
const filterMiddleware = require('../middlewares/filterMiddleware');

// ? Apply authentication, RBAC, and tenant filtering
router.use(authMiddleware);
router.use(roleMiddleware([1, 2, 3, 4, 5]));
router.use(filterMiddleware);

router.get('/', foodAssistanceController.getAll);
router.get('/:id', foodAssistanceController.getById);
router.post('/', foodAssistanceController.create);
router.put('/:id', foodAssistanceController.update);
router.delete('/:id', foodAssistanceController.delete);

module.exports = router;
