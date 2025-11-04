const express = require('express');
const router = express.Router();
const employeeController = require('../controllers/employeeController');
const authMiddleware = require('../middlewares/authMiddleware');
const roleMiddleware = require('../middlewares/roleMiddleware');
const filterMiddleware = require('../middlewares/filterMiddleware');

// ? Apply authentication to all routes
router.use(authMiddleware);

// ? CORRECTED RBAC - Employees accessible by App Admin, HQ, Org Admin, Org Executive, and Org Caseworker
// Org Executive (role 4) and Org Caseworker (role 5) can view employees for dropdowns (GET only), but POST/PUT/DELETE blocked by middleware
router.use(roleMiddleware([1, 2, 3, 4, 5])); // App Admin, HQ, Org Admin, Org Executive, Org Caseworker

// ? Apply tenant filtering
router.use(filterMiddleware);

router.get('/', employeeController.getAll);
router.get('/:id', employeeController.getById);
router.post('/', employeeController.create);
router.put('/:id', employeeController.update);
router.delete('/:id', employeeController.delete);

module.exports = router;
