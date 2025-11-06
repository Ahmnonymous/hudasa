const express = require('express');
const router = express.Router();
const academicResultsController = require('../controllers/academicResultsController');
const authMiddleware = require('../middlewares/authMiddleware');
const roleMiddleware = require('../middlewares/roleMiddleware');
const filterMiddleware = require('../middlewares/filterMiddleware');
const multer = require('multer');

// Multer configuration for parsing FormData (no file uploads, just form fields)
const upload = multer();

// ? Apply authentication, RBAC, and tenant filtering
router.use(authMiddleware);
router.use(roleMiddleware([1, 2, 3, 4, 5]));
router.use(filterMiddleware);

router.get('/', academicResultsController.getAll);
router.get('/madressah-app/:madressahAppId', academicResultsController.getByMadressahAppId);
router.get('/:id', academicResultsController.getById);
router.post('/', upload.none(), academicResultsController.create);
router.put('/:id', upload.none(), academicResultsController.update);
router.delete('/:id', academicResultsController.delete);

module.exports = router;

