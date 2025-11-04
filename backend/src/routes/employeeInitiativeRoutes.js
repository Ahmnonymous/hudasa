const express = require('express');
const router = express.Router();
const employeeInitiativeController = require('../controllers/employeeInitiativeController');

router.get('/', employeeInitiativeController.getAll);
router.get('/:id', employeeInitiativeController.getById);
router.post('/', employeeInitiativeController.create);
router.put('/:id', employeeInitiativeController.update);
router.delete('/:id', employeeInitiativeController.delete);

module.exports = router;
