const pool = require('../config/db');

const tableName = 'Employee';

const employeeModel = {
  // ? getAll with tenant filtering: App Admin (centerId=null) sees all, others see only their center
  // ? Org Admin (allowedUserTypes=[3,4,5]) only sees employees with user_type IN (3, 4, 5)
  getAll: async (centerId = null, allowedUserTypes = null) => {
    try {
      // Note: Employee table column is Center_ID (unquoted), so PostgreSQL converts to lowercase center_id
      // SELECT * will return center_id (lowercase)
      let query = `SELECT * FROM ${tableName} WHERE 1=1`;
      const params = [];
      let paramIndex = 1;
      
      // ? Center filtering: use center_id (lowercase) as PostgreSQL converts unquoted identifiers
      // - App Admin: centerId = null ? Shows all records
      // - Other roles: centerId = user.center_id ? Shows only their center
      if (centerId !== null && centerId !== undefined) {
        query += ` AND center_id = $${paramIndex}`;
        params.push(centerId);
        paramIndex++;
      } else {
        // For App Admin (centerId = null), no center filter is applied
      }
      
      // ? User type filtering for Org Admin: only show user_type IN (3, 4, 5)
      // Excludes App Admin (1) and HQ (2)
      if (allowedUserTypes && Array.isArray(allowedUserTypes) && allowedUserTypes.length > 0) {
        query += ` AND user_type = ANY($${paramIndex}::int[])`;
        params.push(allowedUserTypes);
        paramIndex++;
        console.log(`[DEBUG] EmployeeModel.getAll - User type filter: ${allowedUserTypes.join(', ')}`);
      }
      
      // ?? DEBUG: Log SQL params
      console.log(`[DEBUG] EmployeeModel.getAll - SQL params: centerId=${centerId}, allowedUserTypes=${allowedUserTypes ? allowedUserTypes.join(',') : 'null'}`);
      
      const res = await pool.query(query, params);
      console.log(`[DEBUG] EmployeeModel.getAll - SQL success: ${res.rows.length} rows returned`);
      return res.rows;
    } catch (err) {
      console.error(`[ERROR] EmployeeModel.getAll - SQL error: ${err.message}`, err);
      throw new Error("Error fetching all records from Employee: " + err.message);
    }
  },

  // ? getById with tenant filtering
  getById: async (id, centerId = null) => {
    try {
      // ? Standardized pattern: WHERE id = $1 AND ($2::int IS NULL OR center_id = $2)
      // Note: Employee table uses lowercase "id" (PostgreSQL converts unquoted identifiers to lowercase)
      // ? Cast ID to integer explicitly for type safety
      const query = `SELECT * FROM ${tableName} WHERE id = $1::int AND ($2::int IS NULL OR center_id = $2)`;
      const params = [id, centerId];
      
      // ?? DEBUG: Log SQL params
      console.log(`[DEBUG] EmployeeModel.getById - SQL params: id=${id} (type: ${typeof id}), centerId=${centerId} (type: ${typeof centerId})`);
      
      const res = await pool.query(query, params);
      console.log(`[DEBUG] EmployeeModel.getById - SQL success: ${res.rows.length} rows returned`);
      
      if (!res.rows[0]) return null;
      return res.rows[0];
    } catch (err) {
      console.error(`[ERROR] EmployeeModel.getById - SQL error: ${err.message}`, err);
      throw new Error("Error fetching record by ID from Employee: " + err.message);
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
      throw new Error("Error creating record in Employee: " + err.message);
    }
  },

  // ? update with tenant filtering
  update: async (id, fields, centerId = null) => {
    try {
      const setClauses = Object.keys(fields).map((key, i) => `"${key}" = $${i + 1}`).join(', ');
      const values = Object.values(fields);
      const paramIndex = values.length + 1;
      
      // ? Standardized pattern: WHERE id = $X AND ($Y::int IS NULL OR center_id = $Y)
      const query = `UPDATE ${tableName} SET ${setClauses} WHERE id = $${paramIndex}::int AND ($${paramIndex + 1}::int IS NULL OR center_id = $${paramIndex + 1}) RETURNING *`;
      values.push(id, centerId);
      
      const res = await pool.query(query, values);
      if (res.rowCount === 0) return null;
      return res.rows[0];
    } catch (err) {
      throw new Error("Error updating record in Employee: " + err.message);
    }
  },

  // ? delete with tenant filtering
  delete: async (id, centerId = null) => {
    try {
      // ? Standardized pattern: WHERE id = $1 AND ($2::int IS NULL OR center_id = $2)
      const query = `DELETE FROM ${tableName} WHERE id = $1::int AND ($2::int IS NULL OR center_id = $2) RETURNING *`;
      const params = [id, centerId];
      
      const res = await pool.query(query, params);
      if (res.rowCount === 0) return null;
      return res.rows[0];
    } catch (err) {
      throw new Error("Error deleting record from Employee: " + err.message);
    }
  }
};

module.exports = employeeModel;
