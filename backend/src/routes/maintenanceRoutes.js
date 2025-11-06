const express = require('express');
const router = express.Router();
const maintenanceController = require('../controllers/maintenanceController');
const authMiddleware = require('../middlewares/authMiddleware');
const optionalAuthMiddleware = require('../middlewares/optionalAuthMiddleware');
const roleMiddleware = require('../middlewares/roleMiddleware');
const filterMiddleware = require('../middlewares/filterMiddleware');
const multer = require('multer');
const path = require('path');
const uploadsDir = path.join(__dirname, '../uploads/Maintenance');
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadsDir),
  filename: (req, file, cb) => cb(null, Date.now() + '_' + file.originalname)
});
const upload = multer({ storage });

// ? View upload endpoint - optional auth (allow viewing without token)
router.get('/:id/upload', optionalAuthMiddleware, maintenanceController.viewUpload);

// ? All other endpoints - require authentication, RBAC, and tenant filtering
router.use(authMiddleware);
router.use(roleMiddleware([1, 2, 3, 4]));
router.use(filterMiddleware);

router.get('/', maintenanceController.getAll);
router.get('/center-detail/:centerDetailId', maintenanceController.getByCenterDetailId);
router.get('/:id', maintenanceController.getById);
router.post('/', upload.fields([{ name: 'upload' }]), maintenanceController.create);
router.put('/:id', upload.fields([{ name: 'upload' }]), maintenanceController.update);
router.delete('/:id', maintenanceController.delete);

module.exports = router;

