const programsModel = require('../models/programsModel');
const fs = require('fs').promises;

const programsController = {
  getAll: async (req, res) => { 
    try {
      // ? Apply tenant filtering
      const centerId = req.center_id || req.user?.center_id;
      const isMultiCenter = req.isMultiCenter;
      const data = await programsModel.getAll(centerId, isMultiCenter); 
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
      const data = await programsModel.getById(req.params.id, centerId, isMultiCenter); 
      if(!data) return res.status(404).json({error: 'Not found'}); 
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
      fields.center_id = req.center_id || req.user?.center_id;
      
      // Convert empty strings to null for numeric fields
      const numericFields = ['person_trained_id', 'program_name', 'means_of_communication', 'communicated_by', 'training_level', 'training_provider', 'program_outcome'];
      numericFields.forEach(field => {
        if (fields[field] === '' || fields[field] === undefined) {
          fields[field] = null;
        } else if (fields[field] !== null) {
          fields[field] = parseInt(fields[field]);
        }
      });
      
      // Handle empty date fields
      const dateFields = ['date_of_program'];
      dateFields.forEach(field => {
        if (fields[field] === '' || fields[field] === undefined) {
          fields[field] = null;
        }
      });
      
      // Handle file upload if present
      if (req.files && req.files.attachment && req.files.attachment.length > 0) {
        const file = req.files.attachment[0];
        const buffer = await fs.readFile(file.path);
        fields.attachment = buffer;
        fields.attachment_filename = file.originalname;
        fields.attachment_mime = file.mimetype;
        fields.attachment_size = file.size;
        await fs.unlink(file.path);
      }
      
      const data = await programsModel.create(fields); 
      res.status(201).json(data); 
    } catch(err){ 
      res.status(500).json({error: "Error creating record in Programs: " + err.message}); 
    } 
  },
  
  update: async (req, res) => { 
    try { 
      const fields = { ...req.body };
      
      // ? Add audit field (don't allow overwrite of created_by)
      const username = req.user?.username || 'system';
      fields.updated_by = username;
      delete fields.created_by; // Prevent overwrite
      
      // Convert empty strings to null for numeric fields
      const numericFields = ['person_trained_id', 'program_name', 'means_of_communication', 'communicated_by', 'training_level', 'training_provider', 'program_outcome'];
      numericFields.forEach(field => {
        if (fields[field] === '' || fields[field] === undefined) {
          fields[field] = null;
        } else if (fields[field] !== null) {
          fields[field] = parseInt(fields[field]);
        }
      });
      
      // Handle empty date fields
      const dateFields = ['date_of_program'];
      dateFields.forEach(field => {
        if (fields[field] === '' || fields[field] === undefined) {
          fields[field] = null;
        }
      });
      
      // Handle file upload if present
      if (req.files && req.files.attachment && req.files.attachment.length > 0) {
        const file = req.files.attachment[0];
        const buffer = await fs.readFile(file.path);
        fields.attachment = buffer;
        fields.attachment_filename = file.originalname;
        fields.attachment_mime = file.mimetype;
        fields.attachment_size = file.size;
        await fs.unlink(file.path);
      }
      
      // ? Apply tenant filtering
      const centerId = req.center_id || req.user?.center_id;
      const isMultiCenter = req.isMultiCenter;
      const data = await programsModel.update(req.params.id, fields, centerId, isMultiCenter); 
      res.json(data); 
    } catch(err){ 
      res.status(500).json({error: "Error updating record in Programs: " + err.message}); 
    } 
  },
  
  delete: async (req, res) => { 
    try {
      // ? Apply tenant filtering
      const centerId = req.center_id || req.user?.center_id;
      const isMultiCenter = req.isMultiCenter;
      await programsModel.delete(req.params.id, centerId, isMultiCenter); 
      res.json({message: 'Deleted successfully'}); 
    } catch(err){ 
      res.status(500).json({error: err.message}); 
    } 
  },

  viewAttachment: async (req, res) => {
    try {
      // ? Apply tenant filtering
      const centerId = req.center_id || req.user?.center_id;
      const isMultiCenter = req.isMultiCenter;
      const record = await programsModel.getById(req.params.id, centerId, isMultiCenter);
      if (!record) return res.status(404).send("Record not found");
      if (!record.attachment) return res.status(404).send("No attachment found");
  
      const mimeType = record.attachment_mime || "application/octet-stream";
      const filename = record.attachment_filename || "attachment";
  
      let buffer = record.attachment;
      if (typeof buffer === "string") {
        if (buffer.startsWith("\\x")) {
          buffer = Buffer.from(buffer.slice(2), "hex");
        } else if (/^[A-Za-z0-9+/=]+$/.test(buffer)) {
          buffer = Buffer.from(buffer, "base64");
        } else {
          throw new Error("Unknown attachment encoding");
        }
      }
  
      if (!buffer || !buffer.length) {
        return res.status(500).send("Attachment buffer is empty or corrupted");
      }
  
      res.setHeader("Content-Type", mimeType);
      res.setHeader("Content-Disposition", `inline; filename="${filename}"`);
      res.setHeader("Content-Length", buffer.length);
  
      res.end(buffer, "binary");
    } catch (err) {
      console.error("Error viewing attachment:", err);
      res.status(500).json({ error: "Error viewing attachment: " + err.message });
    }
  },

  downloadAttachment: async (req, res) => {
    try {
      // ? Apply tenant filtering
      const centerId = req.center_id || req.user?.center_id;
      const isMultiCenter = req.isMultiCenter;
      const record = await programsModel.getById(req.params.id, centerId, isMultiCenter);
      if (!record) return res.status(404).send("Record not found");
      if (!record.attachment) return res.status(404).send("No attachment found");
  
      const mimeType = record.attachment_mime || "application/octet-stream";
      const filename = record.attachment_filename || "attachment";
  
      let buffer = record.attachment;
  
      if (typeof buffer === "string") {
        if (buffer.startsWith("\\x")) {
          buffer = Buffer.from(buffer.slice(2), "hex");
        } else if (/^[A-Za-z0-9+/=]+$/.test(buffer)) {
          buffer = Buffer.from(buffer, "base64");
        } else {
          throw new Error("Unknown attachment encoding");
        }
      }
  
      if (!buffer || !buffer.length) {
        return res.status(500).send("Attachment buffer is empty or corrupted");
      }
  
      res.setHeader("Content-Type", mimeType);
      res.setHeader("Content-Disposition", `attachment; filename="${encodeURIComponent(filename)}"`);
      res.setHeader("Content-Length", buffer.length);
  
      res.end(buffer);
    } catch (err) {
      console.error("Error downloading attachment:", err);
      res.status(500).json({ error: "Error downloading attachment: " + err.message });
    }
  }
};

module.exports = programsController;
