const pool = require('../config/db');

const tableName = 'Inventory_Items';

const inventoryItemsModel = {
  getAll: async (centerId, isSuperAdmin) => {
    try {
      let query = `SELECT * FROM ${tableName}`;
      let params = [];

      // ? Apply tenant filter unless SuperAdmin
      if (!isSuperAdmin && centerId) {
        query += ` WHERE "center_id" = $1`;
        params = [centerId];
      }

      const res = await pool.query(query, params);
      return res.rows;
    } catch (err) {
      throw new Error("Error fetching all records from Inventory_Items: " + err.message);
    }
  },

  getById: async (id, centerId, isSuperAdmin) => {
    try {
      let query = `SELECT * FROM ${tableName} WHERE "id" = $1`;
      let params = [id];

      // ? Apply tenant filter unless SuperAdmin
      if (!isSuperAdmin && centerId) {
        query += ` AND "center_id" = $2`;
        params.push(centerId);
      }

      const res = await pool.query(query, params);
      if (!res.rows[0]) return null;
      return res.rows[0];
    } catch (err) {
      throw new Error("Error fetching record by ID from Inventory_Items: " + err.message);
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
      throw new Error("Error creating record in Inventory_Items: " + err.message);
    }
  },

  update: async (id, fields, centerId, isSuperAdmin) => {
    try {
      const setClauses = Object.keys(fields).map((key, i) => `"${key}" = $${i + 1}`).join(', ');
      const values = Object.values(fields);
      let paramIndex = values.length + 1;
      
      let query = `UPDATE ${tableName} SET ${setClauses} WHERE "id" = $${paramIndex}`;
      values.push(id);

      // ? Apply tenant filter unless SuperAdmin
      if (!isSuperAdmin && centerId) {
        paramIndex++;
        query += ` AND "center_id" = $${paramIndex}`;
        values.push(centerId);
      }

      query += ` RETURNING *`;
      const res = await pool.query(query, values);
      if (res.rowCount === 0) return null;
      return res.rows[0];
    } catch (err) {
      throw new Error("Error updating record in Inventory_Items: " + err.message);
    }
  },

  delete: async (id, centerId, isSuperAdmin) => {
    try {
      let query = `DELETE FROM ${tableName} WHERE "id" = $1`;
      let params = [id];

      // ? Apply tenant filter unless SuperAdmin
      if (!isSuperAdmin && centerId) {
        query += ` AND "center_id" = $2`;
        params.push(centerId);
      }

      query += ` RETURNING *`;
      const res = await pool.query(query, params);
      if (res.rowCount === 0) return null;
      return res.rows[0];
    } catch (err) {
      throw new Error("Error deleting record from Inventory_Items: " + err.message);
    }
  }
};

module.exports = inventoryItemsModel;
