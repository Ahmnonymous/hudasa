const express = require('express');
const router = express.Router();
const financialAssessmentController = require('../controllers/financialAssessmentController');
const authMiddleware = require('../middlewares/authMiddleware');
const roleMiddleware = require('../middlewares/roleMiddleware');
const filterMiddleware = require('../middlewares/filterMiddleware');

// ? Apply authentication, RBAC, and tenant filtering
router.use(authMiddleware);
router.use(roleMiddleware([1, 2, 3, 4, 5]));
router.use(filterMiddleware);

router.get('/', financialAssessmentController.getAll);
router.get('/:id', financialAssessmentController.getById);
router.post('/', financialAssessmentController.create);
router.put('/:id', financialAssessmentController.update);
router.delete('/:id', financialAssessmentController.delete);

module.exports = router;
