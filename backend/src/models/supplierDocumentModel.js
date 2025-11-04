const pool = require('../config/db');

const tableName = 'supplier_document';

const supplierDocumentModel = {
  // ? getAll with tenant filtering (can filter by supplierId OR centerId)
  getAll: async (centerId = null, supplierId = null, isMultiCenter = false) => {
    try {
      let query = `SELECT * FROM ${tableName}`;
      const params = [];
      let paramCount = 0;
      
      const conditions = [];
      
      // ? Apply tenant filtering
      if (centerId && !isMultiCenter) {
        paramCount++;
        conditions.push(`center_id = $${paramCount}`);
        params.push(centerId);
      }
      
      if (supplierId) {
        paramCount++;
        conditions.push(`supplier_id = $${paramCount}`);
        params.push(supplierId);
      }
      
      if (conditions.length > 0) {
        query += ` WHERE ${conditions.join(' AND ')}`;
      }
      
      const res = await pool.query(query, params);
      res.rows = res.rows.map(r => { 
        if (r.file && r.file_filename) {
          r.file = 'exists';
        } else if (r.file) {
          r.file = r.file.toString('base64');
        }
        return r; 
      });
      return res.rows;
    } catch (err) {
      throw new Error("Error fetching all records from Supplier_Document: " + err.message);
    }
  },

  // ? getById with tenant filtering
  getById: async (id, centerId = null, isMultiCenter = false) => {
    try {
      let where = `id = $1`;
      const params = [id];
      
      // ? Apply tenant filtering
      if (centerId && !isMultiCenter) {
        where += ` AND center_id = $2`;
        params.push(centerId);
      }
      
      const query = `SELECT * FROM ${tableName} WHERE ${where}`;
      
      const res = await pool.query(query, params);
      if (!res.rows[0]) return null;
      return res.rows[0];
    } catch (err) {
      throw new Error("Error fetching record by ID from Supplier_Document: " + err.message);
    }
  },

  create: async (fields, centerId) => {
    try {
      // Add center_id if provided
      if (centerId) {
        fields.center_id = centerId;
      }
      
      const columns = Object.keys(fields).join(', ');
      const values = Object.values(fields);
      const placeholders = values.map((_, i) => `$${i + 1}`).join(', ');
      const query = `INSERT INTO ${tableName} (${columns}) VALUES (${placeholders}) RETURNING *`;
      const res = await pool.query(query, values);
      return res.rows[0];
    } catch (err) {
      throw new Error("Error creating record in Supplier_Document: " + err.message);
    }
  },

  // ? update with tenant filtering
  update: async (id, fields, centerId = null, isMultiCenter = false) => {
    try {
      const setClauses = Object.keys(fields).map((key, i) => `${key} = $${i + 1}`).join(', ');
      const values = Object.values(fields);
      let where = `id = $${values.length + 1}`;
      const params = [...values, id];
      
      // ? Apply tenant filtering
      if (centerId && !isMultiCenter) {
        where += ` AND center_id = $${values.length + 2}`;
        params.push(centerId);
      }
      
      const query = `UPDATE ${tableName} SET ${setClauses} WHERE ${where} RETURNING *`;
      const res = await pool.query(query, params);
      if (res.rowCount === 0) return null;
      return res.rows[0];
    } catch (err) {
      throw new Error("Error updating record in Supplier_Document: " + err.message);
    }
  },

  // ? delete with tenant filtering
  delete: async (id, centerId = null, isMultiCenter = false) => {
    try {
      let where = `id = $1`;
      const params = [id];
      
      // ? Apply tenant filtering
      if (centerId && !isMultiCenter) {
        where += ` AND center_id = $2`;
        params.push(centerId);
      }
      
      const query = `DELETE FROM ${tableName} WHERE ${where} RETURNING *`;
      const res = await pool.query(query, params);
      if (res.rowCount === 0) return null;
      return res.rows[0];
    } catch (err) {
      throw new Error("Error deleting record from Supplier_Document: " + err.message);
    }
  }
};

module.exports = supplierDocumentModel;
