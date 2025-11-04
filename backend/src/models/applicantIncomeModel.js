const pool = require('../config/db');

const tableName = 'Applicant_Income';

const applicantIncomeModel = {
  // ? getAll with tenant filtering via join to Financial_Assessment
  getAll: async (centerId = null, isMultiCenter = false) => {
    try {
      let query = `SELECT ai.* FROM ${tableName} ai 
                   INNER JOIN Financial_Assessment fa ON ai.Financial_Assessment_ID = fa.id`;
      const params = [];
      
      // ? Apply tenant filtering
      if (centerId && !isMultiCenter) {
        query += ` WHERE fa.center_id = $1`;
        params.push(centerId);
      }
      
      const res = await pool.query(query, params);
      return res.rows;
    } catch (err) {
      throw new Error("Error fetching all records from Applicant_Income: " + err.message);
    }
  },

  // ? getById with tenant filtering via join
  getById: async (id, centerId = null, isMultiCenter = false) => {
    try {
      let query = `SELECT ai.* FROM ${tableName} ai 
                   INNER JOIN Financial_Assessment fa ON ai.Financial_Assessment_ID = fa.id
                   WHERE ai."id" = $1`;
      const params = [id];
      
      // ? Apply tenant filtering
      if (centerId && !isMultiCenter) {
        query += ` AND fa.center_id = $2`;
        params.push(centerId);
      }
      
      const res = await pool.query(query, params);
      if (!res.rows[0]) return null;

      return res.rows[0];
    } catch (err) {
      throw new Error("Error fetching record by ID from Applicant_Income: " + err.message);
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
      throw new Error("Error creating record in Applicant_Income: " + err.message);
    }
  },

  // ? update with tenant filtering via join
  update: async (id, fields, centerId = null, isMultiCenter = false) => {
    try {
      const setClauses = Object.keys(fields).map((key, i) => `"${key}" = $${i + 1}`).join(', ');
      const values = Object.values(fields);
      let query = `UPDATE ${tableName} SET ${setClauses} WHERE "id" = $${values.length + 1}`;
      const params = [...values, id];
      
      // ? Apply tenant filtering via EXISTS subquery
      if (centerId && !isMultiCenter) {
        query += ` AND EXISTS (SELECT 1 FROM Financial_Assessment fa WHERE fa.id = ${tableName}."Financial_Assessment_ID" AND fa.center_id = $${values.length + 2})`;
        params.push(centerId);
      }
      
      query += ` RETURNING *`;
      const res = await pool.query(query, params);
      if (res.rowCount === 0) return null;
      return res.rows[0];
    } catch (err) {
      throw new Error("Error updating record in Applicant_Income: " + err.message);
    }
  },

  // ? delete with tenant filtering via join
  delete: async (id, centerId = null, isMultiCenter = false) => {
    try {
      let query = `DELETE FROM ${tableName} WHERE "id" = $1`;
      const params = [id];
      
      // ? Apply tenant filtering via EXISTS subquery
      if (centerId && !isMultiCenter) {
        query += ` AND EXISTS (SELECT 1 FROM Financial_Assessment fa WHERE fa.id = ${tableName}."Financial_Assessment_ID" AND fa.center_id = $2)`;
        params.push(centerId);
      }
      
      query += ` RETURNING *`;
      const res = await pool.query(query, params);
      if (res.rowCount === 0) return null;
      return res.rows[0];
    } catch (err) {
      throw new Error("Error deleting record from Applicant_Income: " + err.message);
    }
  }
};

module.exports = applicantIncomeModel;
