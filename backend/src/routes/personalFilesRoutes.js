const express = require('express');
const router = express.Router();
const personalFilesController = require('../controllers/personalFilesController');
const authMiddleware = require('../middlewares/authMiddleware');
const optionalAuthMiddleware = require('../middlewares/optionalAuthMiddleware');
const roleMiddleware = require('../middlewares/roleMiddleware');
const filterMiddleware = require('../middlewares/filterMiddleware');
const multer = require('multer');
const path = require('path');
const uploadsDir = path.join(__dirname, '../uploads/Personal_Files');
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadsDir),
  filename: (req, file, cb) => cb(null, Date.now() + '_' + file.originalname)
});
const upload = multer({ storage });

// ? View file endpoints - optional auth (allow viewing without token)
router.get('/:id/view-file', optionalAuthMiddleware, personalFilesController.viewFile);

// ? All other endpoints - require authentication, RBAC, and tenant filtering
router.use(authMiddleware);
router.use(roleMiddleware([1, 2, 3, 4, 5]));
router.use(filterMiddleware);

router.get('/', personalFilesController.getAll);
router.get('/:id/download-file', personalFilesController.downloadFile);
router.get('/:id', personalFilesController.getById);
router.post('/', upload.fields([{ name: 'file' }]), personalFilesController.create);
router.put('/:id', upload.fields([{ name: 'file' }]), personalFilesController.update);
router.delete('/:id', personalFilesController.delete);

module.exports = router;
