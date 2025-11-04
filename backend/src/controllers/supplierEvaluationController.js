const supplierEvaluationModel = require('../models/supplierEvaluationModel');

const supplierEvaluationController = {
  getAll: async (req, res) => { 
    try { 
      const supplierId = req.query.supplier_id;
      const data = await supplierEvaluationModel.getAll(req.center_id, req.isMultiCenter, supplierId); 
      res.json(data); 
    } catch(err){ 
      res.status(500).json({error: err.message}); 
    } 
  },
  getById: async (req, res) => { 
    try { 
      const data = await supplierEvaluationModel.getById(req.params.id, req.center_id, req.isMultiCenter); 
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
      
      // Map frontend field names to database column names
      const mappedFields = {
        supplier_id: fields.supplier_id,
        eval_date: fields.eval_date,
        quality_score: fields.quality_score,
        delivery_score: fields.delivery_score,
        cost_score: fields.cost_score,
        ohs_score: fields.ohs_score,
        env_score: fields.env_score,
        quality_wt: fields.quality_wt,
        delivery_wt: fields.delivery_wt,
        cost_wt: fields.cost_wt,
        ohs_wt: fields.ohs_wt,
        env_wt: fields.env_wt,
        overall_score: fields.overall_score,
        status: fields.status,
        expiry_date: fields.expiry_date,
        notes: fields.notes,
        created_by: fields.created_by,
        updated_by: fields.updated_by,
      };
      
      // Remove undefined values
      Object.keys(mappedFields).forEach(key => {
        if (mappedFields[key] === undefined) {
          delete mappedFields[key];
        }
      });
      
      const data = await supplierEvaluationModel.create(mappedFields); 
      res.status(201).json(data); 
    } catch(err){ 
      res.status(500).json({error: err.message}); 
    } 
  },
  update: async (req, res) => { 
    try {
      // ? Add audit fields
      const username = req.user?.username || 'system';
      req.body.updated_by = username;
      
      const fields = { ...req.body };
      
      // Map frontend field names to database column names
      const mappedFields = {
        supplier_id: fields.supplier_id,
        eval_date: fields.eval_date,
        quality_score: fields.quality_score,
        delivery_score: fields.delivery_score,
        cost_score: fields.cost_score,
        ohs_score: fields.ohs_score,
        env_score: fields.env_score,
        quality_wt: fields.quality_wt,
        delivery_wt: fields.delivery_wt,
        cost_wt: fields.cost_wt,
        ohs_wt: fields.ohs_wt,
        env_wt: fields.env_wt,
        overall_score: fields.overall_score,
        status: fields.status,
        expiry_date: fields.expiry_date,
        notes: fields.notes,
        updated_by: fields.updated_by,
      };
      
      // Remove undefined values
      Object.keys(mappedFields).forEach(key => {
        if (mappedFields[key] === undefined) {
          delete mappedFields[key];
        }
      });
      
      const data = await supplierEvaluationModel.update(req.params.id, mappedFields, req.center_id, req.isMultiCenter); 
      res.json(data); 
    } catch(err){ 
      res.status(500).json({error: err.message}); 
    } 
  },
  delete: async (req, res) => { 
    try { 
      await supplierEvaluationModel.delete(req.params.id, req.center_id, req.isMultiCenter); 
      res.json({message: 'Deleted successfully'}); 
    } catch(err){ 
      res.status(500).json({error: err.message}); 
    } 
  },
};

module.exports = supplierEvaluationController;
