const centerAuditsModel = require('../models/centerAuditsModel');
const fs = require('fs').promises;

const centerAuditsController = {
  getAll: async (req, res) => { 
    try { 
      const data = await centerAuditsModel.getAll(req.center_id, req.isMultiCenter); 
      res.json(data); 
    } catch(err){ 
      res.status(500).json({error: err.message}); 
    } 
  },
  
  getById: async (req, res) => { 
    try { 
      const data = await centerAuditsModel.getById(req.params.id, req.center_id, req.isMultiCenter); 
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
      
      // Handle file upload if present
      if (req.files && req.files.attachments && req.files.attachments.length > 0) {
        const file = req.files.attachments[0];
        const buffer = await fs.readFile(file.path);
        fields.attachments = buffer;
        fields.attachments_filename = file.originalname;
        fields.attachments_mime = file.mimetype;
        fields.attachments_size = file.size;
        await fs.unlink(file.path);
      }
      
      const data = await centerAuditsModel.create(fields); 
      res.status(201).json(data); 
    } catch(err){ 
      res.status(500).json({error: "Error creating record in Center_Audits: " + err.message}); 
    } 
  },
  
  update: async (req, res) => { 
    try {
      // ? Add audit fields
      const username = req.user?.username || 'system';
      req.body.updated_by = username;
      
      const fields = { ...req.body };
      
      // Handle file upload if present
      if (req.files && req.files.attachments && req.files.attachments.length > 0) {
        const file = req.files.attachments[0];
        const buffer = await fs.readFile(file.path);
        fields.attachments = buffer;
        fields.attachments_filename = file.originalname;
        fields.attachments_mime = file.mimetype;
        fields.attachments_size = file.size;
        await fs.unlink(file.path);
      }
      
      const data = await centerAuditsModel.update(req.params.id, fields, req.center_id, req.isMultiCenter); 
      res.json(data); 
    } catch(err){ 
      res.status(500).json({error: "Error updating record in Center_Audits: " + err.message}); 
    } 
  },
  
  delete: async (req, res) => { 
    try { 
      await centerAuditsModel.delete(req.params.id, req.center_id, req.isMultiCenter); 
      res.json({message: 'Deleted successfully'}); 
    } catch(err){ 
      res.status(500).json({error: err.message}); 
    } 
  },

  viewAttachment: async (req, res) => {
    try {
      const record = await centerAuditsModel.getById(req.params.id, req.center_id, req.isMultiCenter);
      if (!record) return res.status(404).send("Record not found");
      if (!record.attachments) return res.status(404).send("No attachment found");
  
      const mimeType = record.attachments_mime || "application/octet-stream";
      const filename = record.attachments_filename || "attachment";
  
      let buffer = record.attachments;
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
      const record = await centerAuditsModel.getById(req.params.id, req.center_id, req.isMultiCenter);
      if (!record) return res.status(404).send("Record not found");
      if (!record.attachments) return res.status(404).send("No attachment found");
  
      const mimeType = record.attachments_mime || "application/octet-stream";
      const filename = record.attachments_filename || "attachment";
  
      let buffer = record.attachments;
  
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

module.exports = centerAuditsController;
