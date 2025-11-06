const maintenanceModel = require('../models/maintenanceModel');
const centerDetailModel = require('../models/centerDetailModel');
const fs = require('fs').promises;

const maintenanceController = {
  getAll: async (req, res) => { 
    try { 
      const centerId = req.center_id || req.user?.center_id;
      const isMultiCenter = req.isMultiCenter;
      const data = await maintenanceModel.getAll(centerId, isMultiCenter); 
      res.json(data); 
    } catch(err){ 
      res.status(500).json({error: err.message}); 
    } 
  },
  
  getById: async (req, res) => { 
    try { 
      const centerId = req.center_id || req.user?.center_id;
      const isMultiCenter = req.isMultiCenter;
      const data = await maintenanceModel.getById(req.params.id, centerId, isMultiCenter); 
      if(!data) return res.status(404).json({error: 'Not found'}); 
      res.json(data); 
    } catch(err){ 
      res.status(500).json({error: err.message}); 
    } 
  },

  getByCenterDetailId: async (req, res) => { 
    try { 
      const centerId = req.center_id || req.user?.center_id;
      const isMultiCenter = req.isMultiCenter;
      const centerDetailId = req.params.centerDetailId || req.query.center_detail_id;
      if (!centerDetailId) {
        return res.status(400).json({error: 'center_detail_id is required'});
      }
      const data = await maintenanceModel.getByCenterDetailId(centerDetailId, centerId, isMultiCenter); 
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
      
      if (!fields.center_id && fields.center_detail_id) {
        try {
          const centerDetail = await centerDetailModel.getById(fields.center_detail_id, null, true);
          if (centerDetail && centerDetail.center_id) {
            fields.center_id = centerDetail.center_id;
          }
        } catch (err) {
          console.warn(`⚠️  Could not derive center_id from Center Detail: ${err.message}`);
        }
      }
      
      if (!fields.center_id) {
        fields.center_id = req.center_id || req.user?.center_id;
      }
      
      if (!fields.center_id) {
        return res.status(400).json({ error: 'center_id is required' });
      }

      // Handle file upload if present
      if (req.files && req.files.upload && req.files.upload.length > 0) {
        const file = req.files.upload[0];
        const buffer = await fs.readFile(file.path);
        fields.upload = buffer;
        fields.upload_filename = file.originalname;
        fields.upload_mime = file.mimetype;
        fields.upload_size = file.size;
        await fs.unlink(file.path);
      }

      // Model will handle column name mapping (center_detail_id -> islamic_center_id if needed)
      const data = await maintenanceModel.create(fields); 
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
      
      // Handle file upload if present
      if (req.files && req.files.upload && req.files.upload.length > 0) {
        const file = req.files.upload[0];
        const buffer = await fs.readFile(file.path);
        fields.upload = buffer;
        fields.upload_filename = file.originalname;
        fields.upload_mime = file.mimetype;
        fields.upload_size = file.size;
        await fs.unlink(file.path);
      }
      
      const centerId = req.center_id || req.user?.center_id;
      const isMultiCenter = req.isMultiCenter;
      const data = await maintenanceModel.update(req.params.id, fields, centerId, isMultiCenter); 
      if (!data) return res.status(404).json({error: 'Not found'});
      res.json(data); 
    } catch(err){ 
      res.status(500).json({error: err.message}); 
    } 
  },

  viewUpload: async (req, res) => {
    try {
      const centerId = req.center_id || req.user?.center_id;
      const isMultiCenter = req.isMultiCenter;
      const record = await maintenanceModel.getById(req.params.id, centerId, isMultiCenter);
      if (!record) return res.status(404).send("Record not found");
      if (!record.upload) return res.status(404).send("No upload found");
  
      const mimeType = record.upload_mime || "application/octet-stream";
      const filename = record.upload_filename || "upload";
  
      let buffer = record.upload;
      if (typeof buffer === "string") {
        if (buffer.startsWith("\\x")) {
          buffer = Buffer.from(buffer.slice(2), "hex");
        } else if (/^[A-Za-z0-9+/=]+$/.test(buffer)) {
          buffer = Buffer.from(buffer, "base64");
        } else {
          throw new Error("Unknown upload encoding");
        }
      }
  
      if (!buffer || !buffer.length) {
        return res.status(500).send("Upload buffer is empty or corrupted");
      }
  
      res.setHeader("Content-Type", mimeType);
      res.setHeader("Content-Disposition", `inline; filename="${filename}"`);
      res.setHeader("Content-Length", buffer.length);
  
      res.end(buffer, "binary");
    } catch (err) {
      console.error("Error viewing upload:", err);
      res.status(500).json({ error: "Error viewing upload: " + err.message });
    }
  },
  
  delete: async (req, res) => { 
    try {
      const centerId = req.center_id || req.user?.center_id;
      const isMultiCenter = req.isMultiCenter;
      const data = await maintenanceModel.delete(req.params.id, centerId, isMultiCenter);
      if (!data) return res.status(404).json({error: 'Not found'});
      res.json({message: 'Deleted successfully'}); 
    } catch(err){ 
      res.status(500).json({error: err.message}); 
    } 
  },
};

module.exports = maintenanceController;

