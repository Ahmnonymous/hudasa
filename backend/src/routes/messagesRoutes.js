const express = require('express');
const router = express.Router();
const messagesController = require('../controllers/messagesController');
const authMiddleware = require('../middlewares/authMiddleware');
const optionalAuthMiddleware = require('../middlewares/optionalAuthMiddleware');
const roleMiddleware = require('../middlewares/roleMiddleware');
const filterMiddleware = require('../middlewares/filterMiddleware');
const multer = require('multer');
const path = require('path');
const uploadsDir = path.join(__dirname, '../uploads/Messages');
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadsDir),
  filename: (req, file, cb) => cb(null, Date.now() + '_' + file.originalname)
});
const upload = multer({ storage });

// ? View attachment endpoints - optional auth (allow viewing without token)
router.get('/:id/view-attachment', optionalAuthMiddleware, messagesController.viewAttachment);

// ? All other endpoints - require authentication, RBAC, and tenant filtering
router.use(authMiddleware);
router.use(roleMiddleware([1, 2, 3, 4, 5]));
router.use(filterMiddleware);

router.get('/', messagesController.getAll);
router.get('/:id/download-attachment', messagesController.downloadAttachment);
router.get('/:id', messagesController.getById);
router.post('/', upload.fields([{ name: 'attachment' }]), messagesController.create);
router.put('/:id', upload.fields([{ name: 'attachment' }]), messagesController.update);
router.delete('/:id', messagesController.delete);

module.exports = router;
