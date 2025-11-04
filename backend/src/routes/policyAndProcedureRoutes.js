const express = require('express');
const router = express.Router();
const policyAndProcedureController = require('../controllers/policyAndProcedureController');
const authMiddleware = require('../middlewares/authMiddleware');
const optionalAuthMiddleware = require('../middlewares/optionalAuthMiddleware');
const roleMiddleware = require('../middlewares/roleMiddleware');
const filterMiddleware = require('../middlewares/filterMiddleware');
const multer = require('multer');
const path = require('path');
const uploadsDir = path.join(__dirname, '../uploads/Policy_and_Procedure');
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadsDir),
  filename: (req, file, cb) => cb(null, Date.now() + '_' + file.originalname)
});
const upload = multer({ storage });

// ? View file endpoints - optional auth (allow viewing without token)
router.get('/:id/view-file', optionalAuthMiddleware, policyAndProcedureController.viewFile);

// ? All other endpoints - require authentication, RBAC, and tenant filtering
router.use(authMiddleware);
router.use(roleMiddleware([1, 2, 3, 4, 5]));
router.use(filterMiddleware);

router.get('/', policyAndProcedureController.getAll);
router.get('/:id/download-file', policyAndProcedureController.downloadFile);
router.get('/:id', policyAndProcedureController.getById);
router.post('/', upload.fields([{ name: 'file' }]), policyAndProcedureController.create);
router.put('/:id', upload.fields([{ name: 'file' }]), policyAndProcedureController.update);
router.delete('/:id', policyAndProcedureController.delete);

module.exports = router;
