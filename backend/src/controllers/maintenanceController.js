const maintenanceModel = require('../models/maintenanceModel');
const islamicCentersModel = require('../models/islamicCentersModel');

const maintenanceController = {
  getAll: async (req, res) => { 
    try { 
      const centerId = req.center_id || req.user?.center_id;
      const isMultiCenter = req.isMultiCenter;
      const data = await maintenanceModel.getAll(centerId, isMultiCenter); 
      res.json(data); 
    } catch(err){ 
      res.status(500).json({error: err.message}); 
    } 
  },
  
  getById: async (req, res) => { 
    try { 
      const centerId = req.center_id || req.user?.center_id;
      const isMultiCenter = req.isMultiCenter;
      const data = await maintenanceModel.getById(req.params.id, centerId, isMultiCenter); 
      if(!data) return res.status(404).json({error: 'Not found'}); 
      res.json(data); 
    } catch(err){ 
      res.status(500).json({error: err.message}); 
    } 
  },

  getByIslamicCenterId: async (req, res) => { 
    try { 
      const centerId = req.center_id || req.user?.center_id;
      const isMultiCenter = req.isMultiCenter;
      const islamicCenterId = req.params.islamicCenterId || req.query.islamic_center_id;
      if (!islamicCenterId) {
        return res.status(400).json({error: 'islamic_center_id is required'});
      }
      const data = await maintenanceModel.getByIslamicCenterId(islamicCenterId, centerId, isMultiCenter); 
      res.json(data); 
    } catch(err){ 
      res.status(500).json({error: err.message}); 
    } 
  },
  
  create: async (req, res) => { 
    try {
      const fields = { ...req.body };
      
      const username = req.user?.username || 'system';
      fields.created_by = username;
      fields.updated_by = username;
      
      if (!fields.center_id && fields.islamic_center_id) {
        try {
          const islamicCenter = await islamicCentersModel.getById(fields.islamic_center_id, null, true);
          if (islamicCenter && islamicCenter.center_id) {
            fields.center_id = islamicCenter.center_id;
          }
        } catch (err) {
          console.warn(`⚠️  Could not derive center_id from Islamic Center: ${err.message}`);
        }
      }
      
      if (!fields.center_id) {
        fields.center_id = req.center_id || req.user?.center_id;
      }
      
      if (!fields.center_id) {
        return res.status(400).json({ error: 'center_id is required' });
      }

      const data = await maintenanceModel.create(fields); 
      res.status(201).json(data); 
    } catch(err){ 
      res.status(500).json({error: err.message}); 
    } 
  },
  
  update: async (req, res) => { 
    try {
      const fields = { ...req.body };
      
      const username = req.user?.username || 'system';
      fields.updated_by = username;
      delete fields.created_by;
      
      const centerId = req.center_id || req.user?.center_id;
      const isMultiCenter = req.isMultiCenter;
      const data = await maintenanceModel.update(req.params.id, fields, centerId, isMultiCenter); 
      if (!data) return res.status(404).json({error: 'Not found'});
      res.json(data); 
    } catch(err){ 
      res.status(500).json({error: err.message}); 
    } 
  },
  
  delete: async (req, res) => { 
    try {
      const centerId = req.center_id || req.user?.center_id;
      const isMultiCenter = req.isMultiCenter;
      const data = await maintenanceModel.delete(req.params.id, centerId, isMultiCenter);
      if (!data) return res.status(404).json({error: 'Not found'});
      res.json({message: 'Deleted successfully'}); 
    } catch(err){ 
      res.status(500).json({error: err.message}); 
    } 
  },
};

module.exports = maintenanceController;

