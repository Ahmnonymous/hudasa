const express = require('express');
const router = express.Router();
const hseqToolboxMeetingController = require('../controllers/hseqToolboxMeetingController');

router.get('/', hseqToolboxMeetingController.getAll);
router.get('/:id', hseqToolboxMeetingController.getById);
router.post('/', hseqToolboxMeetingController.create);
router.put('/:id', hseqToolboxMeetingController.update);
router.delete('/:id', hseqToolboxMeetingController.delete);

module.exports = router;
