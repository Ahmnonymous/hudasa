const express = require('express');
const router = express.Router();
const serviceRatingController = require('../controllers/serviceRatingController');
const authMiddleware = require('../middlewares/authMiddleware');
const roleMiddleware = require('../middlewares/roleMiddleware');
const filterMiddleware = require('../middlewares/filterMiddleware');

// ? Apply authentication, RBAC, and tenant filtering
// Service ratings visible to all staff
router.use(authMiddleware);
router.use(roleMiddleware([1, 2, 3, 4, 5]));
router.use(filterMiddleware);

router.get('/', serviceRatingController.getAll);
router.get('/:id', serviceRatingController.getById);
router.post('/', serviceRatingController.create);
router.put('/:id', serviceRatingController.update);
router.delete('/:id', serviceRatingController.delete);

module.exports = router;
