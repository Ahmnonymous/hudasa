const pool = require('../config/db');
const {
  hydrateRecord
} = require('../services/parentQuestionnaireService');

const tableName = 'parent_questionnaire';

const parentQuestionnaireModel = {
  async getAll(centerId = null, isMultiCenter = false, filters = {}) {
    try {
      const params = [];
      let whereClause = '1=1';

      if (centerId && !isMultiCenter) {
        params.push(centerId);
        whereClause += ` AND pq.center_id = $${params.length}`;
      }

      if (filters.madressah_app_id) {
        params.push(filters.madressah_app_id);
        whereClause += ` AND pq.madressah_app_id = $${params.length}`;
      }

      const query = `
        SELECT 
          pq.*,
          ma.applicant_relationship_id,
          rel.name AS student_name,
          rel.surname AS student_surname,
          rel.id_number AS student_id_number,
          ar.grade AS academic_grade
        FROM ${tableName} pq
        INNER JOIN madressah_application ma ON ma.id = pq.madressah_app_id
        LEFT JOIN relationships rel ON rel.id = ma.applicant_relationship_id
        LEFT JOIN LATERAL (
          SELECT grade
          FROM academic_results
          WHERE madressah_app_id = pq.madressah_app_id
          ORDER BY created_at DESC
          LIMIT 1
        ) ar ON true
        WHERE ${whereClause}
        ORDER BY pq.created_at DESC
      `;

      const res = await pool.query(query, params);
      return res.rows.map(hydrateRecord);
    } catch (err) {
      throw new Error(
        `Error fetching parent questionnaire records: ${err.message}`
      );
    }
  },

  async getById(id, centerId = null, isMultiCenter = false) {
    try {
      const params = [id];
      let whereClause = 'pq.id = $1';

      if (centerId && !isMultiCenter) {
        params.push(centerId);
        whereClause += ` AND pq.center_id = $${params.length}`;
      }

      const query = `
        SELECT pq.*
        FROM ${tableName} pq
        WHERE ${whereClause}
        LIMIT 1
      `;

      const res = await pool.query(query, params);
      if (!res.rows[0]) return null;
      return hydrateRecord(res.rows[0]);
    } catch (err) {
      throw new Error(
        `Error fetching parent questionnaire record: ${err.message}`
      );
    }
  },

  async getByMadressahAppId(madressahAppId, centerId = null, isMultiCenter = false) {
    try {
      const params = [madressahAppId];
      let whereClause = 'pq.madressah_app_id = $1';

      if (centerId && !isMultiCenter) {
        params.push(centerId);
        whereClause += ` AND pq.center_id = $${params.length}`;
      }

      const query = `
        SELECT pq.*
        FROM ${tableName} pq
        WHERE ${whereClause}
        ORDER BY pq.created_at DESC
      `;

      const res = await pool.query(query, params);
      return res.rows.map(hydrateRecord);
    } catch (err) {
      throw new Error(
        `Error fetching parent questionnaire by Madressa application: ${err.message}`
      );
    }
  },

  async create(fields) {
    try {
      const columns = Object.keys(fields);
      const values = Object.values(fields);
      const placeholders = columns.map((_, idx) => `$${idx + 1}`);

      const query = `
        INSERT INTO ${tableName} (${columns.join(', ')})
        VALUES (${placeholders.join(', ')})
        RETURNING *
      `;

      const res = await pool.query(query, values);
      return hydrateRecord(res.rows[0]);
    } catch (err) {
      throw new Error(`Error creating parent questionnaire: ${err.message}`);
    }
  },

  async update(id, fields, centerId = null, isMultiCenter = false) {
    try {
      const setClauses = Object.keys(fields).map(
        (key, idx) => `${key} = $${idx + 1}`
      );
      const values = Object.values(fields);
      let params = [...values, id];
      let whereClause = `id = $${values.length + 1}`;

      if (centerId && !isMultiCenter) {
        params.push(centerId);
        whereClause += ` AND center_id = $${values.length + 2}`;
      }

      const query = `
        UPDATE ${tableName}
        SET ${setClauses.join(', ')}
        WHERE ${whereClause}
        RETURNING *
      `;

      const res = await pool.query(query, params);
      if (!res.rows[0]) return null;
      return hydrateRecord(res.rows[0]);
    } catch (err) {
      throw new Error(`Error updating parent questionnaire: ${err.message}`);
    }
  },

  async delete(id, centerId = null, isMultiCenter = false) {
    try {
      const params = [id];
      let whereClause = 'id = $1';

      if (centerId && !isMultiCenter) {
        params.push(centerId);
        whereClause += ` AND center_id = $${params.length}`;
      }

      const query = `
        DELETE FROM ${tableName}
        WHERE ${whereClause}
        RETURNING *
      `;

      const res = await pool.query(query, params);
      if (!res.rows[0]) return null;
      return hydrateRecord(res.rows[0]);
    } catch (err) {
      throw new Error(`Error deleting parent questionnaire: ${err.message}`);
    }
  },

  async getReportAggregations(centerId = null, isMultiCenter = false) {
    try {
      const params = [];
      let whereClause = '1=1';

      if (centerId && !isMultiCenter) {
        params.push(centerId);
        whereClause += ` AND pq.center_id = $${params.length}`;
      }

      const query = `
        SELECT
          pq.center_id,
          cd.organisation_name AS center_name,
          COALESCE(NULLIF(ar.grade, ''), NULLIF(ir.grade, '')) AS grade,
          pq.commitment_score,
          pq.commitment_category,
          pq.flag_level,
          pq.inconsistency_flags,
          pq.madressah_app_id
        FROM ${tableName} pq
        INNER JOIN center_detail cd ON cd.id = pq.center_id
        LEFT JOIN LATERAL (
          SELECT grade
          FROM academic_results
          WHERE madressah_app_id = pq.madressah_app_id
          ORDER BY created_at DESC
          LIMIT 1
        ) ar ON true
        LEFT JOIN LATERAL (
          SELECT grade
          FROM islamic_results
          WHERE madressah_app_id = pq.madressah_app_id
          ORDER BY created_at DESC
          LIMIT 1
        ) ir ON ar.grade IS NULL
        WHERE ${whereClause}
      `;

      const res = await pool.query(query, params);
      return res.rows.map((row) => ({
        ...row,
        inconsistency_flags: Array.isArray(row.inconsistency_flags)
          ? row.inconsistency_flags
          : (() => {
              if (!row.inconsistency_flags) return [];
              if (typeof row.inconsistency_flags === 'string') {
                try {
                  return JSON.parse(row.inconsistency_flags);
                } catch (err) {
                  return [];
                }
              }
              return [];
            })()
      }));
    } catch (err) {
      throw new Error(
        `Error building parent questionnaire report: ${err.message}`
      );
    }
  },

  async getFlagged(centerId = null, isMultiCenter = false) {
    try {
      const params = [];
      let whereClause = '(pq.flag_level != $1 OR jsonb_array_length(pq.inconsistency_flags) > 0)';
      params.push('green');

      if (centerId && !isMultiCenter) {
        params.push(centerId);
        whereClause += ` AND pq.center_id = $${params.length}`;
      }

      const query = `
        SELECT 
          pq.*,
          cd.organisation_name AS center_name,
          ar.grade AS academic_grade
        FROM ${tableName} pq
        INNER JOIN center_detail cd ON cd.id = pq.center_id
        LEFT JOIN LATERAL (
          SELECT grade
          FROM academic_results
          WHERE madressah_app_id = pq.madressah_app_id
          ORDER BY created_at DESC
          LIMIT 1
        ) ar ON true
        WHERE ${whereClause}
        ORDER BY pq.updated_at DESC
      `;

      const res = await pool.query(query, params);
      return res.rows.map(hydrateRecord);
    } catch (err) {
      throw new Error(
        `Error fetching flagged parent questionnaire responses: ${err.message}`
      );
    }
  }
};

module.exports = parentQuestionnaireModel;

