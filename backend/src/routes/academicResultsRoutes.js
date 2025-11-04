const express = require('express');
const router = express.Router();
const academicResultsController = require('../controllers/academicResultsController');
const authMiddleware = require('../middlewares/authMiddleware');
const roleMiddleware = require('../middlewares/roleMiddleware');
const filterMiddleware = require('../middlewares/filterMiddleware');

// ? Apply authentication, RBAC, and tenant filtering
router.use(authMiddleware);
router.use(roleMiddleware([1, 2, 3, 4, 5]));
router.use(filterMiddleware);

router.get('/', academicResultsController.getAll);
router.get('/madressah-app/:madressahAppId', academicResultsController.getByMadressahAppId);
router.get('/:id', academicResultsController.getById);
router.post('/', academicResultsController.create);
router.put('/:id', academicResultsController.update);
router.delete('/:id', academicResultsController.delete);

module.exports = router;

