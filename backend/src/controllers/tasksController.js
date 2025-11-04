const tasksModel = require('../models/tasksModel');

const tasksController = {
  getAll: async (req, res) => {
    try {
      // ? Apply tenant filtering
      const centerId = req.center_id || req.user?.center_id;
      const isMultiCenter = req.isMultiCenter;
      const data = await tasksModel.getAll(centerId, isMultiCenter);
      res.json(data);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },

  getById: async (req, res) => {
    try {
      // ? Apply tenant filtering
      const centerId = req.center_id || req.user?.center_id;
      const isMultiCenter = req.isMultiCenter;
      const data = await tasksModel.getById(req.params.id, centerId, isMultiCenter);
      if (!data) return res.status(404).json({ error: 'Not found' });
      res.json(data);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },

  create: async (req, res) => {
    try {
      // ? Add audit fields using full name when available
      const auditName = (req.user && req.user.full_name) ? req.user.full_name : (req.user?.username || 'system');
      req.body.created_by = auditName;
      req.body.updated_by = auditName;
      
      // ? Add center_id
      req.body.center_id = req.center_id || req.user?.center_id;
      
      const data = await tasksModel.create(req.body);
      res.status(201).json(data);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },

  update: async (req, res) => {
    try {
      // ? Add audit field (don't allow overwrite of created_by)
      const auditName = (req.user && req.user.full_name) ? req.user.full_name : (req.user?.username || 'system');
      req.body.updated_by = auditName;
      delete req.body.created_by; // Prevent overwrite
      
      // ? Apply tenant filtering
      const centerId = req.center_id || req.user?.center_id;
      const isMultiCenter = req.isMultiCenter;
      const data = await tasksModel.update(req.params.id, req.body, centerId, isMultiCenter);
      res.json(data);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },

  delete: async (req, res) => {
    try {
      // ? Apply tenant filtering
      const centerId = req.center_id || req.user?.center_id;
      const isMultiCenter = req.isMultiCenter;
      await tasksModel.delete(req.params.id, centerId, isMultiCenter);
      res.json({ message: 'Deleted successfully' });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },
};

module.exports = tasksController;
