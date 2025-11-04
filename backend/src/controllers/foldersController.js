const foldersModel = require('../models/foldersModel');

const foldersController = {
  getAll: async (req, res) => { 
    try { 
      // ? App Admin (center_id=null) sees all, others see only their center
      let centerId = req.center_id || req.user?.center_id || null;
      
      // ?? DEBUG: Log user context
      console.log(`[DEBUG] Folders.getAll - user: ${req.user?.username}, role: ${req.user?.user_type}, center_id (raw): ${req.user?.center_id}, center_id (final): ${centerId}, type: ${typeof centerId}`);
      
      // ? Normalize centerId: convert to integer or null
      if (centerId !== null && centerId !== undefined) {
        centerId = parseInt(centerId);
        if (isNaN(centerId)) {
          centerId = null; // Invalid number becomes null
        }
      } else {
        centerId = null; // Explicitly set to null
      }
      
      console.log(`[DEBUG] Folders.getAll - normalized centerId: ${centerId} (type: ${typeof centerId})`);
      
      const data = await foldersModel.getAll(centerId); 
      res.json(data); 
    } catch(err){ 
      console.error(`[ERROR] Folders.getAll - ${err.message}`, err);
      res.status(500).json({error: err.message}); 
    } 
  },
  
  getById: async (req, res) => { 
    try { 
      // ? App Admin (center_id=null) sees all, others see only their center
      const centerId = req.center_id || req.user?.center_id || null;
      const data = await foldersModel.getById(req.params.id, centerId); 
      if(!data) return res.status(404).json({error: 'Not found'}); 
      res.json(data); 
    } catch(err){ 
      res.status(500).json({error: err.message}); 
    } 
  },
  
  create: async (req, res) => { 
    try {
      // ? Add audit fields
      const username = req.user?.username || 'system';
      req.body.created_by = username;
      req.body.updated_by = username;
      
      const fields = { ...req.body };
      
      // Clean up empty strings for numeric fields
      if (fields.parent_id === '' || fields.parent_id === 'null' || fields.parent_id === 'undefined') {
        delete fields.parent_id;
      } else if (fields.parent_id) {
        fields.parent_id = parseInt(fields.parent_id);
      }
      
      if (fields.employee_id === '' || fields.employee_id === 'null' || fields.employee_id === 'undefined') {
        delete fields.employee_id;
      } else if (fields.employee_id) {
        fields.employee_id = parseInt(fields.employee_id);
      }
      
      if (fields.center_id) {
        fields.center_id = parseInt(fields.center_id);
      }
      
      const data = await foldersModel.create(fields); 
      res.status(201).json(data); 
    } catch(err){ 
      res.status(500).json({error: err.message}); 
    } 
  },
  
  update: async (req, res) => { 
    try { 
      const fields = { ...req.body };
      
      // ? Enforce audit fields and prevent created_by override
      delete fields.created_by;
      fields.updated_by = req.user?.username || 'system';
      
      // Clean up empty strings for numeric fields
      if (fields.parent_id === '' || fields.parent_id === 'null' || fields.parent_id === 'undefined') {
        delete fields.parent_id;
      } else if (fields.parent_id) {
        fields.parent_id = parseInt(fields.parent_id);
      }
      
      if (fields.employee_id === '' || fields.employee_id === 'null' || fields.employee_id === 'undefined') {
        delete fields.employee_id;
      } else if (fields.employee_id) {
        fields.employee_id = parseInt(fields.employee_id);
      }
      
      if (fields.center_id) {
        fields.center_id = parseInt(fields.center_id);
      }
      
      // ? App Admin (center_id=null) can update all, others only their center
      const centerId = req.center_id || req.user?.center_id || null;
      const data = await foldersModel.update(req.params.id, fields, centerId); 
      res.json(data); 
    } catch(err){ 
      res.status(500).json({error: err.message}); 
    } 
  },
  
  delete: async (req, res) => { 
    try { 
      // ? App Admin (center_id=null) can delete all, others only their center
      const centerId = req.center_id || req.user?.center_id || null;
      await foldersModel.delete(req.params.id, centerId); 
      res.json({message: 'Deleted successfully'}); 
    } catch(err){ 
      res.status(500).json({error: err.message}); 
    } 
  },

};

module.exports = foldersController;
