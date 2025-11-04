const express = require('express');
const router = express.Router();
const centerDetailController = require('../controllers/centerDetailController');
const authMiddleware = require('../middlewares/authMiddleware');
const optionalAuthMiddleware = require('../middlewares/optionalAuthMiddleware');
const roleMiddleware = require('../middlewares/roleMiddleware');
const filterMiddleware = require('../middlewares/filterMiddleware');
const multer = require('multer');
const path = require('path');
const uploadsDir = path.join(__dirname, '../uploads/Center_Detail');
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadsDir),
  filename: (req, file, cb) => cb(null, Date.now() + '_' + file.originalname)
});
const upload = multer({ storage });

// ? View logo and QR code endpoints - optional auth (allow viewing without token)
router.get('/:id/view-logo', optionalAuthMiddleware, centerDetailController.viewLogo);
router.get('/:id/view-qrcode', optionalAuthMiddleware, centerDetailController.viewQRCode);

// ? All other endpoints - require authentication, RBAC, and tenant filtering
// Center management: App Admin ONLY (role 1)
router.use(authMiddleware);
router.use(roleMiddleware([1])); // Only App Admin can manage centers
router.use(filterMiddleware);

router.get('/', centerDetailController.getAll);
router.get('/:id/download-logo', centerDetailController.downloadLogo);
router.get('/:id/download-qrcode', centerDetailController.downloadQRCode);
router.get('/:id', centerDetailController.getById);
router.post('/', upload.fields([{ name: 'logo' }, { name: 'qr_code_service_url' }]), centerDetailController.create);
router.put('/:id', upload.fields([{ name: 'logo' }, { name: 'qr_code_service_url' }]), centerDetailController.update);
router.delete('/:id', centerDetailController.delete);

module.exports = router;
