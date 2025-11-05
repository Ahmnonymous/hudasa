const suburbMasjidsModel = require('../models/suburbMasjidsModel');

const suburbMasjidsController = {
  getAll: async (req, res) => { 
    try { 
      const centerId = req.center_id || req.user?.center_id;
      const isMultiCenter = req.isMultiCenter;
      const data = await suburbMasjidsModel.getAll(centerId, isMultiCenter); 
      res.json(data); 
    } catch(err){ 
      res.status(500).json({error: err.message}); 
    } 
  },
  
  getById: async (req, res) => { 
    try { 
      const centerId = req.center_id || req.user?.center_id;
      const isMultiCenter = req.isMultiCenter;
      const data = await suburbMasjidsModel.getById(req.params.id, centerId, isMultiCenter); 
      if(!data) return res.status(404).json({error: 'Not found'}); 
      res.json(data); 
    } catch(err){ 
      res.status(500).json({error: err.message}); 
    } 
  },

  getBySuburbId: async (req, res) => { 
    try { 
      const centerId = req.center_id || req.user?.center_id;
      const isMultiCenter = req.isMultiCenter;
      const suburbId = req.params.suburbId || req.query.suburb_id;
      if (!suburbId) {
        return res.status(400).json({error: 'suburb_id is required'});
      }
      const data = await suburbMasjidsModel.getBySuburbId(suburbId, centerId, isMultiCenter); 
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
      
      if (!fields.center_id) {
        fields.center_id = req.center_id || req.user?.center_id;
      }
      
      if (!fields.center_id) {
        return res.status(400).json({ error: 'center_id is required' });
      }

      const data = await suburbMasjidsModel.create(fields); 
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
      const data = await suburbMasjidsModel.update(req.params.id, fields, centerId, isMultiCenter); 
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
      const data = await suburbMasjidsModel.delete(req.params.id, centerId, isMultiCenter);
      if (!data) return res.status(404).json({error: 'Not found'});
      res.json({message: 'Deleted successfully'}); 
    } catch(err){ 
      res.status(500).json({error: err.message}); 
    } 
  },
};

module.exports = suburbMasjidsController;

