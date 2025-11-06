const conductAssessmentModel = require('../models/conductAssessmentModel');

const conductAssessmentController = {
  getAll: async (req, res) => { 
    try { 
      // ? Apply tenant filtering
      const centerId = req.center_id || req.user?.center_id;
      const isMultiCenter = req.isMultiCenter;
      const data = await conductAssessmentModel.getAll(centerId, isMultiCenter); 
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
      const data = await conductAssessmentModel.getById(req.params.id, centerId, isMultiCenter); 
      if(!data) return res.status(404).json({error: 'Not found'}); 
      res.json(data); 
    } catch(err){ 
      res.status(500).json({error: err.message}); 
    } 
  },

  getByMadressahAppId: async (req, res) => { 
    try { 
      // ? Apply tenant filtering
      const centerId = req.center_id || req.user?.center_id;
      const isMultiCenter = req.isMultiCenter;
      const madressahAppId = req.params.madressahAppId || req.query.madressah_app_id;
      if (!madressahAppId) {
        return res.status(400).json({error: 'madressah_app_id is required'});
      }
      const data = await conductAssessmentModel.getByMadressahAppId(madressahAppId, centerId, isMultiCenter); 
      res.json(data); 
    } catch(err){ 
      res.status(500).json({error: err.message}); 
    } 
  },
  
  create: async (req, res) => { 
    try {
      const fields = { ...req.body };
      
      // ? Add audit fields
      const username = req.user?.username || 'system';
      fields.created_by = username;
      fields.updated_by = username;
      
      // ? Add center_id - ensure it's set (required field)
      if (!fields.center_id) {
        fields.center_id = req.center_id || req.user?.center_id;
      }
      
      // Convert to integer if string
      if (fields.center_id) {
        fields.center_id = parseInt(fields.center_id);
      }
      if (fields.madressah_app_id) {
        fields.madressah_app_id = parseInt(fields.madressah_app_id);
      }
      
      const data = await conductAssessmentModel.create(fields); 
      res.status(201).json(data); 
    } catch(err){ 
      res.status(500).json({error: "Error creating record in Conduct_Assessment: " + err.message}); 
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
      const data = await conductAssessmentModel.update(req.params.id, fields, centerId, isMultiCenter); 
      if (!data) return res.status(404).json({error: 'Not found'});
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
      const data = await conductAssessmentModel.delete(req.params.id, centerId, isMultiCenter);
      if (!data) return res.status(404).json({error: 'Not found'});
      res.json({message: 'Deleted successfully'}); 
    } catch(err){ 
      res.status(500).json({error: err.message}); 
    } 
  },
};

module.exports = conductAssessmentController;

