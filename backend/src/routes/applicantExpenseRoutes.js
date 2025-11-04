const express = require('express');
const router = express.Router();
const applicantExpenseController = require('../controllers/applicantExpenseController');
const authMiddleware = require('../middlewares/authMiddleware');
const roleMiddleware = require('../middlewares/roleMiddleware');
const filterMiddleware = require('../middlewares/filterMiddleware');

// ? Apply authentication, RBAC, and tenant filtering
router.use(authMiddleware);
router.use(roleMiddleware([1, 2, 3, 4, 5]));
router.use(filterMiddleware);

router.get('/', applicantExpenseController.getAll);
router.get('/:id', applicantExpenseController.getById);
router.post('/', applicantExpenseController.create);
router.put('/:id', applicantExpenseController.update);
router.delete('/:id', applicantExpenseController.delete);

module.exports = router;
