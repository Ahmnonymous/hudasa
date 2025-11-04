const supplierProfileModel = require('../models/supplierProfileModel');

const supplierProfileController = {
  getAll: async (req, res) => { 
    try {
      // ? Apply tenant filtering: App Admin (center_id=null) sees all, HQ and others see only their center
      const centerId = req.center_id || req.user?.center_id;
      // ? Only App Admin (role 1) bypasses filtering - HQ (role 2) should be filtered by center_id
      const isSuperAdmin = req.isAppAdmin || false; // Only App Admin, NOT HQ
      const data = await supplierProfileModel.getAll(centerId, isSuperAdmin); 
      res.json(data); 
    } catch(err){ 
      res.status(500).json({error: err.message}); 
    } 
  },
  
  getById: async (req, res) => { 
    try {
      // ? Apply tenant filtering
      const centerId = req.center_id || req.user?.center_id;
      const isMultiCenter = req.isMultiCenter;
      
      // ? Validate UUID format (Supplier_Profile uses UUID, not integer)
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(req.params.id)) {
        return res.status(400).json({ error: 'Invalid supplier ID format. Must be a valid UUID.' });
      }
      
      const data = await supplierProfileModel.getById(req.params.id, centerId, isMultiCenter); 
      if(!data) {
        return res.status(404).json({error: 'Supplier not found'}); 
      }
      res.json(data); 
    } catch(err){ 
      console.error(`[ERROR] SupplierProfileController.getById - ${err.message}`, err);
      res.status(500).json({error: err.message || 'Internal server error'}); 
    } 
  },
  
  create: async (req, res) => { 
    try {
      const fields = { ...req.body };
      
      // ? Add audit fields
      const username = req.user?.username || 'system';
      fields.created_by = username;
      fields.updated_by = username;
      
      // ? Add center_id
      const centerId = req.center_id || req.user?.center_id;
      const data = await supplierProfileModel.create(fields, centerId); 
      res.status(201).json(data); 
    } catch(err){ 
      res.status(500).json({error: err.message}); 
    } 
  },
  
  update: async (req, res) => { 
    try {
      const fields = { ...req.body };
      
      // ? Add audit field (don't allow overwrite of created_by)
      const username = req.user?.username || 'system';
      fields.updated_by = username;
      delete fields.created_by;
      
      // ? Apply tenant filtering
      const centerId = req.center_id || req.user?.center_id;
      const isMultiCenter = req.isMultiCenter;
      const data = await supplierProfileModel.update(req.params.id, fields, centerId, isMultiCenter); 
      res.json(data); 
    } catch(err){ 
      res.status(500).json({error: err.message}); 
    } 
  },
  
  delete: async (req, res) => { 
    try {
      // ? Apply tenant filtering
      const centerId = req.center_id || req.user?.center_id;
      const isMultiCenter = req.isMultiCenter;
      await supplierProfileModel.delete(req.params.id, centerId, isMultiCenter); 
      res.json({message: 'Deleted successfully'}); 
    } catch(err){ 
      res.status(500).json({error: err.message}); 
    } 
  },
};

module.exports = supplierProfileController;
