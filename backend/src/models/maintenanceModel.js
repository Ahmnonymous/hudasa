const pool = require('../config/db');

const tableName = 'Maintenance';

const maintenanceModel = {
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
      throw new Error("Error fetching all records from Maintenance: " + err.message);
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
      throw new Error("Error fetching record by ID from Maintenance: " + err.message);
    }
  },

  getByCenterDetailId: async (centerDetailId, centerId = null, isMultiCenter = false) => {
    try {
      // PostgreSQL converts unquoted identifiers to lowercase
      // Try the new column name first (center_detail_id)
      let where = `center_detail_id = $1`;
      const params = [centerDetailId];
      
      if (centerId && !isMultiCenter) {
        where += ` AND center_id = $2`;
        params.push(centerId);
      }
      
      const query = `SELECT * FROM ${tableName} WHERE ${where} ORDER BY created_at DESC`;
      const res = await pool.query(query, params);
      return res.rows;
    } catch (err) {
      // If column doesn't exist, try the old column name (islamic_center_id)
      // This handles the case where the database hasn't been migrated yet
      if (err.message && err.message.includes('does not exist')) {
        try {
          let where = `islamic_center_id = $1`;
          const params = [centerDetailId];
          
          if (centerId && !isMultiCenter) {
            where += ` AND center_id = $2`;
            params.push(centerId);
          }
          
          const query = `SELECT * FROM ${tableName} WHERE ${where} ORDER BY created_at DESC`;
          const res = await pool.query(query, params);
          return res.rows;
        } catch (err2) {
          throw new Error("Column 'center_detail_id' or 'islamic_center_id' does not exist. Please update the database schema by running the migration script: backend/src/schema/migrate-maintenance-to-center-detail.sql");
        }
      }
      throw new Error("Error fetching records by Center Detail ID from Maintenance: " + err.message);
    }
  },

  create: async (fields) => {
    try {
      // Map center_detail_id to islamic_center_id if the new column doesn't exist
      const mappedFields = { ...fields };
      if (mappedFields.center_detail_id && !mappedFields.islamic_center_id) {
        // Try with new column name first
        const columns = Object.keys(mappedFields).join(', ');
        const values = Object.values(mappedFields);
        const placeholders = values.map((_, i) => `$${i + 1}`).join(', ');
        const query = `INSERT INTO ${tableName} (${columns}) VALUES (${placeholders}) RETURNING *`;
        try {
          const res = await pool.query(query, values);
          return res.rows[0];
        } catch (err) {
          // If column doesn't exist, try with old column name
          if (err.message && err.message.includes('does not exist') && err.message.includes('center_detail_id')) {
            mappedFields.islamic_center_id = mappedFields.center_detail_id;
            delete mappedFields.center_detail_id;
            const columns = Object.keys(mappedFields).join(', ');
            const values = Object.values(mappedFields);
            const placeholders = values.map((_, i) => `$${i + 1}`).join(', ');
            const query = `INSERT INTO ${tableName} (${columns}) VALUES (${placeholders}) RETURNING *`;
            const res = await pool.query(query, values);
            return res.rows[0];
          }
          throw err;
        }
      } else {
        const columns = Object.keys(mappedFields).join(', ');
        const values = Object.values(mappedFields);
        const placeholders = values.map((_, i) => `$${i + 1}`).join(', ');
        const query = `INSERT INTO ${tableName} (${columns}) VALUES (${placeholders}) RETURNING *`;
        const res = await pool.query(query, values);
        return res.rows[0];
      }
    } catch (err) {
      throw new Error("Error creating record in Maintenance: " + err.message);
    }
  },

  update: async (id, fields, centerId = null, isMultiCenter = false) => {
    try {
      // Map center_detail_id to islamic_center_id if the new column doesn't exist
      const mappedFields = { ...fields };
      if (mappedFields.center_detail_id && !mappedFields.islamic_center_id) {
        // Try with new column name first
        const setClauses = Object.keys(mappedFields).map((key, i) => `${key} = $${i + 1}`).join(', ');
        const values = Object.values(mappedFields);
        let where = `id = $${values.length + 1}`;
        const params = [...values, id];
        
        if (centerId && !isMultiCenter) {
          where += ` AND center_id = $${values.length + 2}`;
          params.push(centerId);
        }
        
        const query = `UPDATE ${tableName} SET ${setClauses} WHERE ${where} RETURNING *`;
        try {
          const res = await pool.query(query, params);
          if (res.rowCount === 0) return null;
          return res.rows[0];
        } catch (err) {
          // If column doesn't exist, try with old column name
          if (err.message && err.message.includes('does not exist') && err.message.includes('center_detail_id')) {
            mappedFields.islamic_center_id = mappedFields.center_detail_id;
            delete mappedFields.center_detail_id;
            const setClauses = Object.keys(mappedFields).map((key, i) => `${key} = $${i + 1}`).join(', ');
            const values = Object.values(mappedFields);
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
          }
          throw err;
        }
      } else {
        const setClauses = Object.keys(mappedFields).map((key, i) => `${key} = $${i + 1}`).join(', ');
        const values = Object.values(mappedFields);
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
      }
    } catch (err) {
      throw new Error("Error updating record in Maintenance: " + err.message);
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
      throw new Error("Error deleting record from Maintenance: " + err.message);
    }
  }
};

module.exports = maintenanceModel;

