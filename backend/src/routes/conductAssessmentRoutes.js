const express = require('express');
const router = express.Router();
const conductAssessmentController = require('../controllers/conductAssessmentController');
const authMiddleware = require('../middlewares/authMiddleware');
const roleMiddleware = require('../middlewares/roleMiddleware');
const filterMiddleware = require('../middlewares/filterMiddleware');

// ? Apply authentication, RBAC, and tenant filtering
router.use(authMiddleware);
router.use(roleMiddleware([1, 2, 3, 4, 5]));
router.use(filterMiddleware);

router.get('/', conductAssessmentController.getAll);
router.get('/madressah-app/:madressahAppId', conductAssessmentController.getByMadressahAppId);
router.get('/:id', conductAssessmentController.getById);
router.post('/', conductAssessmentController.create);
router.put('/:id', conductAssessmentController.update);
router.delete('/:id', conductAssessmentController.delete);

module.exports = router;

