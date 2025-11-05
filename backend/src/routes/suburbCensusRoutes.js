const express = require('express');
const router = express.Router();
const suburbCensusController = require('../controllers/suburbCensusController');
const authMiddleware = require('../middlewares/authMiddleware');
const roleMiddleware = require('../middlewares/roleMiddleware');

router.use(authMiddleware);
router.use(roleMiddleware([1, 2, 3, 4]));

router.get('/', suburbCensusController.getAll);
router.get('/suburb/:suburbId', suburbCensusController.getBySuburbId);
router.get('/:id', suburbCensusController.getById);
router.post('/', suburbCensusController.create);
router.put('/:id', suburbCensusController.update);
router.delete('/:id', suburbCensusController.delete);

module.exports = router;

