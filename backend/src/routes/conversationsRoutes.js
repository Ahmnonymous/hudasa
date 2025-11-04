const express = require('express');
const router = express.Router();
const conversationsController = require('../controllers/conversationsController');
const authMiddleware = require('../middlewares/authMiddleware');
const roleMiddleware = require('../middlewares/roleMiddleware');
const filterMiddleware = require('../middlewares/filterMiddleware');

// ? Apply authentication, RBAC, and tenant filtering
router.use(authMiddleware);
router.use(roleMiddleware([1, 2, 3, 4, 5]));
router.use(filterMiddleware);

router.get('/', conversationsController.getAll);
router.get('/:id', conversationsController.getById);
router.post('/', conversationsController.create);
router.put('/:id', conversationsController.update);
router.delete('/:id', conversationsController.delete);

module.exports = router;
