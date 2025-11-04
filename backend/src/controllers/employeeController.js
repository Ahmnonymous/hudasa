const employeeModel = require('../models/employeeModel');

const employeeController = {
  getAll: async (req, res) => {
    try {
      // ? Apply tenant filtering: App Admin (center_id=null) sees all, others see only their center
      // Pass centerId: null for App Admin, user.center_id for others
      let centerId = req.center_id || req.user?.center_id || null;
      
      // ?? DEBUG: Log user context
      console.log(`[DEBUG] Employee.getAll - user: ${req.user?.username}, role: ${req.user?.user_type}, center_id (raw): ${req.user?.center_id}, center_id (final): ${centerId}, type: ${typeof centerId}`);
      
      // ? Normalize centerId: convert to integer or null
      if (centerId !== null && centerId !== undefined) {
        centerId = parseInt(centerId);
        if (isNaN(centerId)) {
          centerId = null; // Invalid number becomes null
        }
      } else {
        centerId = null; // Explicitly set to null
      }
      
      console.log(`[DEBUG] Employee.getAll - normalized centerId: ${centerId} (type: ${typeof centerId})`);
      
      // ? Org Admin (role 3) should only see employees with user_type IN (3, 4, 5)
      // Excluding App Admin (1) and HQ (2)
      let allowedUserTypes = null;
      const userType = parseInt(req.user?.user_type);
      if (userType === 3) { // Org Admin
        allowedUserTypes = [3, 4, 5]; // Only Org Admin, Org Executive, and Caseworker
        console.log(`[DEBUG] Employee.getAll - Org Admin filtering: only user_type IN (3, 4, 5)`);
      }
      
      const data = await employeeModel.getAll(centerId, allowedUserTypes);
      res.json(data);
    } catch (err) {
      console.error(`[ERROR] Employee.getAll - ${err.message}`, err);
      res.status(500).json({ error: err.message });
    }
  },

  getById: async (req, res) => {
    try {
      // ? Apply tenant filtering: App Admin (center_id=null) sees all, others see only their center
      const centerId = req.center_id || req.user?.center_id || null;
      
      // ? Validate ID parameter
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: 'Invalid employee ID. Must be a number.' });
      }
      
      const data = await employeeModel.getById(id, centerId);
      if (!data) {
        return res.status(404).json({ error: 'Employee not found' });
      }
      res.json(data);
    } catch (err) {
      console.error(`[ERROR] EmployeeController.getById - ${err.message}`, err);
      res.status(500).json({ error: err.message || 'Internal server error' });
    }
  },

  create: async (req, res) => {
    try {
      // ? Validate App Admin must have NULL center_id
      if (parseInt(req.body.user_type) === 1 && req.body.center_id != null) {
        return res.status(400).json({ 
          error: 'App Admin users cannot be assigned to a center. center_id must be NULL.' 
        });
      }
      
      // ? Validate non-App Admin users must have center_id
      if (parseInt(req.body.user_type) !== 1 && !req.body.center_id) {
        return res.status(400).json({ 
          error: 'Users must be assigned to a center, except for App Admin.' 
        });
      }
      
      // ? Add audit fields
      const username = req.user?.username || 'system';
      req.body.created_by = username;
      req.body.updated_by = username;
      
      // ? For App Admin, explicitly set center_id to NULL
      if (parseInt(req.body.user_type) === 1) {
        req.body.center_id = null;
      } else {
        // ? For other roles, add center_id from context
        req.body.center_id = req.body.center_id || req.center_id || req.user?.center_id;
      }
      
      const data = await employeeModel.create(req.body);
      res.status(201).json(data);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },

  update: async (req, res) => {
    try {
      // ? Get existing employee to check current role (App Admin can see any)
      const existingEmployee = await employeeModel.getById(req.params.id, null);
      if (!existingEmployee) {
        return res.status(404).json({ error: 'Employee not found' });
      }
      
      // ? If updating to App Admin, enforce NULL center_id
      if (parseInt(req.body.user_type) === 1) {
        req.body.center_id = null;
      }
      
      // ? If updating FROM App Admin, require center_id
      if (parseInt(existingEmployee.user_type) === 1 && parseInt(req.body.user_type) !== 1 && !req.body.center_id) {
        return res.status(400).json({ 
          error: 'Users must be assigned to a center, except for App Admin.' 
        });
      }
      
      // ? Add audit field (don't allow overwrite of created_by)
      const username = req.user?.username || 'system';
      req.body.updated_by = username;
      delete req.body.created_by; // Prevent overwrite
      
      // ? Apply tenant filtering: App Admin (center_id=null) can update all, others only their center
      const centerId = req.center_id || req.user?.center_id || null;
      const data = await employeeModel.update(req.params.id, req.body, centerId);
      res.json(data);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },

  delete: async (req, res) => {
    try {
      // ? Apply tenant filtering: App Admin (center_id=null) can delete all, others only their center
      const centerId = req.center_id || req.user?.center_id || null;
      await employeeModel.delete(req.params.id, centerId);
      res.json({ message: 'Deleted successfully' });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },
};

module.exports = employeeController;
