const express = require('express');
const router = express.Router();
const relationshipsController = require('../controllers/relationshipsController');
const authMiddleware = require('../middlewares/authMiddleware');
const roleMiddleware = require('../middlewares/roleMiddleware');
const filterMiddleware = require('../middlewares/filterMiddleware');

// ? Apply authentication, RBAC, and tenant filtering
router.use(authMiddleware);
router.use(roleMiddleware([1, 2, 3, 4, 5]));
router.use(filterMiddleware);

router.get('/', relationshipsController.getAll);
router.get('/:id', relationshipsController.getById);
router.post('/', relationshipsController.create);
router.put('/:id', relationshipsController.update);
router.delete('/:id', relationshipsController.delete);

module.exports = router;
