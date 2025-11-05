const pool = require('../config/db');

const tableName = 'Suburb_Concerns';

const suburbConcernsModel = {
  getAll: async (centerId = null, isMultiCenter = false) => {
    try {
      let query = `SELECT * FROM ${tableName}`;
      const params = [];
      
      if (centerId && !isMultiCenter) {
        query += ` WHERE center_id = $1`;
        params.push(centerId);
      }
      
      query += ` ORDER BY created_at DESC`;
      
      const res = await pool.query(query, params);
      return res.rows;
    } catch (err) {
      throw new Error("Error fetching all records from Suburb_Concerns: " + err.message);
    }
  },

  getById: async (id, centerId = null, isMultiCenter = false) => {
    try {
      let where = `id = $1`;
      const params = [id];
      
      if (centerId && !isMultiCenter) {
        where += ` AND center_id = $2`;
        params.push(centerId);
      }
      
      const query = `SELECT * FROM ${tableName} WHERE ${where}`;
      const res = await pool.query(query, params);
      if (!res.rows[0]) return null;
      return res.rows[0];
    } catch (err) {
      throw new Error("Error fetching record by ID from Suburb_Concerns: " + err.message);
    }
  },

  getBySuburbId: async (suburbId, centerId = null, isMultiCenter = false) => {
    try {
      let where = `suburb_id = $1`;
      const params = [suburbId];
      
      if (centerId && !isMultiCenter) {
        where += ` AND center_id = $2`;
        params.push(centerId);
      }
      
      const query = `SELECT * FROM ${tableName} WHERE ${where} ORDER BY created_at DESC`;
      const res = await pool.query(query, params);
      return res.rows;
    } catch (err) {
      throw new Error("Error fetching records by Suburb ID from Suburb_Concerns: " + err.message);
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
      throw new Error("Error creating record in Suburb_Concerns: " + err.message);
    }
  },

  update: async (id, fields, centerId = null, isMultiCenter = false) => {
    try {
      const setClauses = Object.keys(fields).map((key, i) => `${key} = $${i + 1}`).join(', ');
      const values = Object.values(fields);
      let where = `id = $${values.length + 1}`;
      const params = [...values, id];
      
      if (centerId && !isMultiCenter) {
        where += ` AND center_id = $${values.length + 2}`;
        params.push(centerId);
      }
      
      const query = `UPDATE ${tableName} SET ${setClauses} WHERE ${where} RETURNING *`;
      const res = await pool.query(query, params);
      if (res.rowCount === 0) return null;
      return res.rows[0];
    } catch (err) {
      throw new Error("Error updating record in Suburb_Concerns: " + err.message);
    }
  },

  delete: async (id, centerId = null, isMultiCenter = false) => {
    try {
      let where = `id = $1`;
      const params = [id];
      
      if (centerId && !isMultiCenter) {
        where += ` AND center_id = $2`;
        params.push(centerId);
      }
      
      const query = `DELETE FROM ${tableName} WHERE ${where} RETURNING *`;
      const res = await pool.query(query, params);
      if (res.rowCount === 0) return null;
      return res.rows[0];
    } catch (err) {
      throw new Error("Error deleting record from Suburb_Concerns: " + err.message);
    }
  }
};

module.exports = suburbConcernsModel;

