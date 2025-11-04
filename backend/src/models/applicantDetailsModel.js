const pool = require('../config/db');

const tableName = 'Applicant_Details';

const applicantDetailsModel = {
  // ? getAll with tenant filtering: App Admin (centerId=null) sees all, others see only their center
  getAll: async (centerId = null, isSuperAdmin = false) => {
    try {
      let query = `SELECT * FROM ${tableName}`;
      const params = [];
      
      // ? Apply tenant filtering: Only App Admin (isSuperAdmin=true) bypasses filtering
      // HQ and other roles are filtered by center_id
      if (centerId !== null && !isSuperAdmin) {
        query += ` WHERE center_id = $1`;
        // ? Ensure type consistency: convert to integer for proper comparison
        params.push(parseInt(centerId));
      }
      
      const res = await pool.query(query, params);
      res.rows = res.rows.map(r => { 
        if (r.signature && r.signature_filename) {
          r.signature = 'exists';
        } else if (r.signature) {
          r.signature = r.signature.toString('base64');
        }
        return r; 
      });
      return res.rows;
    } catch (err) {
      throw new Error("Error fetching all records from Applicant_Details: " + err.message);
    }
  },

  // ? getById with tenant filtering
  getById: async (id, centerId = null, isSuperAdmin = false) => {
    try {
      let where = `id = $1`;
      const params = [id];
      
      // ? Apply tenant filtering: Only App Admin (isSuperAdmin=true) bypasses filtering
      // HQ and other roles are filtered by center_id
      if (centerId !== null && !isSuperAdmin) {
        where += ` AND center_id = $2`;
        // ? Ensure type consistency: convert to integer for proper comparison
        params.push(parseInt(centerId));
      }
      
      const query = `SELECT * FROM ${tableName} WHERE ${where}`;
      const res = await pool.query(query, params);
      if (!res.rows[0]) return null;
      return res.rows[0];
    } catch (err) {
      throw new Error("Error fetching record by ID from Applicant_Details: " + err.message);
    }
  },

  create: async (fields) => {
    try {
      const columns = Object.keys(fields).join(', ');
      const values = Object.values(fields);
      const placeholders = values.map((_, i) => `$${i + 1}`).join(', ');
      const query = `INSERT INTO ${tableName} (${columns}) VALUES (${placeholders}) RETURNING *`;
      const res = await pool.query(query, values);
      return res.rows[0];
    } catch (err) {
      throw new Error("Error creating record in Applicant_Details: " + err.message);
    }
  },

  // ? update with tenant filtering
  update: async (id, fields, centerId = null, isSuperAdmin = false) => {
    try {
      const setClauses = Object.keys(fields).map((key, i) => `${key} = $${i + 1}`).join(', ');
      const values = Object.values(fields);
      let where = `id = $${values.length + 1}`;
      const params = [...values, id];
      
      // ? Apply tenant filtering: Only App Admin (isSuperAdmin=true) bypasses filtering
      // HQ and other roles are filtered by center_id
      if (centerId !== null && !isSuperAdmin) {
        where += ` AND center_id = $${values.length + 2}`;
        // ? Ensure type consistency: convert to integer for proper comparison
        params.push(parseInt(centerId));
      }
      
      const query = `UPDATE ${tableName} SET ${setClauses} WHERE ${where} RETURNING *`;
      const res = await pool.query(query, params);
      if (res.rowCount === 0) return null;
      return res.rows[0];
    } catch (err) {
      throw new Error("Error updating record in Applicant_Details: " + err.message);
    }
  },

  // ? delete with tenant filtering
  delete: async (id, centerId = null, isSuperAdmin = false) => {
    try {
      let where = `id = $1`;
      const params = [id];
      
      // ? Apply tenant filtering: Only App Admin (isSuperAdmin=true) bypasses filtering
      // HQ and other roles are filtered by center_id
      if (centerId !== null && !isSuperAdmin) {
        where += ` AND center_id = $2`;
        // ? Ensure type consistency: convert to integer for proper comparison
        params.push(parseInt(centerId));
      }
      
      const query = `DELETE FROM ${tableName} WHERE ${where} RETURNING *`;
      const res = await pool.query(query, params);
      if (res.rowCount === 0) return null;
      return res.rows[0];
    } catch (err) {
      throw new Error("Error deleting record from Applicant_Details: " + err.message);
    }
  }
};

module.exports = applicantDetailsModel;
