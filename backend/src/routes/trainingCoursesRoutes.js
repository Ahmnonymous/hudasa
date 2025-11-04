const express = require('express');
const router = express.Router();
const trainingCoursesController = require('../controllers/trainingCoursesController');
const authMiddleware = require('../middlewares/authMiddleware');
const roleMiddleware = require('../middlewares/roleMiddleware');

// ? Apply authentication and RBAC
// Training courses used by employees - restrict to staff roles
router.use(authMiddleware);
router.use(roleMiddleware([1, 2, 3, 4, 5])); // All staff can access

router.get('/', trainingCoursesController.getAll);
router.get('/:id', trainingCoursesController.getById);
router.post('/', trainingCoursesController.create);
router.put('/:id', trainingCoursesController.update);
router.delete('/:id', trainingCoursesController.delete);

module.exports = router;
