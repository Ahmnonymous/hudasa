const personalFilesModel = require('../models/personalFilesModel');
const fs = require('fs').promises;

const personalFilesController = {
  getAll: async (req, res) => { 
    try { 
      // ? App Admin (center_id=null) sees all, others see only their center
      let centerId = req.center_id || req.user?.center_id || null;
      
      // ?? DEBUG: Log user context
      console.log(`[DEBUG] PersonalFiles.getAll - user: ${req.user?.username}, role: ${req.user?.user_type}, center_id (raw): ${req.user?.center_id}, center_id (final): ${centerId}, type: ${typeof centerId}`);
      
      // ? Normalize centerId: convert to integer or null
      if (centerId !== null && centerId !== undefined) {
        centerId = parseInt(centerId);
        if (isNaN(centerId)) {
          centerId = null; // Invalid number becomes null
        }
      } else {
        centerId = null; // Explicitly set to null
      }
      
      console.log(`[DEBUG] PersonalFiles.getAll - normalized centerId: ${centerId} (type: ${typeof centerId})`);
      
      const data = await personalFilesModel.getAll(centerId); 
      res.json(data); 
    } catch(err){ 
      console.error(`[ERROR] PersonalFiles.getAll - ${err.message}`, err);
      res.status(500).json({error: err.message}); 
    } 
  },
  
  getById: async (req, res) => { 
    try { 
      // ? App Admin (center_id=null) sees all, others see only their center
      const centerId = req.center_id || req.user?.center_id || null;
      const data = await personalFilesModel.getById(req.params.id, centerId); 
      if(!data) return res.status(404).json({error: 'Not found'}); 
      res.json(data); 
    } catch(err){ 
      res.status(500).json({error: err.message}); 
    } 
  },
  
  create: async (req, res) => { 
    try { 
      const fields = { ...req.body };
      // ? Enforce audit fields and tenant context
      const username = req.user?.username || 'system';
      fields.created_by = fields.created_by || username;
      fields.updated_by = fields.updated_by || username;
      fields.center_id = req.center_id || req.user?.center_id || fields.center_id;
      
      // Clean up empty strings for numeric fields
      if (fields.folder_id === '' || fields.folder_id === 'null' || fields.folder_id === 'undefined') {
        delete fields.folder_id;
      } else if (fields.folder_id) {
        fields.folder_id = parseInt(fields.folder_id);
      }
      
      if (fields.employee_id === '' || fields.employee_id === 'null' || fields.employee_id === 'undefined') {
        delete fields.employee_id;
      } else if (fields.employee_id) {
        fields.employee_id = parseInt(fields.employee_id);
      }
      
      if (fields.center_id) {
        fields.center_id = parseInt(fields.center_id);
      }
      
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
      
      const data = await personalFilesModel.create(fields); 
      res.status(201).json(data); 
    } catch(err){ 
      res.status(500).json({error: "Error creating record in Personal_Files: " + err.message}); 
    } 
  },
  
  update: async (req, res) => { 
    try { 
      const fields = { ...req.body };
      // ? Enforce audit fields and prevent created_by override
      delete fields.created_by;
      fields.updated_by = req.user?.username || 'system';
      fields.center_id = req.center_id || req.user?.center_id || fields.center_id;
      
      // Clean up empty strings for numeric fields
      if (fields.folder_id === '' || fields.folder_id === 'null' || fields.folder_id === 'undefined') {
        delete fields.folder_id;
      } else if (fields.folder_id) {
        fields.folder_id = parseInt(fields.folder_id);
      }
      
      if (fields.employee_id === '' || fields.employee_id === 'null' || fields.employee_id === 'undefined') {
        delete fields.employee_id;
      } else if (fields.employee_id) {
        fields.employee_id = parseInt(fields.employee_id);
      }
      
      if (fields.center_id) {
        fields.center_id = parseInt(fields.center_id);
      }
      
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
      
      // ? App Admin (center_id=null) can update all, others only their center
      const centerId = req.center_id || req.user?.center_id || null;
      const data = await personalFilesModel.update(req.params.id, fields, centerId); 
      res.json(data); 
    } catch(err){ 
      res.status(500).json({error: "Error updating record in Personal_Files: " + err.message}); 
    } 
  },
  
  delete: async (req, res) => { 
    try { 
      // ? App Admin (center_id=null) can delete all, others only their center
      const centerId = req.center_id || req.user?.center_id || null;
      await personalFilesModel.delete(req.params.id, centerId); 
      res.json({message: 'Deleted successfully'}); 
    } catch(err){ 
      res.status(500).json({error: err.message}); 
    } 
  },

  viewFile: async (req, res) => {
    try {
      // ? App Admin (center_id=null) can view all, others only their center
      const centerId = req.center_id || req.user?.center_id || null;
      const record = await personalFilesModel.getById(req.params.id, centerId);
      if (!record) return res.status(404).send("Record not found");
      if (!record.file) return res.status(404).send("No file found");
  
      const mimeType = record.file_mime || "application/octet-stream";
      const filename = record.file_filename || "file";
  
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
      // ? App Admin (center_id=null) can view all, others only their center
      const centerId = req.center_id || req.user?.center_id || null;
      const record = await personalFilesModel.getById(req.params.id, centerId);
      if (!record) return res.status(404).send("Record not found");
      if (!record.file) return res.status(404).send("No file found");
  
      const mimeType = record.file_mime || "application/octet-stream";
      const filename = record.file_filename || "file";
  
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

module.exports = personalFilesController;
