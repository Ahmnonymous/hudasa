const express = require('express');
const router = express.Router();
const attachmentsController = require('../controllers/attachmentsController');
const authMiddleware = require('../middlewares/authMiddleware');
const optionalAuthMiddleware = require('../middlewares/optionalAuthMiddleware');
const roleMiddleware = require('../middlewares/roleMiddleware');
const filterMiddleware = require('../middlewares/filterMiddleware');
const multer = require('multer');
const path = require('path');
const uploadsDir = path.join(__dirname, '../uploads/Attachments');
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadsDir),
  filename: (req, file, cb) => cb(null, Date.now() + '_' + file.originalname)
});
const upload = multer({ storage });

// ? View file endpoints - optional auth (allow viewing without token)
router.get('/:id/view-file', optionalAuthMiddleware, attachmentsController.viewFile);

// ? All other endpoints - require authentication, RBAC, and tenant filtering
router.use(authMiddleware);
router.use(roleMiddleware([1, 2, 3, 4, 5]));
router.use(filterMiddleware);

router.get('/', attachmentsController.getAll);
router.get('/:id/download-file', attachmentsController.downloadFile);
router.get('/:id', attachmentsController.getById);
router.post('/', upload.fields([{ name: 'file' }]), attachmentsController.create);
router.put('/:id', upload.fields([{ name: 'file' }]), attachmentsController.update);
router.delete('/:id', attachmentsController.delete);

module.exports = router;
