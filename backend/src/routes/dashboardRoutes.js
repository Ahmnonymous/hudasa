const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboardController');
const authMiddleware = require('../middlewares/authMiddleware');
const roleMiddleware = require('../middlewares/roleMiddleware');
const filterMiddleware = require('../middlewares/filterMiddleware');

// ✅ Apply auth middleware
router.use(authMiddleware);

// ✅ Apply RBAC - Dashboard accessible by all staff
router.use(roleMiddleware([1, 2, 3, 4, 5]));

// ✅ Apply tenant filtering
router.use(filterMiddleware);

// Dashboard statistics endpoint
router.get('/applicant-statistics', dashboardController.getApplicantStatistics);

module.exports = router;

