const express = require('express');
const router = express.Router();
const foldersController = require('../controllers/foldersController');
const authMiddleware = require('../middlewares/authMiddleware');
const roleMiddleware = require('../middlewares/roleMiddleware');
const filterMiddleware = require('../middlewares/filterMiddleware');

// ? Apply authentication, RBAC, and tenant filtering
// All users (roles 1,2,3,4,5) can access File Manager
router.use(authMiddleware);
router.use(roleMiddleware([1, 2, 3, 4, 5]));
router.use(filterMiddleware);

router.get('/', foldersController.getAll);
router.get('/:id', foldersController.getById);
router.post('/', foldersController.create);
router.put('/:id', foldersController.update);
router.delete('/:id', foldersController.delete);

module.exports = router;
