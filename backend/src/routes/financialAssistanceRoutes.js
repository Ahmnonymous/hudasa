const express = require('express');
const router = express.Router();
const financialAssistanceController = require('../controllers/financialAssistanceController');
const authMiddleware = require('../middlewares/authMiddleware');
const roleMiddleware = require('../middlewares/roleMiddleware');
const filterMiddleware = require('../middlewares/filterMiddleware');

// ? Apply authentication, RBAC, and tenant filtering
router.use(authMiddleware);
router.use(roleMiddleware([1, 2, 3, 4, 5]));
router.use(filterMiddleware);

router.get('/', financialAssistanceController.getAll);
router.get('/:id', financialAssistanceController.getById);
router.post('/', financialAssistanceController.create);
router.put('/:id', financialAssistanceController.update);
router.delete('/:id', financialAssistanceController.delete);

module.exports = router;
