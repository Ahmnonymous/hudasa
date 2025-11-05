const express = require('express');
const router = express.Router();
const suburbMasjidsController = require('../controllers/suburbMasjidsController');
const authMiddleware = require('../middlewares/authMiddleware');
const roleMiddleware = require('../middlewares/roleMiddleware');
const filterMiddleware = require('../middlewares/filterMiddleware');

router.use(authMiddleware);
router.use(roleMiddleware([1, 2, 3, 4]));
router.use(filterMiddleware);

router.get('/', suburbMasjidsController.getAll);
router.get('/suburb/:suburbId', suburbMasjidsController.getBySuburbId);
router.get('/:id', suburbMasjidsController.getById);
router.post('/', suburbMasjidsController.create);
router.put('/:id', suburbMasjidsController.update);
router.delete('/:id', suburbMasjidsController.delete);

module.exports = router;

