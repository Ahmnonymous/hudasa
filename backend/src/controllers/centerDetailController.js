const centerDetailModel = require('../models/centerDetailModel');
const fs = require('fs').promises;

const centerDetailController = {
  getAll: async (req, res) => { 
    try { 
      const data = await centerDetailModel.getAll(); 
      res.json(data); 
    } catch(err){ 
      res.status(500).json({error: err.message}); 
    } 
  },
  
  getById: async (req, res) => { 
    try { 
      const data = await centerDetailModel.getById(req.params.id); 
      if(!data) return res.status(404).json({error: 'Not found'}); 
      res.json(data); 
    } catch(err){ 
      res.status(500).json({error: err.message}); 
    } 
  },
  
  create: async (req, res) => { 
    try { 
      const fields = { ...req.body };
      
      // Handle file uploads if present
      if (req.files) {
        if (req.files.logo && req.files.logo.length > 0) {
          const file = req.files.logo[0];
          const buffer = await fs.readFile(file.path);
          fields.logo = buffer;
          fields.logo_filename = file.originalname;
          fields.logo_mime = file.mimetype;
          fields.logo_size = file.size;
          await fs.unlink(file.path);
        }
        
        if (req.files.qr_code_service_url && req.files.qr_code_service_url.length > 0) {
          const file = req.files.qr_code_service_url[0];
          const buffer = await fs.readFile(file.path);
          fields.qr_code_service_url = buffer;
          fields.qr_code_service_url_filename = file.originalname;
          fields.qr_code_service_url_mime = file.mimetype;
          fields.qr_code_service_url_size = file.size;
          await fs.unlink(file.path);
        }
      }
      
      const data = await centerDetailModel.create(fields); 
      res.status(201).json(data); 
    } catch(err){ 
      res.status(500).json({error: "Error creating record in Center_Detail: " + err.message}); 
    } 
  },
  
  update: async (req, res) => { 
    try { 
      const fields = { ...req.body };
      
      // Handle file uploads if present
      if (req.files) {
        if (req.files.logo && req.files.logo.length > 0) {
          const file = req.files.logo[0];
          const buffer = await fs.readFile(file.path);
          fields.logo = buffer;
          fields.logo_filename = file.originalname;
          fields.logo_mime = file.mimetype;
          fields.logo_size = file.size;
          await fs.unlink(file.path);
        }
        
        if (req.files.qr_code_service_url && req.files.qr_code_service_url.length > 0) {
          const file = req.files.qr_code_service_url[0];
          const buffer = await fs.readFile(file.path);
          fields.qr_code_service_url = buffer;
          fields.qr_code_service_url_filename = file.originalname;
          fields.qr_code_service_url_mime = file.mimetype;
          fields.qr_code_service_url_size = file.size;
          await fs.unlink(file.path);
        }
      }
      
      const data = await centerDetailModel.update(req.params.id, fields); 
      res.json(data); 
    } catch(err){ 
      res.status(500).json({error: "Error updating record in Center_Detail: " + err.message}); 
    } 
  },
  
  delete: async (req, res) => { 
    try { 
      await centerDetailModel.delete(req.params.id); 
      res.json({message: 'Deleted successfully'}); 
    } catch(err){ 
      res.status(500).json({error: err.message}); 
    } 
  },

  viewLogo: async (req, res) => {
    try {
      const record = await centerDetailModel.getById(req.params.id);
      if (!record) return res.status(404).send("Record not found");
      if (!record.logo) return res.status(404).send("No logo found");
  
      const mimeType = record.logo_mime || "image/png";
      const filename = record.logo_filename || "logo";
  
      let buffer = record.logo;
      if (typeof buffer === "string") {
        if (buffer.startsWith("\\x")) {
          buffer = Buffer.from(buffer.slice(2), "hex");
        } else if (/^[A-Za-z0-9+/=]+$/.test(buffer)) {
          buffer = Buffer.from(buffer, "base64");
        } else {
          throw new Error("Unknown logo encoding");
        }
      }
  
      if (!buffer || !buffer.length) {
        return res.status(500).send("Logo buffer is empty or corrupted");
      }
  
      res.setHeader("Content-Type", mimeType);
      res.setHeader("Content-Disposition", `inline; filename="${filename}"`);
      res.setHeader("Content-Length", buffer.length);
  
      res.end(buffer, "binary");
    } catch (err) {
      console.error("Error viewing logo:", err);
      res.status(500).json({ error: "Error viewing logo: " + err.message });
    }
  },

  downloadLogo: async (req, res) => {
    try {
      const record = await centerDetailModel.getById(req.params.id);
      if (!record) return res.status(404).send("Record not found");
      if (!record.logo) return res.status(404).send("No logo found");
  
      const mimeType = record.logo_mime || "image/png";
      const filename = record.logo_filename || "logo";
  
      let buffer = record.logo;
  
      // ?? Decode correctly depending on type
      if (typeof buffer === "string") {
        if (buffer.startsWith("\\x")) {
          buffer = Buffer.from(buffer.slice(2), "hex"); // PostgreSQL default format
        } else if (/^[A-Za-z0-9+/=]+$/.test(buffer)) {
          buffer = Buffer.from(buffer, "base64");
        } else {
          throw new Error("Unknown logo encoding");
        }
      }
  
      if (!buffer || !buffer.length) {
        return res.status(500).send("Logo buffer is empty or corrupted");
      }
  
      // ? Proper download headers
      res.setHeader("Content-Type", mimeType);
      res.setHeader("Content-Disposition", `attachment; filename="${encodeURIComponent(filename)}"`);
      res.setHeader("Content-Length", buffer.length);
  
      // ? Send binary content
      res.end(buffer);
    } catch (err) {
      console.error("Error downloading logo:", err);
      res.status(500).json({ error: "Error downloading logo: " + err.message });
    }
  },

  viewQRCode: async (req, res) => {
    try {
      const record = await centerDetailModel.getById(req.params.id);
      if (!record) return res.status(404).send("Record not found");
      if (!record.qr_code_service_url) return res.status(404).send("No QR code found");
  
      const mimeType = record.qr_code_service_url_mime || "image/png";
      const filename = record.qr_code_service_url_filename || "qr_code";
  
      let buffer = record.qr_code_service_url;
      if (typeof buffer === "string") {
        if (buffer.startsWith("\\x")) {
          buffer = Buffer.from(buffer.slice(2), "hex");
        } else if (/^[A-Za-z0-9+/=]+$/.test(buffer)) {
          buffer = Buffer.from(buffer, "base64");
        } else {
          throw new Error("Unknown QR code encoding");
        }
      }
  
      if (!buffer || !buffer.length) {
        return res.status(500).send("QR code buffer is empty or corrupted");
      }
  
      res.setHeader("Content-Type", mimeType);
      res.setHeader("Content-Disposition", `inline; filename="${filename}"`);
      res.setHeader("Content-Length", buffer.length);
  
      res.end(buffer, "binary");
    } catch (err) {
      console.error("Error viewing QR code:", err);
      res.status(500).json({ error: "Error viewing QR code: " + err.message });
    }
  },

  downloadQRCode: async (req, res) => {
    try {
      const record = await centerDetailModel.getById(req.params.id);
      if (!record) return res.status(404).send("Record not found");
      if (!record.qr_code_service_url) return res.status(404).send("No QR code found");
  
      const mimeType = record.qr_code_service_url_mime || "image/png";
      const filename = record.qr_code_service_url_filename || "qr_code";
  
      let buffer = record.qr_code_service_url;
  
      // ?? Decode correctly depending on type
      if (typeof buffer === "string") {
        if (buffer.startsWith("\\x")) {
          buffer = Buffer.from(buffer.slice(2), "hex");
        } else if (/^[A-Za-z0-9+/=]+$/.test(buffer)) {
          buffer = Buffer.from(buffer, "base64");
        } else {
          throw new Error("Unknown QR code encoding");
        }
      }
  
      if (!buffer || !buffer.length) {
        return res.status(500).send("QR code buffer is empty or corrupted");
      }
  
      // ? Proper download headers
      res.setHeader("Content-Type", mimeType);
      res.setHeader("Content-Disposition", `attachment; filename="${encodeURIComponent(filename)}"`);
      res.setHeader("Content-Length", buffer.length);
  
      // ? Send binary content
      res.end(buffer);
    } catch (err) {
      console.error("Error downloading QR code:", err);
      res.status(500).json({ error: "Error downloading QR code: " + err.message });
    }
  }
};

module.exports = centerDetailController;
