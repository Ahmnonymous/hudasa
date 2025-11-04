const express = require('express');
const router = express.Router();
const conversationParticipantsController = require('../controllers/conversationParticipantsController');
const authMiddleware = require('../middlewares/authMiddleware');
const roleMiddleware = require('../middlewares/roleMiddleware');
const filterMiddleware = require('../middlewares/filterMiddleware');

// ? Apply authentication, RBAC, and tenant filtering
// All users (roles 1,2,3,4,5) can access conversation participants
router.use(authMiddleware);
router.use(roleMiddleware([1, 2, 3, 4, 5]));
router.use(filterMiddleware);

router.get('/', conversationParticipantsController.getAll);
router.get('/:id', conversationParticipantsController.getById);
router.post('/', conversationParticipantsController.create);
router.put('/:id', conversationParticipantsController.update);
router.delete('/:id', conversationParticipantsController.delete);

module.exports = router;
