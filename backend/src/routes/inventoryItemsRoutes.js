const express = require('express');
const router = express.Router();
const inventoryItemsController = require('../controllers/inventoryItemsController');
const authMiddleware = require('../middlewares/authMiddleware');
const roleMiddleware = require('../middlewares/roleMiddleware');
const filterMiddleware = require('../middlewares/filterMiddleware');

// ? Apply authentication to all routes
router.use(authMiddleware);

// ? CORRECTED RBAC - Inventory accessible by all except Caseworkers
router.use(roleMiddleware([1, 2, 3, 4])); // App Admin, HQ, Org Admin, Org Executives

// ? Apply tenant filtering
router.use(filterMiddleware);

router.get('/', inventoryItemsController.getAll);
router.get('/:id', inventoryItemsController.getById);
router.post('/', inventoryItemsController.create);
router.put('/:id', inventoryItemsController.update);
router.delete('/:id', inventoryItemsController.delete);

module.exports = router;
