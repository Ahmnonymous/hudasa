const madressaApplicationModel = require('../models/madressaApplicationModel');
const relationshipsModel = require('../models/relationshipsModel');

const madressaApplicationController = {
  getAll: async (req, res) => { 
    try { 
      // ? Apply tenant filtering
      const centerId = req.center_id || req.user?.center_id;
      const isMultiCenter = req.isMultiCenter;
      const data = await madressaApplicationModel.getAll(centerId, isMultiCenter); 
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
      const data = await madressaApplicationModel.getById(req.params.id, centerId, isMultiCenter); 
      if(!data) return res.status(404).json({error: 'Not found'}); 
      res.json(data); 
    } catch(err){ 
      res.status(500).json({error: err.message}); 
    } 
  },

  getByRelationshipId: async (req, res) => { 
    try { 
      // ? Apply tenant filtering
      const centerId = req.center_id || req.user?.center_id;
      const isMultiCenter = req.isMultiCenter;
      const relationshipId = req.params.relationshipId || req.query.relationship_id;
      if (!relationshipId) {
        return res.status(400).json({error: 'relationship_id is required'});
      }
      const data = await madressaApplicationModel.getByRelationshipId(relationshipId, centerId, isMultiCenter); 
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
      
      // ? Add center_id
      // If not provided in body, try to get it from the relationship
      if (!fields.center_id && fields.applicant_relationship_id) {
        try {
          const relationship = await relationshipsModel.getById(fields.applicant_relationship_id, null, true); // Allow App Admin to see any relationship
          if (relationship && relationship.center_id) {
            fields.center_id = relationship.center_id;
          }
        } catch (err) {
          // If relationship not found or error, continue - will validate below
        }
      }
      
      // If still not set, use user's center_id (for non-App Admin users)
      if (!fields.center_id) {
        fields.center_id = req.center_id || req.user?.center_id;
      }
      
      // Validate that center_id is provided (required by schema)
      if (!fields.center_id) {
        return res.status(400).json({ error: 'center_id is required. Either provide it directly or ensure the relationship has a center_id.' });
      }
      
      const data = await madressaApplicationModel.create(fields); 
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
      const data = await madressaApplicationModel.update(req.params.id, fields, centerId, isMultiCenter); 
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
      const data = await madressaApplicationModel.delete(req.params.id, centerId, isMultiCenter);
      if (!data) return res.status(404).json({error: 'Not found'});
      res.json({message: 'Deleted successfully'}); 
    } catch(err){ 
      res.status(500).json({error: err.message}); 
    } 
  },
};

module.exports = madressaApplicationController;

