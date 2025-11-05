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

// ? GET endpoints - require authentication (all users can read centers for lookups)
router.use(authMiddleware);
router.use(filterMiddleware);

// Read endpoints - accessible to all authenticated users
router.get('/', centerDetailController.getAll);
router.get('/:id/download-logo', centerDetailController.downloadLogo);
router.get('/:id/download-qrcode', centerDetailController.downloadQRCode);
router.get('/:id', centerDetailController.getById);

// Write endpoints - App Admin ONLY (role 1) can manage centers
router.post('/', roleMiddleware([1]), upload.fields([{ name: 'logo' }, { name: 'qr_code_service_url' }]), centerDetailController.create);
router.put('/:id', roleMiddleware([1]), upload.fields([{ name: 'logo' }, { name: 'qr_code_service_url' }]), centerDetailController.update);
router.delete('/:id', roleMiddleware([1]), centerDetailController.delete);

module.exports = router;
