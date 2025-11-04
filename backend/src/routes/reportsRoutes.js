const express = require('express');
const router = express.Router();
const ReportsController = require('../controllers/reportsController');
const authenticateToken = require('../middlewares/authMiddleware');
const roleMiddleware = require('../middlewares/roleMiddleware');
const filterMiddleware = require('../middlewares/filterMiddleware');

// Apply authentication middleware to all routes
router.use(authenticateToken);

// ✅ Apply center filtering for reports
router.use(filterMiddleware);

// ✅ CORRECTED: Reports accessible by App Admin, HQ, Org Admin (not Org Executives or Caseworkers)

// Applicant Details Report
router.get('/applicant-details', 
    roleMiddleware([1, 2, 3]), // App Admin, HQ, Org Admin
    ReportsController.getApplicantDetails.bind(ReportsController)
);

// Total Financial Assistance Report (includes both financial and food assistance)
router.get('/total-financial-assistance', 
    roleMiddleware([1, 2, 3]), // App Admin, HQ, Org Admin
    ReportsController.getTotalFinancialAssistance.bind(ReportsController)
);

// Financial Assistance Report
router.get('/financial-assistance', 
    roleMiddleware([1, 2, 3]), // App Admin, HQ, Org Admin
    ReportsController.getFinancialAssistance.bind(ReportsController)
);

// Food Assistance Report
router.get('/food-assistance', 
    roleMiddleware([1, 2, 3]), // App Admin, HQ, Org Admin
    ReportsController.getFoodAssistance.bind(ReportsController)
);

// Home Visits Report
router.get('/home-visits', 
    roleMiddleware([1, 2, 3]), // App Admin, HQ, Org Admin
    ReportsController.getHomeVisits.bind(ReportsController)
);

// Center Audits Report
router.get('/center-audits',
    roleMiddleware([1, 2, 3, 4]),
    ReportsController.getCenterAudits.bind(ReportsController)
);

// Relationship Report
router.get('/relationship-report', 
    roleMiddleware([1, 2, 3]), // App Admin, HQ, Org Admin
    ReportsController.getRelationshipReport.bind(ReportsController)
);

// Applicant Programs Report
router.get('/applicant-programs', 
    roleMiddleware([1, 2, 3]), // App Admin, HQ, Org Admin
    ReportsController.getApplicantPrograms.bind(ReportsController)
);

// Financial Assessment Report
router.get('/financial-assessment', 
    roleMiddleware([1, 2, 3]), // App Admin, HQ, Org Admin
    ReportsController.getFinancialAssessment.bind(ReportsController)
);

// Skills Matrix Report
router.get('/skills-matrix', 
    roleMiddleware([1, 2, 3]), // App Admin, HQ, Org Admin
    ReportsController.getSkillsMatrix.bind(ReportsController)
);

module.exports = router;
