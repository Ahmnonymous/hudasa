const express = require('express');
const router = express.Router();
const hseqToolboxMeetingTasksController = require('../controllers/hseqToolboxMeetingTasksController');

router.get('/', hseqToolboxMeetingTasksController.getAll);
router.get('/:id', hseqToolboxMeetingTasksController.getById);
router.post('/', hseqToolboxMeetingTasksController.create);
router.put('/:id', hseqToolboxMeetingTasksController.update);
router.delete('/:id', hseqToolboxMeetingTasksController.delete);

module.exports = router;
