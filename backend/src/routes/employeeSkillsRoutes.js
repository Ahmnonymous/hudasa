const express = require('express');
const router = express.Router();
const employeeSkillsController = require('../controllers/employeeSkillsController');
const authMiddleware = require('../middlewares/authMiddleware');
const optionalAuthMiddleware = require('../middlewares/optionalAuthMiddleware');
const roleMiddleware = require('../middlewares/roleMiddleware');
const filterMiddleware = require('../middlewares/filterMiddleware');
const multer = require('multer');
const path = require('path');
const uploadsDir = path.join(__dirname, '../uploads/Employee_Skills');
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadsDir),
  filename: (req, file, cb) => cb(null, Date.now() + '_' + file.originalname)
});
const upload = multer({ storage });

// ? View attachment endpoints - optional auth (allow viewing without token)
router.get('/:id/view-attachment', optionalAuthMiddleware, employeeSkillsController.viewAttachment);

// ? All other endpoints - require authentication, RBAC, and tenant filtering
router.use(authMiddleware);
router.use(roleMiddleware([1, 2, 3, 4, 5]));
router.use(filterMiddleware);

router.get('/', employeeSkillsController.getAll);
router.get('/:id/download-attachment', employeeSkillsController.downloadAttachment);
router.get('/:id', employeeSkillsController.getById);
router.post('/', upload.fields([{ name: 'attachment' }]), employeeSkillsController.create);
router.put('/:id', upload.fields([{ name: 'attachment' }]), employeeSkillsController.update);
router.delete('/:id', employeeSkillsController.delete);

module.exports = router;
