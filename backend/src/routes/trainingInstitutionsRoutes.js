const express = require('express');
const router = express.Router();
const trainingInstitutionsController = require('../controllers/trainingInstitutionsController');
const authMiddleware = require('../middlewares/authMiddleware');
const roleMiddleware = require('../middlewares/roleMiddleware');

// ? Apply authentication and RBAC
// Training institutions used by employees - restrict to staff roles
router.use(authMiddleware);
router.use(roleMiddleware([1, 2, 3, 4, 5])); // All staff can access

router.get('/', trainingInstitutionsController.getAll);
router.get('/:id', trainingInstitutionsController.getById);
router.post('/', trainingInstitutionsController.create);
router.put('/:id', trainingInstitutionsController.update);
router.delete('/:id', trainingInstitutionsController.delete);

module.exports = router;
