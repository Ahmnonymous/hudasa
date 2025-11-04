const applicantDetailsModel = require('../models/applicantDetailsModel');
const fs = require('fs').promises;

const applicantDetailsController = {
  getAll: async (req, res) => { 
    try {
      // ? Apply tenant filtering: App Admin (center_id=null) sees all, HQ and others see only their center
      const centerId = req.center_id || req.user?.center_id;
      // ? Only App Admin (role 1) bypasses filtering - HQ (role 2) should be filtered by center_id
      const isSuperAdmin = req.isAppAdmin || false; // Only App Admin, NOT HQ
      const data = await applicantDetailsModel.getAll(centerId, isSuperAdmin); 
      res.json(data); 
    } catch(err){ 
      res.status(500).json({error: err.message}); 
    } 
  },
  
  getById: async (req, res) => { 
    try {
      // ? Apply tenant filtering: App Admin (center_id=null) sees all, HQ and others see only their center
      const centerId = req.center_id || req.user?.center_id;
      // ? Only App Admin (role 1) bypasses filtering - HQ (role 2) should be filtered by center_id
      const isSuperAdmin = req.isAppAdmin || false; // Only App Admin, NOT HQ
      const data = await applicantDetailsModel.getById(req.params.id, centerId, isSuperAdmin); 
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
      
      // Handle file upload if present (signature)
      if (req.files && req.files.signature && req.files.signature.length > 0) {
        const file = req.files.signature[0];
        const buffer = await fs.readFile(file.path);
        fields.signature = buffer;
        fields.signature_filename = file.originalname;
        fields.signature_mime = file.mimetype;
        fields.signature_size = file.size;
        await fs.unlink(file.path);
      }
      
      const data = await applicantDetailsModel.create(fields); 
      res.status(201).json(data); 
    } catch(err){ 
      res.status(500).json({error: "Error creating record in Applicant_Details: " + err.message}); 
    } 
  },
  
  update: async (req, res) => { 
    try { 
      const fields = { ...req.body };
      
      // ? Add audit field (don't allow overwrite of created_by)
      const username = req.user?.username || 'system';
      fields.updated_by = username;
      delete fields.created_by; // Prevent overwrite
      
      // Handle file upload if present (signature)
      if (req.files && req.files.signature && req.files.signature.length > 0) {
        const file = req.files.signature[0];
        const buffer = await fs.readFile(file.path);
        fields.signature = buffer;
        fields.signature_filename = file.originalname;
        fields.signature_mime = file.mimetype;
        fields.signature_size = file.size;
        await fs.unlink(file.path);
      }
      
      // ? Apply tenant filtering: App Admin (center_id=null) sees all, HQ and others see only their center
      const centerId = req.center_id || req.user?.center_id;
      // ? Only App Admin (role 1) bypasses filtering - HQ (role 2) should be filtered by center_id
      const isSuperAdmin = req.isAppAdmin || false; // Only App Admin, NOT HQ
      const data = await applicantDetailsModel.update(req.params.id, fields, centerId, isSuperAdmin); 
      res.json(data); 
    } catch(err){ 
      res.status(500).json({error: "Error updating record in Applicant_Details: " + err.message}); 
    } 
  },
  
  delete: async (req, res) => { 
    try {
      // ? Apply tenant filtering: App Admin (center_id=null) sees all, HQ and others see only their center
      const centerId = req.center_id || req.user?.center_id;
      // ? Only App Admin (role 1) bypasses filtering - HQ (role 2) should be filtered by center_id
      const isSuperAdmin = req.isAppAdmin || false; // Only App Admin, NOT HQ
      await applicantDetailsModel.delete(req.params.id, centerId, isSuperAdmin); 
      res.json({message: 'Deleted successfully'}); 
    } catch(err){ 
      res.status(500).json({error: err.message}); 
    } 
  },

  viewSignature: async (req, res) => {
    try {
      // ? Apply tenant filtering: App Admin (center_id=null) sees all, HQ and others see only their center
      const centerId = req.center_id || req.user?.center_id;
      // ? Only App Admin (role 1) bypasses filtering - HQ (role 2) should be filtered by center_id
      const isSuperAdmin = req.isAppAdmin || false; // Only App Admin, NOT HQ
      const record = await applicantDetailsModel.getById(req.params.id, centerId, isSuperAdmin);
      if (!record) return res.status(404).send("Record not found");
      if (!record.signature) return res.status(404).send("No signature found");
  
      const mimeType = record.signature_mime || "image/png";
      const filename = record.signature_filename || "signature";
  
      let buffer = record.signature;
      if (typeof buffer === "string") {
        if (buffer.startsWith("\\x")) {
          buffer = Buffer.from(buffer.slice(2), "hex");
        } else if (/^[A-Za-z0-9+/=]+$/.test(buffer)) {
          buffer = Buffer.from(buffer, "base64");
        } else {
          throw new Error("Unknown signature encoding");
        }
      }
  
      if (!buffer || !buffer.length) {
        return res.status(500).send("Signature buffer is empty or corrupted");
      }
  
      res.setHeader("Content-Type", mimeType);
      res.setHeader("Content-Disposition", `inline; filename="${filename}"`);
      res.setHeader("Content-Length", buffer.length);
  
      res.end(buffer, "binary");
    } catch (err) {
      console.error("Error viewing signature:", err);
      res.status(500).json({ error: "Error viewing signature: " + err.message });
    }
  },

  downloadSignature: async (req, res) => {
    try {
      // ? Apply tenant filtering: App Admin (center_id=null) sees all, HQ and others see only their center
      const centerId = req.center_id || req.user?.center_id;
      // ? Only App Admin (role 1) bypasses filtering - HQ (role 2) should be filtered by center_id
      const isSuperAdmin = req.isAppAdmin || false; // Only App Admin, NOT HQ
      const record = await applicantDetailsModel.getById(req.params.id, centerId, isSuperAdmin);
      if (!record) return res.status(404).send("Record not found");
      if (!record.signature) return res.status(404).send("No signature found");
  
      const mimeType = record.signature_mime || "image/png";
      const filename = record.signature_filename || "signature";
  
      let buffer = record.signature;
  
      if (typeof buffer === "string") {
        if (buffer.startsWith("\\x")) {
          buffer = Buffer.from(buffer.slice(2), "hex");
        } else if (/^[A-Za-z0-9+/=]+$/.test(buffer)) {
          buffer = Buffer.from(buffer, "base64");
        } else {
          throw new Error("Unknown signature encoding");
        }
      }
  
      if (!buffer || !buffer.length) {
        return res.status(500).send("Signature buffer is empty or corrupted");
      }
  
      res.setHeader("Content-Type", mimeType);
      res.setHeader("Content-Disposition", `attachment; filename="${encodeURIComponent(filename)}"`);
      res.setHeader("Content-Length", buffer.length);
  
      res.end(buffer);
    } catch (err) {
      console.error("Error downloading signature:", err);
      res.status(500).json({ error: "Error downloading signature: " + err.message });
    }
  }
};

module.exports = applicantDetailsController;
