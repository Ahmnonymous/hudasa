const inventoryItemsModel = require('../models/inventoryItemsModel');

const inventoryItemsController = {
  getAll: async (req, res) => {
    try {
      // ? Apply tenant filtering
      const centerId = req.center_id || req.user?.center_id;
      const data = await inventoryItemsModel.getAll(centerId, req.isSuperAdmin);
      res.json(data);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },

  getById: async (req, res) => {
    try {
      // ? Apply tenant filtering
      const centerId = req.center_id || req.user?.center_id;
      const data = await inventoryItemsModel.getById(req.params.id, centerId, req.isSuperAdmin);
      if (!data) return res.status(404).json({ error: 'Not found' });
      res.json(data);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },

  create: async (req, res) => {
    try {
      // ? Add audit fields
      const username = req.user?.username || 'system';
      req.body.created_by = username;
      req.body.updated_by = username;
      
      // ? Add center_id
      req.body.center_id = req.center_id || req.user?.center_id;
      
      const data = await inventoryItemsModel.create(req.body);
      res.status(201).json(data);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },

  update: async (req, res) => {
    try {
      // ? Add audit field (don't allow overwrite of created_by)
      const username = req.user?.username || 'system';
      req.body.updated_by = username;
      delete req.body.created_by; // Prevent overwrite
      
      // ? Apply tenant filtering
      const centerId = req.center_id || req.user?.center_id;
      const data = await inventoryItemsModel.update(req.params.id, req.body, centerId, req.isSuperAdmin);
      res.json(data);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },

  delete: async (req, res) => {
    try {
      // ? Apply tenant filtering
      const centerId = req.center_id || req.user?.center_id;
      await inventoryItemsModel.delete(req.params.id, centerId, req.isSuperAdmin);
      res.json({ message: 'Deleted successfully' });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },
};

module.exports = inventoryItemsController;
