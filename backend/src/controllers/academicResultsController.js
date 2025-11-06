const academicResultsModel = require('../models/academicResultsModel');

const academicResultsController = {
  getAll: async (req, res) => { 
    try { 
      // ? Apply tenant filtering
      const centerId = req.center_id || req.user?.center_id;
      const isMultiCenter = req.isMultiCenter;
      const data = await academicResultsModel.getAll(centerId, isMultiCenter); 
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
      const data = await academicResultsModel.getById(req.params.id, centerId, isMultiCenter); 
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
      const data = await academicResultsModel.getByMadressahAppId(madressahAppId, centerId, isMultiCenter); 
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
      
      // Convert madressah_app_id to integer if it's a string
      if (fields.madressah_app_id) {
        fields.madressah_app_id = parseInt(fields.madressah_app_id);
      }
      
      // ? Add center_id - if not provided, get it from the madressa application
      if (!fields.center_id) {
        if (req.center_id || req.user?.center_id) {
          fields.center_id = req.center_id || req.user?.center_id;
        } else if (fields.madressah_app_id) {
          // For App Admin, get center_id from the madressa application
          try {
            const madressaApplicationModel = require('../models/madressaApplicationModel');
            const app = await madressaApplicationModel.getById(fields.madressah_app_id, null, true);
            if (app && app.center_id) {
              fields.center_id = app.center_id;
            } else if (app && app.applicant_relationship_id) {
              // If app doesn't have center_id, try to get it from the relationship
              const relationshipsModel = require('../models/relationshipsModel');
              const relationship = await relationshipsModel.getById(app.applicant_relationship_id, null, true);
              if (relationship && relationship.center_id) {
                fields.center_id = relationship.center_id;
              }
            }
          } catch (err) {
            // If lookup fails, we'll let the database constraint error through
            console.error('Error looking up center_id:', err.message);
          }
        }
      }
      
      // Convert center_id to integer if it's a string (before validation)
      if (fields.center_id) {
        fields.center_id = parseInt(fields.center_id);
        // If parseInt returns NaN, set to null
        if (isNaN(fields.center_id)) {
          fields.center_id = null;
        }
      }
      
      // Validate that center_id is set and is a valid number (required field)
      if (!fields.center_id || fields.center_id === 0 || isNaN(fields.center_id)) {
        return res.status(400).json({
          error: 'center_id is required. Please provide center_id or ensure the madressa application has a center_id.'
        });
      }
      
      const data = await academicResultsModel.create(fields); 
      res.status(201).json(data); 
    } catch(err){ 
      res.status(500).json({error: "Error creating record in Academic_Results: " + err.message}); 
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
      const data = await academicResultsModel.update(req.params.id, fields, centerId, isMultiCenter); 
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
      const data = await academicResultsModel.delete(req.params.id, centerId, isMultiCenter);
      if (!data) return res.status(404).json({error: 'Not found'});
      res.json({message: 'Deleted successfully'}); 
    } catch(err){ 
      res.status(500).json({error: err.message}); 
    } 
  },
};

module.exports = academicResultsController;

