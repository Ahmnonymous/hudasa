const pool = require('../config/db');

const tableName = 'Islamic_Results';

const islamicResultsModel = {
  // ? getAll with tenant filtering: App Admin/HQ see all, others see only their center
  getAll: async (centerId = null, isMultiCenter = false) => {
    try {
      let query = `SELECT * FROM ${tableName}`;
      const params = [];
      
      // ? Apply tenant filtering
      if (centerId && !isMultiCenter) {
        query += ` WHERE center_id = $1`;
        params.push(centerId);
      }
      
      query += ` ORDER BY created_on DESC`;
      
      const res = await pool.query(query, params);
      res.rows = res.rows.map(r => { 
        if (r.report_upload && r.report_upload_filename) {
          r.report_upload = 'exists';
        } else if (r.report_upload) {
          r.report_upload = r.report_upload.toString('base64');
        }
        return r; 
      });
      return res.rows;
    } catch (err) {
      throw new Error("Error fetching all records from Islamic_Results: " + err.message);
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
      
      const row = res.rows[0];
      if (row.report_upload && row.report_upload_filename) {
        row.report_upload = 'exists';
      } else if (row.report_upload) {
        row.report_upload = row.report_upload.toString('base64');
      }
      return row;
    } catch (err) {
      throw new Error("Error fetching record by ID from Islamic_Results: " + err.message);
    }
  },

  // ? getByMadressahAppId - Get Islamic results for a specific madressah application
  getByMadressahAppId: async (madressahAppId, centerId = null, isMultiCenter = false) => {
    try {
      let where = `madressah_app_id = $1`;
      const params = [madressahAppId];
      
      // ? Apply tenant filtering
      if (centerId && !isMultiCenter) {
        where += ` AND center_id = $2`;
        params.push(centerId);
      }
      
      const query = `SELECT * FROM ${tableName} WHERE ${where} ORDER BY term, grade, created_on DESC`;
      const res = await pool.query(query, params);
      res.rows = res.rows.map(r => { 
        if (r.report_upload && r.report_upload_filename) {
          r.report_upload = 'exists';
        } else if (r.report_upload) {
          r.report_upload = r.report_upload.toString('base64');
        }
        return r; 
      });
      return res.rows;
    } catch (err) {
      throw new Error("Error fetching records by madressah app ID from Islamic_Results: " + err.message);
    }
  },

  create: async (fields) => {
    try {
      const columns = Object.keys(fields).map(k => `"${k}"`).join(', ');
      const values = Object.values(fields);
      const placeholders = values.map((_, i) => `$${i + 1}`).join(', ');
      const query = `INSERT INTO ${tableName} (${columns}) VALUES (${placeholders}) RETURNING *`;
      const res = await pool.query(query, values);
      return res.rows[0];
    } catch (err) {
      throw new Error("Error creating record in Islamic_Results: " + err.message);
    }
  },

  // ? update with tenant filtering
  update: async (id, fields, centerId = null, isMultiCenter = false) => {
    try {
      const setClauses = Object.keys(fields).map((key, i) => `"${key}" = $${i + 1}`).join(', ');
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
      throw new Error("Error updating record in Islamic_Results: " + err.message);
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
      throw new Error("Error deleting record from Islamic_Results: " + err.message);
    }
  }
};

module.exports = islamicResultsModel;

