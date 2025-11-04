const express = require('express');
const router = express.Router();
const surveyController = require('../controllers/surveyController');
const authMiddleware = require('../middlewares/authMiddleware');
const roleMiddleware = require('../middlewares/roleMiddleware');
const filterMiddleware = require('../middlewares/filterMiddleware');

// ? Apply authentication, RBAC, and tenant filtering
router.use(authMiddleware);
router.use(roleMiddleware([1, 2, 3, 4, 5]));
router.use(filterMiddleware);

router.get('/', surveyController.getAll);
router.get('/madressah-app/:madressahAppId', surveyController.getByMadressahAppId);
router.get('/:id', surveyController.getById);
router.post('/', surveyController.create);
router.put('/:id', surveyController.update);
router.delete('/:id', surveyController.delete);

module.exports = router;

