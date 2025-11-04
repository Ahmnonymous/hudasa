const express = require('express');
const router = express.Router();
const supplierDocumentController = require('../controllers/supplierDocumentController');
const authMiddleware = require('../middlewares/authMiddleware');
const optionalAuthMiddleware = require('../middlewares/optionalAuthMiddleware');
const roleMiddleware = require('../middlewares/roleMiddleware');
const filterMiddleware = require('../middlewares/filterMiddleware');
const multer = require('multer');
const path = require('path');
const uploadsDir = path.join(__dirname, '../uploads/Supplier_Document');
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadsDir),
  filename: (req, file, cb) => cb(null, Date.now() + '_' + file.originalname)
});
const upload = multer({ storage });

// ? View file endpoints - optional auth (allow viewing without token)
router.get('/:id/view-file', optionalAuthMiddleware, supplierDocumentController.viewFile);

// ? All other endpoints - require authentication, RBAC, and tenant filtering
router.use(authMiddleware);
router.use(roleMiddleware([1, 2, 3, 4, 5]));
router.use(filterMiddleware);

router.get('/', supplierDocumentController.getAll);
router.get('/:id/download-file', supplierDocumentController.downloadFile);
router.get('/:id', supplierDocumentController.getById);
router.post('/', upload.single('file'), supplierDocumentController.create);
router.put('/:id', upload.single('file'), supplierDocumentController.update);
router.delete('/:id', supplierDocumentController.delete);

module.exports = router;
