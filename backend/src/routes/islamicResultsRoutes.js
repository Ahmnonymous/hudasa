const express = require('express');
const router = express.Router();
const islamicResultsController = require('../controllers/islamicResultsController');
const authMiddleware = require('../middlewares/authMiddleware');
const roleMiddleware = require('../middlewares/roleMiddleware');
const filterMiddleware = require('../middlewares/filterMiddleware');

// ? Apply authentication, RBAC, and tenant filtering
router.use(authMiddleware);
router.use(roleMiddleware([1, 2, 3, 4, 5]));
router.use(filterMiddleware);

router.get('/', islamicResultsController.getAll);
router.get('/madressah-app/:madressahAppId', islamicResultsController.getByMadressahAppId);
router.get('/:id', islamicResultsController.getById);
router.post('/', islamicResultsController.create);
router.put('/:id', islamicResultsController.update);
router.delete('/:id', islamicResultsController.delete);

module.exports = router;

