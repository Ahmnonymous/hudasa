const pool = require('../config/db');

const tableName = 'Course';

const courseModel = {
  getAll: async () => {
    try {
        const res = await pool.query('SELECT * FROM "' + tableName + '"');

        return res.rows;
    } catch (err) {
        throw new Error("Error fetching all records from Course: " + err.message);
    }
  },

  getById: async (id) => {
    try {
        const res = await pool.query('SELECT * FROM "' + tableName + '" WHERE ""ID"" = ', [id]);
        if (!res.rows[0]) return null;

        return res.rows[0];
    } catch (err) {
        throw new Error("Error fetching record by ID from Course: " + err.message);
    }
  },

  create: async (fields) => {
    try {
        const columns = Object.keys(fields).map(k => '"' + k + '"').join(', ');
        const values = Object.values(fields);
        const placeholders = values.map((_, i) => '$' + (i+1)).join(', ');
        const query = 'INSERT INTO "' + tableName + '" (' + columns + ') VALUES (' + placeholders + ') RETURNING *';
        const res = await pool.query(query, values);
        return res.rows[0];
    } catch (err) {
        throw new Error("Error creating record in Course: " + err.message);
    }
  },

  update: async (id, fields) => {
    try {
        const setString = Object.keys(fields).map((key,i) => '"' + key + '" = $' + (i+1)).join(', ');
        const values = Object.values(fields);
        const query = 'UPDATE "' + tableName + '" SET ' + setString + ' WHERE ""ID"" = $' + (values.length +1) + ' RETURNING *';
        const res = await pool.query(query, [...values, id]);
        return res.rows[0];
    } catch (err) {
        throw new Error("Error updating record in Course: " + err.message);
    }
  },

  delete: async (id) => {
    try {
        const query = 'DELETE FROM "' + tableName + '" WHERE ""ID"" =  RETURNING *';
        const res = await pool.query(query, [id]);
        return res.rows[0];
    } catch (err) {
        throw new Error("Error deleting record from Course: " + err.message);
    }
  }
};

module.exports = courseModel;
