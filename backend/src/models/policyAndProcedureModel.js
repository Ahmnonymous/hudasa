const pool = require('../config/db');

const tableName = 'Policy_and_Procedure';

const policyAndProcedureModel = {
  getAll: async (centerId = null, isMultiCenter = false) => {
    try {
      // Global table (no center_id). Ignore center filtering entirely.
      const query = `SELECT * FROM ${tableName}`;
      const res = await pool.query(query);
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
      throw new Error("Error fetching all records from Policy_and_Procedure: " + err.message);
    }
  },

  getById: async (id, centerId = null, isMultiCenter = false) => {
    try {
      // Global table (no center_id). Ignore center filtering entirely.
      const query = `SELECT * FROM ${tableName} WHERE id = $1`;
      const res = await pool.query(query, [id]);
      if (!res.rows[0]) return null;
      return res.rows[0];
    } catch (err) {
      throw new Error("Error fetching record by ID from Policy_and_Procedure: " + err.message);
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
      throw new Error("Error creating record in Policy_and_Procedure: " + err.message);
    }
  },

  update: async (id, fields, centerId = null, isMultiCenter = false) => {
    try {
      const setClauses = Object.keys(fields).map((key, i) => `${key} = $${i + 1}`).join(', ');
      const values = Object.values(fields);
      const where = `id = $${values.length + 1}`;
      const params = [...values, id];
      const query = `UPDATE ${tableName} SET ${setClauses} WHERE ${where} RETURNING *`;
      const res = await pool.query(query, params);
      if (res.rowCount === 0) return null;
      return res.rows[0];
    } catch (err) {
      throw new Error("Error updating record in Policy_and_Procedure: " + err.message);
    }
  },

  delete: async (id, centerId = null, isMultiCenter = false) => {
    try {
      const query = `DELETE FROM ${tableName} WHERE id = $1 RETURNING *`;
      const res = await pool.query(query, [id]);
      if (res.rowCount === 0) return null;
      return res.rows[0];
    } catch (err) {
      throw new Error("Error deleting record from Policy_and_Procedure: " + err.message);
    }
  }
};

module.exports = policyAndProcedureModel;
