const express = require('express');
const router = express.Router();
const lookupController = require('../controllers/lookupController');
const authMiddleware = require('../middlewares/authMiddleware');
const roleMiddleware = require('../middlewares/roleMiddleware');
const filterMiddleware = require('../middlewares/filterMiddleware');

// ✅ Apply authentication to lookup routes
// ✅ Lookups are global tables, accessible to all authenticated roles
// ✅ All roles (1,2,3,4,5) can access lookup APIs - they're read-only reference data
router.use(authMiddleware);
router.use(roleMiddleware([1, 2, 3, 4, 5])); // All roles can access lookup APIs
router.use(filterMiddleware); // Apply filter middleware (though lookups don't filter by center)

router.get('/:table', lookupController.getAll);
router.get('/:table/:id', lookupController.getById);
router.post('/:table', lookupController.create);
router.put('/:table/:id', lookupController.update);
router.delete('/:table/:id', lookupController.delete);

module.exports = router;
