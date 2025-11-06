const express = require('express');
const router = express.Router();

const parentQuestionnaireController = require('../controllers/parentQuestionnaireController');
const authMiddleware = require('../middlewares/authMiddleware');
const roleMiddleware = require('../middlewares/roleMiddleware');
const filterMiddleware = require('../middlewares/filterMiddleware');

router.use(authMiddleware);
router.use(roleMiddleware([1, 2, 3, 4, 5]));
router.use(filterMiddleware);

router.get('/reports', roleMiddleware([1, 2, 3]), parentQuestionnaireController.getReports);
router.get('/flags', roleMiddleware([1, 2, 3]), parentQuestionnaireController.getFlags);
router.get('/madressah-app/:madressahAppId', parentQuestionnaireController.getByMadressahApp);
router.get('/:id', parentQuestionnaireController.getById);
router.get('/', parentQuestionnaireController.getAll);

router.post('/', parentQuestionnaireController.create);
router.put('/:id', parentQuestionnaireController.update);
router.delete('/:id', parentQuestionnaireController.remove);

module.exports = router;

