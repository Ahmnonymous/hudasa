const express = require('express');
const router = express.Router();
const homeVisitController = require('../controllers/homeVisitController');
const authMiddleware = require('../middlewares/authMiddleware');
const optionalAuthMiddleware = require('../middlewares/optionalAuthMiddleware');
const roleMiddleware = require('../middlewares/roleMiddleware');
const filterMiddleware = require('../middlewares/filterMiddleware');
const multer = require('multer');
const path = require('path');
const uploadsDir = path.join(__dirname, '../uploads/Home_Visit');
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadsDir),
  filename: (req, file, cb) => cb(null, Date.now() + '_' + file.originalname)
});
const upload = multer({ storage });

// ? View attachment endpoints - optional auth (allow viewing without token)
router.get('/:id/view-attachment-1', optionalAuthMiddleware, homeVisitController.viewAttachment1);
router.get('/:id/view-attachment-2', optionalAuthMiddleware, homeVisitController.viewAttachment2);

// ? All other endpoints - require authentication, RBAC, and tenant filtering
router.use(authMiddleware);
router.use(roleMiddleware([1, 2, 3, 4, 5]));
router.use(filterMiddleware);

router.get('/', homeVisitController.getAll);
router.get('/:id/download-attachment-1', homeVisitController.downloadAttachment1);
router.get('/:id/download-attachment-2', homeVisitController.downloadAttachment2);
router.get('/:id', homeVisitController.getById);
router.post('/', upload.fields([{ name: 'attachment_1' }, { name: 'attachment_2' }]), homeVisitController.create);
router.put('/:id', upload.fields([{ name: 'attachment_1' }, { name: 'attachment_2' }]), homeVisitController.update);
router.delete('/:id', homeVisitController.delete);

module.exports = router;
