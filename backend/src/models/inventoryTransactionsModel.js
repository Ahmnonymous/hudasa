const pool = require('../config/db');

const tableName = 'Inventory_Transactions';

const inventoryTransactionsModel = {
  // ? getAll with tenant filtering (can filter by item_id OR center_id)
  getAll: async (itemId = null, centerId = null, isMultiCenter = false) => {
    try {
      let query = `SELECT * FROM ${tableName}`;
      let params = [];
      let paramIndex = 1;

      const conditions = [];
      
      if (itemId) {
        conditions.push(`item_id = $${paramIndex}`);
        params.push(itemId);
        paramIndex++;
      }
      
      // ? Apply tenant filtering
      if (centerId && !isMultiCenter) {
        conditions.push(`center_id = $${paramIndex}`);
        params.push(centerId);
      }

      if (conditions.length > 0) {
        query += ` WHERE ${conditions.join(' AND ')}`;
      }

      query += ` ORDER BY transaction_date DESC`;

      const res = await pool.query(query, params);
      return res.rows;
    } catch (err) {
      throw new Error("Error fetching all records from Inventory_Transactions: " + err.message);
    }
  },

  // ? getById with tenant filtering
  getById: async (id, centerId = null, isMultiCenter = false) => {
    try {
      let where = `"id" = $1`;
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
      throw new Error("Error fetching record by ID from Inventory_Transactions: " + err.message);
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
      throw new Error("Error creating record in Inventory_Transactions: " + err.message);
    }
  },

  // ? update with tenant filtering
  update: async (id, fields, centerId = null, isMultiCenter = false) => {
    try {
      const setClauses = Object.keys(fields).map((key, i) => `"${key}" = $${i + 1}`).join(', ');
      const values = Object.values(fields);
      let where = `"id" = $${values.length + 1}`;
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
      throw new Error("Error updating record in Inventory_Transactions: " + err.message);
    }
  },

  // ? delete with tenant filtering
  delete: async (id, centerId = null, isMultiCenter = false) => {
    try {
      let where = `"id" = $1`;
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
      throw new Error("Error deleting record from Inventory_Transactions: " + err.message);
    }
  }
};

module.exports = inventoryTransactionsModel;
