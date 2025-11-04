const express = require('express');
const router = express.Router();
const inventoryTransactionsController = require('../controllers/inventoryTransactionsController');
const authMiddleware = require('../middlewares/authMiddleware');
const roleMiddleware = require('../middlewares/roleMiddleware');
const filterMiddleware = require('../middlewares/filterMiddleware');

// ? Apply authentication, RBAC, and tenant filtering
router.use(authMiddleware);
// ? CORRECTED RBAC - Inventory Transactions accessible by all except Caseworkers
router.use(roleMiddleware([1, 2, 3, 4])); // App Admin, HQ, Org Admin, Org Executives
router.use(filterMiddleware);

router.get('/', inventoryTransactionsController.getAll);
router.get('/:id', inventoryTransactionsController.getById);
router.post('/', inventoryTransactionsController.create);
router.put('/:id', inventoryTransactionsController.update);
router.delete('/:id', inventoryTransactionsController.delete);

module.exports = router;
