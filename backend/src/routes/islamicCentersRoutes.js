const express = require('express');
const router = express.Router();
const islamicCentersController = require('../controllers/islamicCentersController');
const authMiddleware = require('../middlewares/authMiddleware');
const roleMiddleware = require('../middlewares/roleMiddleware');
const filterMiddleware = require('../middlewares/filterMiddleware');

router.use(authMiddleware);
router.use(roleMiddleware([1, 2, 3, 4]));
router.use(filterMiddleware);

router.get('/', islamicCentersController.getAll);
router.get('/:id', islamicCentersController.getById);
router.post('/', islamicCentersController.create);
router.put('/:id', islamicCentersController.update);
router.delete('/:id', islamicCentersController.delete);

module.exports = router;

