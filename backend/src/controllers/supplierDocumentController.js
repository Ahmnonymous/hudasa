const supplierDocumentModel = require('../models/supplierDocumentModel');
const fs = require('fs').promises;

const supplierDocumentController = {
  getAll: async (req, res) => { 
    try { 
      const supplierId = req.query.supplier_id;
      const data = await supplierDocumentModel.getAll(req.center_id, supplierId, req.isMultiCenter); 
      res.json(data); 
    } catch(err){ 
      res.status(500).json({error: err.message}); 
    } 
  },
  
  getById: async (req, res) => { 
    try { 
      const data = await supplierDocumentModel.getById(req.params.id, req.center_id, req.isMultiCenter); 
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
      if (req.file) {
        const file = req.file;
        const buffer = await fs.readFile(file.path);
        fields.file = buffer;
        fields.file_filename = file.originalname;
        fields.file_mime = file.mimetype;
        fields.file_size = file.size;
        await fs.unlink(file.path);
      }
      
      // Map frontend field names to database column names
      // PostgreSQL converts unquoted identifiers to lowercase
      const mappedFields = {
        supplier_id: fields.supplier_id,
        doc_type: fields.doc_type,
        file_filename: fields.file_filename,
        description: fields.description,
        issued_at: fields.issued_at,
        created_by: fields.created_by,
        updated_by: fields.updated_by,
        file: fields.file,
        file_mime: fields.file_mime,
        file_size: fields.file_size,
      };
      
      // Remove undefined values
      Object.keys(mappedFields).forEach(key => {
        if (mappedFields[key] === undefined) {
          delete mappedFields[key];
        }
      });
      
      // Ensure required fields are present
      if (!fields.supplier_id) {
        return res.status(400).json({error: "supplier_id is required"});
      }
      
      const data = await supplierDocumentModel.create(mappedFields, req.center_id); 
      res.status(201).json(data); 
    } catch(err){ 
      console.error('Error in create:', err);
      res.status(500).json({error: "Error creating record in Supplier_Document: " + err.message}); 
    } 
  },
  
  update: async (req, res) => { 
    try {
      // ? Add audit fields
      const username = req.user?.username || 'system';
      req.body.updated_by = username;
      
      const fields = { ...req.body };
      
      // Handle file upload if present
      if (req.file) {
        const file = req.file;
        const buffer = await fs.readFile(file.path);
        fields.file = buffer;
        fields.file_filename = file.originalname;
        fields.file_mime = file.mimetype;
        fields.file_size = file.size;
        await fs.unlink(file.path);
      }
      
      const data = await supplierDocumentModel.update(req.params.id, fields, req.center_id, req.isMultiCenter); 
      res.json(data); 
    } catch(err){ 
      res.status(500).json({error: "Error updating record in Supplier_Document: " + err.message}); 
    } 
  },
  
  delete: async (req, res) => { 
    try { 
      await supplierDocumentModel.delete(req.params.id, req.center_id, req.isMultiCenter); 
      res.json({message: 'Deleted successfully'}); 
    } catch(err){ 
      res.status(500).json({error: err.message}); 
    } 
  },

  viewFile: async (req, res) => {
    try {
      const record = await supplierDocumentModel.getById(req.params.id, req.center_id, req.isMultiCenter);
      if (!record) return res.status(404).send("Record not found");
      if (!record.file) return res.status(404).send("No file found");
  
      const mimeType = record.file_mime || "application/octet-stream";
      const filename = record.file_filename || "document";
  
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
      const record = await supplierDocumentModel.getById(req.params.id, req.center_id, req.isMultiCenter);
      if (!record) return res.status(404).send("Record not found");
      if (!record.file) return res.status(404).send("No file found");
  
      const mimeType = record.file_mime || "application/octet-stream";
      const filename = record.file_filename || "document";
  
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

module.exports = supplierDocumentController;
