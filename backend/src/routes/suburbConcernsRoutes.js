const express = require('express');
const router = express.Router();
const suburbConcernsController = require('../controllers/suburbConcernsController');
const authMiddleware = require('../middlewares/authMiddleware');
const roleMiddleware = require('../middlewares/roleMiddleware');
const filterMiddleware = require('../middlewares/filterMiddleware');

router.use(authMiddleware);
router.use(roleMiddleware([1, 2, 3, 4]));
router.use(filterMiddleware);

router.get('/', suburbConcernsController.getAll);
router.get('/suburb/:suburbId', suburbConcernsController.getBySuburbId);
router.get('/:id', suburbConcernsController.getById);
router.post('/', suburbConcernsController.create);
router.put('/:id', suburbConcernsController.update);
router.delete('/:id', suburbConcernsController.delete);

module.exports = router;

