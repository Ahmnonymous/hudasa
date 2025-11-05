const express = require('express');
const router = express.Router();
const siteVisitsController = require('../controllers/siteVisitsController');
const authMiddleware = require('../middlewares/authMiddleware');
const roleMiddleware = require('../middlewares/roleMiddleware');
const filterMiddleware = require('../middlewares/filterMiddleware');

router.use(authMiddleware);
router.use(roleMiddleware([1, 2, 3, 4]));
router.use(filterMiddleware);

router.get('/', siteVisitsController.getAll);
router.get('/islamic-center/:islamicCenterId', siteVisitsController.getByIslamicCenterId);
router.get('/:id', siteVisitsController.getById);
router.post('/', siteVisitsController.create);
router.put('/:id', siteVisitsController.update);
router.delete('/:id', siteVisitsController.delete);

module.exports = router;

