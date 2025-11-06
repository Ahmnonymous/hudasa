const express = require('express');
const router = express.Router();
const islamicResultsController = require('../controllers/islamicResultsController');
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

router.get('/', islamicResultsController.getAll);
router.get('/madressah-app/:madressahAppId', islamicResultsController.getByMadressahAppId);
router.get('/:id', islamicResultsController.getById);
router.post('/', upload.none(), islamicResultsController.create);
router.put('/:id', upload.none(), islamicResultsController.update);
router.delete('/:id', islamicResultsController.delete);

module.exports = router;

