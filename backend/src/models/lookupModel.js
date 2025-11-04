const pool = require('../config/db');

const lookupModel = {
  getAll: async (tableName, orderByName = false) => {
    const query = `SELECT * FROM ${tableName}${orderByName ? ' ORDER BY Name' : ''}`;
    const res = await pool.query(query);
    return res.rows;
  },

  getById: async (tableName, id) => {
    const query = `SELECT * FROM ${tableName} WHERE ID = $1`;
    const res = await pool.query(query, [id]);
    return res.rows[0];
  },

  create: async (tableName, fields) => {
    const columns = Object.keys(fields).join(', ');
    const values = Object.values(fields);
    const placeholders = values.map((_, i) => `$${i + 1}`).join(', ');
    const query = `INSERT INTO ${tableName} (${columns}) VALUES (${placeholders}) RETURNING *`;
    const res = await pool.query(query, values);
    return res.rows[0];
  },

  update: async (tableName, id, fields) => {
    const setString = Object.keys(fields)
      .map((key, i) => `${key} = $${i + 1}`)
      .join(', ');
    const values = Object.values(fields);
    const query = `UPDATE ${tableName} SET ${setString} WHERE ID = $${values.length + 1} RETURNING *`;
    const res = await pool.query(query, [...values, id]);
    return res.rows[0];
  },

  delete: async (tableName, id) => {
    const query = `DELETE FROM ${tableName} WHERE ID = $1`;
    await pool.query(query, [id]);
  }
};

module.exports = lookupModel;
