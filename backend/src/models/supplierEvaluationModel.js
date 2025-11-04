const pool = require('../config/db');

const tableName = 'supplier_evaluation';

const supplierEvaluationModel = {
  // ? getAll with tenant filtering (can filter by supplierId OR centerId)
  getAll: async (centerId = null, supplierId = null, isMultiCenter = false) => {
    try {
      let query = `SELECT * FROM ${tableName}`;
      const params = [];
      let paramCount = 0;
      
      const conditions = [];
      
      // ? Apply tenant filtering
      if (centerId && !isMultiCenter) {
        paramCount++;
        conditions.push(`"center_id" = $${paramCount}`);
        params.push(centerId);
      }
      
      if (supplierId) {
        paramCount++;
        conditions.push(`supplier_id = $${paramCount}`);
        params.push(supplierId);
      }
      
      if (conditions.length > 0) {
        query += ` WHERE ${conditions.join(' AND ')}`;
      }
      
      const res = await pool.query(query, params);
      // Map database column names to frontend field names
      return res.rows.map(row => ({
        id: row.id,
        center_id: row.center_id,
        supplier_id: row.supplier_id,
        eval_date: row.eval_date,
        quality_score: row.quality_score,
        delivery_score: row.delivery_score,
        cost_score: row.cost_score,
        ohs_score: row.ohs_score,
        env_score: row.env_score,
        quality_wt: row.quality_wt,
        delivery_wt: row.delivery_wt,
        cost_wt: row.cost_wt,
        ohs_wt: row.ohs_wt,
        env_wt: row.env_wt,
        overall_score: row.overall_score,
        status: row.status,
        expiry_date: row.expiry_date,
        notes: row.notes,
        created_by: row.created_by,
        updated_by: row.updated_by,
        datestamp: row.datestamp,
        updated_at: row.updated_at,
      }));
    } catch (err) {
      throw new Error("Error fetching all records from Supplier_Evaluation: " + err.message);
    }
  },

  // ? getById with tenant filtering
  getById: async (id, centerId = null, isMultiCenter = false) => {
    try {
      let query = `SELECT * FROM ${tableName} WHERE "id" = $1`;
      const params = [id];
      
      // ? Apply tenant filtering
      if (centerId && !isMultiCenter) {
        query += ` AND "center_id" = $2`;
        params.push(centerId);
      }
      
      const res = await pool.query(query, params);
      if (!res.rows[0]) return null;
      
      const row = res.rows[0];
      // Map database column names to frontend field names
      return {
        id: row.id,
        center_id: row.center_id,
        supplier_id: row.supplier_id,
        eval_date: row.eval_date,
        quality_score: row.quality_score,
        delivery_score: row.delivery_score,
        cost_score: row.cost_score,
        ohs_score: row.ohs_score,
        env_score: row.env_score,
        quality_wt: row.quality_wt,
        delivery_wt: row.delivery_wt,
        cost_wt: row.cost_wt,
        ohs_wt: row.ohs_wt,
        env_wt: row.env_wt,
        overall_score: row.overall_score,
        status: row.status,
        expiry_date: row.expiry_date,
        notes: row.notes,
        created_by: row.created_by,
        updated_by: row.updated_by,
        datestamp: row.datestamp,
        updated_at: row.updated_at,
      };
    } catch (err) {
      throw new Error("Error fetching record by ID from Supplier_Evaluation: " + err.message);
    }
  },

  create: async (fields, centerId) => {
    try {
      // Add center_id if provided
      if (centerId) {
        fields.center_id = centerId;
      }
      
      // Map frontend field names to database column names
      const dbFields = {};
      if (fields.supplier_id) dbFields.supplier_id = fields.supplier_id;
      if (fields.eval_date) dbFields.eval_date = fields.eval_date;
      if (fields.quality_score !== undefined) dbFields.quality_score = fields.quality_score;
      if (fields.delivery_score !== undefined) dbFields.delivery_score = fields.delivery_score;
      if (fields.cost_score !== undefined) dbFields.cost_score = fields.cost_score;
      if (fields.ohs_score !== undefined) dbFields.ohs_score = fields.ohs_score;
      if (fields.env_score !== undefined) dbFields.env_score = fields.env_score;
      if (fields.quality_wt !== undefined) dbFields.quality_wt = fields.quality_wt;
      if (fields.delivery_wt !== undefined) dbFields.delivery_wt = fields.delivery_wt;
      if (fields.cost_wt !== undefined) dbFields.cost_wt = fields.cost_wt;
      if (fields.ohs_wt !== undefined) dbFields.ohs_wt = fields.ohs_wt;
      if (fields.env_wt !== undefined) dbFields.env_wt = fields.env_wt;
      if (fields.overall_score !== undefined) dbFields.overall_score = fields.overall_score;
      if (fields.status) dbFields.status = fields.status;
      if (fields.expiry_date) dbFields.expiry_date = fields.expiry_date;
      if (fields.notes) dbFields.notes = fields.notes;
      if (fields.created_by) dbFields.created_by = fields.created_by;
      if (fields.updated_by) dbFields.updated_by = fields.updated_by;
      if (fields.center_id) dbFields.center_id = fields.center_id;
      
      const columns = Object.keys(dbFields).join(', ');
      const values = Object.values(dbFields);
      const placeholders = values.map((_, i) => `$${i + 1}`).join(', ');
      const query = `INSERT INTO ${tableName} (${columns}) VALUES (${placeholders}) RETURNING *`;
      const res = await pool.query(query, values);
      return res.rows[0];
    } catch (err) {
      throw new Error("Error creating record in Supplier_Evaluation: " + err.message);
    }
  },

  // ? update with tenant filtering
  update: async (id, fields, centerId = null, isMultiCenter = false) => {
    try {
      // Map frontend field names to database column names
      const dbFields = {};
      if (fields.supplier_id) dbFields.supplier_id = fields.supplier_id;
      if (fields.eval_date) dbFields.eval_date = fields.eval_date;
      if (fields.quality_score !== undefined) dbFields.quality_score = fields.quality_score;
      if (fields.delivery_score !== undefined) dbFields.delivery_score = fields.delivery_score;
      if (fields.cost_score !== undefined) dbFields.cost_score = fields.cost_score;
      if (fields.ohs_score !== undefined) dbFields.ohs_score = fields.ohs_score;
      if (fields.env_score !== undefined) dbFields.env_score = fields.env_score;
      if (fields.quality_wt !== undefined) dbFields.quality_wt = fields.quality_wt;
      if (fields.delivery_wt !== undefined) dbFields.delivery_wt = fields.delivery_wt;
      if (fields.cost_wt !== undefined) dbFields.cost_wt = fields.cost_wt;
      if (fields.ohs_wt !== undefined) dbFields.ohs_wt = fields.ohs_wt;
      if (fields.env_wt !== undefined) dbFields.env_wt = fields.env_wt;
      if (fields.overall_score !== undefined) dbFields.overall_score = fields.overall_score;
      if (fields.status) dbFields.status = fields.status;
      if (fields.expiry_date) dbFields.expiry_date = fields.expiry_date;
      if (fields.notes) dbFields.notes = fields.notes;
      if (fields.updated_by) dbFields.updated_by = fields.updated_by;
      
      const setClauses = Object.keys(dbFields).map((key, i) => `${key} = $${i + 1}`).join(', ');
      const values = Object.values(dbFields);
      let where = `"id" = $${values.length + 1}`;
      const params = [...values, id];
      
      // ? Apply tenant filtering
      if (centerId && !isMultiCenter) {
        where += ` AND "center_id" = $${values.length + 2}`;
        params.push(centerId);
      }
      
      const query = `UPDATE ${tableName} SET ${setClauses} WHERE ${where} RETURNING *`;
      const res = await pool.query(query, params);
      if (res.rowCount === 0) return null;
      return res.rows[0];
    } catch (err) {
      throw new Error("Error updating record in Supplier_Evaluation: " + err.message);
    }
  },

  // ? delete with tenant filtering
  delete: async (id, centerId = null, isMultiCenter = false) => {
    try {
      let where = `"id" = $1`;
      const params = [id];
      
      // ? Apply tenant filtering
      if (centerId && !isMultiCenter) {
        where += ` AND "center_id" = $2`;
        params.push(centerId);
      }
      
      const query = `DELETE FROM ${tableName} WHERE ${where} RETURNING *`;
      const res = await pool.query(query, params);
      if (res.rowCount === 0) return null;
      return res.rows[0];
    } catch (err) {
      throw new Error("Error deleting record from Supplier_Evaluation: " + err.message);
    }
  }
};

module.exports = supplierEvaluationModel;
