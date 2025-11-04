const policyAndProcedureModel = require('../models/policyAndProcedureModel');
const lookupModel = require('../models/lookupModel');
const fs = require('fs').promises;

const policyAndProcedureController = {
  getAll: async (req, res) => { 
    try { 
      // Use lookup-based listing if available (global setup)
      const data = await lookupModel.getAll('Policy_and_Procedure', false);
      return res.json(data);
    } catch(err){ 
      // Fallback to model if lookup fails
      try {
        const data = await policyAndProcedureModel.getAll(req.center_id, req.isMultiCenter);
        return res.json(data);
      } catch (innerErr) {
        return res.status(500).json({error: innerErr.message});
      }
    } 
  },
  
  getById: async (req, res) => { 
    try { 
      const data = await policyAndProcedureModel.getById(req.params.id, req.center_id, req.isMultiCenter); 
      if(!data) return res.status(404).json({error: 'Not found'}); 
      res.json(data); 
    } catch(err){ 
      res.status(500).json({error: err.message}); 
    } 
  },
  
  create: async (req, res) => { 
    try { 
      const fields = { ...req.body };
      // ? Enforce audit fields
      const username = req.user?.username || 'system';
      fields.created_by = fields.created_by || username;
      fields.updated_by = fields.updated_by || username;
      // Note: Policy_and_Procedure table does not have center_id column - it's a global table
      
      // Handle file upload if present
      if (req.files && req.files.file && req.files.file.length > 0) {
        const file = req.files.file[0];
        const buffer = await fs.readFile(file.path);
        fields.file = buffer;
        fields.file_filename = file.originalname;
        fields.file_mime = file.mimetype;
        fields.file_size = file.size;
        await fs.unlink(file.path);
      }
      
      const data = await policyAndProcedureModel.create(fields); 
      res.status(201).json(data); 
    } catch(err){ 
      res.status(500).json({error: "Error creating record in Policy_and_Procedure: " + err.message}); 
    } 
  },
  
  update: async (req, res) => { 
    try { 
      const fields = { ...req.body };
      // ? Enforce audit fields and prevent created_by override
      delete fields.created_by;
      fields.updated_by = req.user?.username || 'system';
      // Note: Policy_and_Procedure table does not have center_id column - it's a global table
      
      // Handle file upload if present
      if (req.files && req.files.file && req.files.file.length > 0) {
        const file = req.files.file[0];
        const buffer = await fs.readFile(file.path);
        fields.file = buffer;
        fields.file_filename = file.originalname;
        fields.file_mime = file.mimetype;
        fields.file_size = file.size;
        await fs.unlink(file.path);
      }
      
      const data = await policyAndProcedureModel.update(req.params.id, fields, req.center_id, req.isMultiCenter); 
      res.json(data); 
    } catch(err){ 
      res.status(500).json({error: "Error updating record in Policy_and_Procedure: " + err.message}); 
    } 
  },
  
  delete: async (req, res) => { 
    try { 
      await policyAndProcedureModel.delete(req.params.id, req.center_id, req.isMultiCenter); 
      res.json({message: 'Deleted successfully'}); 
    } catch(err){ 
      res.status(500).json({error: err.message}); 
    } 
  },

  viewFile: async (req, res) => {
    try {
      const record = await policyAndProcedureModel.getById(req.params.id);
      if (!record) return res.status(404).send("Record not found");
      if (!record.file) return res.status(404).send("No file found");
  
      const mimeType = record.file_mime || "application/pdf";
      const filename = record.file_filename || "policy";
  
      let buffer = record.file;
      if (typeof buffer === "string") {
        if (buffer.startsWith("\\x")) {
          buffer = Buffer.from(buffer.slice(2), "hex");
        } else if (/^[A-Za-z0-9+/=]+$/.test(buffer)) {
          buffer = Buffer.from(buffer, "base64");
        } else {
          throw new Error("Unknown file encoding");
        }
      }
  
      if (!buffer || !buffer.length) {
        return res.status(500).send("File buffer is empty or corrupted");
      }
  
      res.setHeader("Content-Type", mimeType);
      res.setHeader("Content-Disposition", `inline; filename="${filename}"`);
      res.setHeader("Content-Length", buffer.length);
  
      res.end(buffer, "binary");
    } catch (err) {
      console.error("Error viewing file:", err);
      res.status(500).json({ error: "Error viewing file: " + err.message });
    }
  },

  downloadFile: async (req, res) => {
    try {
      const record = await policyAndProcedureModel.getById(req.params.id);
      if (!record) return res.status(404).send("Record not found");
      if (!record.file) return res.status(404).send("No file found");
  
      const mimeType = record.file_mime || "application/octet-stream";
      const filename = record.file_filename || "policy";
  
      let buffer = record.file;
  
      if (typeof buffer === "string") {
        if (buffer.startsWith("\\x")) {
          buffer = Buffer.from(buffer.slice(2), "hex");
        } else if (/^[A-Za-z0-9+/=]+$/.test(buffer)) {
          buffer = Buffer.from(buffer, "base64");
        } else {
          throw new Error("Unknown file encoding");
        }
      }
  
      if (!buffer || !buffer.length) {
        return res.status(500).send("File buffer is empty or corrupted");
      }
  
      res.setHeader("Content-Type", mimeType);
      res.setHeader("Content-Disposition", `attachment; filename="${encodeURIComponent(filename)}"`);
      res.setHeader("Content-Length", buffer.length);
  
      res.end(buffer);
    } catch (err) {
      console.error("Error downloading file:", err);
      res.status(500).json({ error: "Error downloading file: " + err.message });
    }
  }
};

module.exports = policyAndProcedureController;
