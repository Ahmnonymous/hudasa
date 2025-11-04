const pool = require('../config/db');

const tableName = 'Personal_Files';

const personalFilesModel = {
  getAll: async (centerId = null) => {
    try {
      // ? Standardized pattern: WHERE ($1::int IS NULL OR center_id = $1)
      const query = `SELECT * FROM ${tableName} WHERE ($1::int IS NULL OR center_id = $1)`;
      const params = [centerId];
      
      // ?? DEBUG: Log SQL params
      console.log(`[DEBUG] PersonalFilesModel.getAll - SQL params: centerId=${centerId} (type: ${typeof centerId})`);
      
      const res = await pool.query(query, params);
      console.log(`[DEBUG] PersonalFilesModel.getAll - SQL success: ${res.rows.length} rows returned`);
      
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
      console.error(`[ERROR] PersonalFilesModel.getAll - SQL error: ${err.message}`, err);
      throw new Error("Error fetching all records from Personal_Files: " + err.message);
    }
  },

  getById: async (id, centerId = null) => {
    try {
      // ? Standardized pattern: WHERE id = $1 AND ($2::int IS NULL OR center_id = $2)
      const query = `SELECT * FROM ${tableName} WHERE id = $1 AND ($2::int IS NULL OR center_id = $2)`;
      const params = [id, centerId];
      const res = await pool.query(query, params);
      if (!res.rows[0]) return null;
      return res.rows[0];
    } catch (err) {
      throw new Error("Error fetching record by ID from Personal_Files: " + err.message);
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
      throw new Error("Error creating record in Personal_Files: " + err.message);
    }
  },

  update: async (id, fields, centerId = null) => {
    try {
      const setClauses = Object.keys(fields).map((key, i) => `${key} = $${i + 1}`).join(', ');
      const values = Object.values(fields);
      const paramIndex = values.length + 1;
      // ? Standardized pattern: WHERE id = $X AND ($Y::int IS NULL OR center_id = $Y)
      const query = `UPDATE ${tableName} SET ${setClauses} WHERE id = $${paramIndex} AND ($${paramIndex + 1}::int IS NULL OR center_id = $${paramIndex + 1}) RETURNING *`;
      const params = [...values, id, centerId];
      const res = await pool.query(query, params);
      if (res.rowCount === 0) return null;
      return res.rows[0];
    } catch (err) {
      throw new Error("Error updating record in Personal_Files: " + err.message);
    }
  },

  delete: async (id, centerId = null) => {
    try {
      // ? Standardized pattern: WHERE id = $1 AND ($2::int IS NULL OR center_id = $2)
      const query = `DELETE FROM ${tableName} WHERE id = $1 AND ($2::int IS NULL OR center_id = $2) RETURNING *`;
      const params = [id, centerId];
      const res = await pool.query(query, params);
      if (res.rowCount === 0) return null;
      return res.rows[0];
    } catch (err) {
      throw new Error("Error deleting record from Personal_Files: " + err.message);
    }
  }
};

module.exports = personalFilesModel;
