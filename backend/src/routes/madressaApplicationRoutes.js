const express = require('express');
const router = express.Router();
const madressaApplicationController = require('../controllers/madressaApplicationController');
const authMiddleware = require('../middlewares/authMiddleware');
const roleMiddleware = require('../middlewares/roleMiddleware');
const filterMiddleware = require('../middlewares/filterMiddleware');

// ? Apply authentication, RBAC, and tenant filtering
router.use(authMiddleware);
router.use(roleMiddleware([1, 2, 3, 4, 5]));
router.use(filterMiddleware);

router.get('/', madressaApplicationController.getAll);
router.get('/relationship/:relationshipId', madressaApplicationController.getByRelationshipId);
router.get('/:id', madressaApplicationController.getById);
router.post('/', madressaApplicationController.create);
router.put('/:id', madressaApplicationController.update);
router.delete('/:id', madressaApplicationController.delete);

module.exports = router;

