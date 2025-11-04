const pool = require('../config/db');

const tableName = 'Conversation_Participants';

const conversationParticipantsModel = {
  // ? getAll with tenant filtering: App Admin (centerId=null) sees all, others see only their center
  getAll: async (centerId = null) => {
    try {
      // ? Standardized pattern: WHERE ($1::int IS NULL OR center_id = $1)
      const query = `SELECT * FROM ${tableName} WHERE ($1::int IS NULL OR center_id = $1)`;
      const params = [centerId];
      const res = await pool.query(query, params);
      return res.rows;
    } catch (err) {
      throw new Error("Error fetching all records from Conversation_Participants: " + err.message);
    }
  },

  // ? getById with tenant filtering
  getById: async (id, centerId = null) => {
    try {
      // ? Standardized pattern: WHERE id = $1 AND ($2::int IS NULL OR center_id = $2)
      const query = `SELECT * FROM ${tableName} WHERE "id" = $1 AND ($2::int IS NULL OR center_id = $2)`;
      const params = [id, centerId];
      const res = await pool.query(query, params);
      if (!res.rows[0]) return null;
      return res.rows[0];
    } catch (err) {
      throw new Error("Error fetching record by ID from Conversation_Participants: " + err.message);
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
      throw new Error("Error creating record in Conversation_Participants: " + err.message);
    }
  },

  // ? update with tenant filtering
  update: async (id, fields, centerId = null) => {
    try {
      const setClauses = Object.keys(fields).map((key, i) => `"${key}" = $${i + 1}`).join(', ');
      const values = Object.values(fields);
      const paramIndex = values.length + 1;
      // ? Standardized pattern: WHERE id = $X AND ($Y::int IS NULL OR center_id = $Y)
      const query = `UPDATE ${tableName} SET ${setClauses} WHERE "id" = $${paramIndex} AND ($${paramIndex + 1}::int IS NULL OR center_id = $${paramIndex + 1}) RETURNING *`;
      const params = [...values, id, centerId];
      const res = await pool.query(query, params);
      if (res.rowCount === 0) return null;
      return res.rows[0];
    } catch (err) {
      throw new Error("Error updating record in Conversation_Participants: " + err.message);
    }
  },

  // ? delete with tenant filtering
  delete: async (id, centerId = null) => {
    try {
      // ? Standardized pattern: WHERE id = $1 AND ($2::int IS NULL OR center_id = $2)
      const query = `DELETE FROM ${tableName} WHERE "id" = $1 AND ($2::int IS NULL OR center_id = $2) RETURNING *`;
      const params = [id, centerId];
      const res = await pool.query(query, params);
      if (res.rowCount === 0) return null;
      return res.rows[0];
    } catch (err) {
      throw new Error("Error deleting record from Conversation_Participants: " + err.message);
    }
  }
};

module.exports = conversationParticipantsModel;
