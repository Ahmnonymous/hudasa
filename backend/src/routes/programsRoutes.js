const express = require('express');
const router = express.Router();
const programsController = require('../controllers/programsController');
const authMiddleware = require('../middlewares/authMiddleware');
const optionalAuthMiddleware = require('../middlewares/optionalAuthMiddleware');
const roleMiddleware = require('../middlewares/roleMiddleware');
const filterMiddleware = require('../middlewares/filterMiddleware');
const multer = require('multer');
const path = require('path');
const uploadsDir = path.join(__dirname, '../uploads/Programs');
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadsDir),
  filename: (req, file, cb) => cb(null, Date.now() + '_' + file.originalname)
});
const upload = multer({ storage });

// ? View attachment endpoints - optional auth (allow viewing without token)
router.get('/:id/view-attachment', optionalAuthMiddleware, programsController.viewAttachment);

// ? All other endpoints - require authentication, RBAC, and tenant filtering
router.use(authMiddleware);
router.use(roleMiddleware([1, 2, 3, 4, 5]));
router.use(filterMiddleware);

router.get('/', programsController.getAll);
router.get('/:id/download-attachment', programsController.downloadAttachment);
router.get('/:id', programsController.getById);
router.post('/', upload.fields([{ name: 'attachment' }]), programsController.create);
router.put('/:id', upload.fields([{ name: 'attachment' }]), programsController.update);
router.delete('/:id', programsController.delete);

module.exports = router;
