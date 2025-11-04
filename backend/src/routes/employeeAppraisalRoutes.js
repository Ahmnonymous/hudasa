const express = require('express');
const router = express.Router();
const employeeAppraisalController = require('../controllers/employeeAppraisalController');

router.get('/', employeeAppraisalController.getAll);
router.get('/:id', employeeAppraisalController.getById);
router.post('/', employeeAppraisalController.create);
router.put('/:id', employeeAppraisalController.update);
router.delete('/:id', employeeAppraisalController.delete);

module.exports = router;
