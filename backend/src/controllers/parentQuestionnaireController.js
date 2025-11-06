const parentQuestionnaireModel = require('../models/parentQuestionnaireModel');
const madressaApplicationModel = require('../models/madressaApplicationModel');
const relationshipsModel = require('../models/relationshipsModel');
const {
  enrichForPersistence,
  hydrateRecord,
  buildCommitmentDistribution,
  buildNarrative
} = require('../services/parentQuestionnaireService');
const { ROLES } = require('../constants/rbacMatrix');

const parentQuestionnaireController = {
  async getAll(req, res) {
    try {
      const centerId = req.center_id;
      const isMultiCenter = req.isMultiCenter;
      const filters = {};

      if (req.query.madressah_app_id) {
        filters.madressah_app_id = parseInt(req.query.madressah_app_id, 10);
      }

      const records = await parentQuestionnaireModel.getAll(
        centerId,
        isMultiCenter,
        filters
      );
      res.json(records);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },

  async getById(req, res) {
    try {
      const centerId = req.center_id;
      const isMultiCenter = req.isMultiCenter;
      const record = await parentQuestionnaireModel.getById(
        req.params.id,
        centerId,
        isMultiCenter
      );
      if (!record) {
        return res.status(404).json({ error: 'Parent questionnaire not found' });
      }
      res.json(record);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },

  async getByMadressahApp(req, res) {
    try {
      const centerId = req.center_id;
      const isMultiCenter = req.isMultiCenter;
      const records = await parentQuestionnaireModel.getByMadressahAppId(
        req.params.madressahAppId,
        centerId,
        isMultiCenter
      );
      res.json(records);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },

  async create(req, res) {
    try {
      const userRole = parseInt(req.user?.user_type, 10);
      if (userRole === ROLES.ORG_EXECUTIVE) {
        return res
          .status(403)
          .json({ error: 'Executives are not permitted to modify questionnaires' });
      }

      const username = req.user?.username || 'system';
      const rawMadressahAppId = req.body.madressah_app_id;
      const madressahAppId = rawMadressahAppId ? parseInt(rawMadressahAppId, 10) : NaN;

      if (!madressahAppId || Number.isNaN(madressahAppId)) {
        return res
          .status(400)
          .json({ error: 'madressah_app_id is required to create questionnaire' });
      }

      const normaliseCenter = (value) => {
        if (value === undefined || value === null || value === '') {
          return null;
        }
        const parsed = parseInt(value, 10);
        return Number.isNaN(parsed) ? null : parsed;
      };

      let resolvedCenterId = normaliseCenter(
        req.body.center_id ?? req.center_id ?? req.user?.center_id ?? null
      );

      let existing = null;
      try {
        const existingRecords = await parentQuestionnaireModel.getByMadressahAppId(
          madressahAppId,
          null,
          true
        );
        existing = existingRecords[0] || null;
        if (!resolvedCenterId && existing?.center_id) {
          resolvedCenterId = normaliseCenter(existing.center_id);
        }
      } catch (existingLookupErr) {
        console.warn(
          '[parentQuestionnaireController] Unable to lookup existing questionnaire',
          existingLookupErr.message
        );
      }

      if (!resolvedCenterId) {
        try {
          const madressahApp = await madressaApplicationModel.getById(
            madressahAppId,
            null,
            true
          );

          if (madressahApp?.center_id) {
            resolvedCenterId = normaliseCenter(madressahApp.center_id);
          }

          if (!resolvedCenterId && madressahApp?.applicant_relationship_id) {
            const relationship = await relationshipsModel.getById(
              madressahApp.applicant_relationship_id,
              null,
              true
            );

            if (relationship?.center_id) {
              resolvedCenterId = normaliseCenter(relationship.center_id);
            }
          }
        } catch (lookupErr) {
          console.warn(
            '[parentQuestionnaireController] Unable to resolve center_id from madressah_app_id',
            lookupErr.message
          );
        }
      }

      if (!resolvedCenterId && existing?.center_id) {
        resolvedCenterId = normaliseCenter(existing.center_id);
      }

      if (!resolvedCenterId) {
        return res
          .status(400)
          .json({ error: 'center_id is required to create questionnaire' });
      }

      const payload = {
        ...req.body,
        madressah_app_id: madressahAppId,
        center_id: resolvedCenterId,
        created_by: username,
        updated_by: username
      };

      const enriched = enrichForPersistence(payload);

      if (existing) {
        const updatePayload = {
          ...enriched,
          updated_by: username,
          center_id: resolvedCenterId
        };
        delete updatePayload.created_by;

        const updated = await parentQuestionnaireModel.update(
          existing.id,
          updatePayload,
          existing.center_id || resolvedCenterId,
          req.isMultiCenter
        );

        return res.status(200).json(updated);
      }

      const record = await parentQuestionnaireModel.create(enriched);
      res.status(201).json(record);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },
  async update(req, res) {
    try {
      const userRole = parseInt(req.user?.user_type, 10);
      if (userRole === ROLES.ORG_EXECUTIVE) {
        return res
          .status(403)
          .json({ error: 'Executives are not permitted to modify questionnaires' });
      }

      const centerId = req.center_id || req.user?.center_id;
      const username = req.user?.username || 'system';

      const payload = {
        ...req.body,
        updated_by: username
      };

      if (payload.madressah_app_id) {
        payload.madressah_app_id = parseInt(payload.madressah_app_id, 10);
      }

      const enriched = enrichForPersistence(payload);
      const record = await parentQuestionnaireModel.update(
        req.params.id,
        enriched,
        centerId,
        req.isMultiCenter
      );

      if (!record) {
        return res.status(404).json({ error: 'Parent questionnaire not found' });
      }

      res.json(record);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },

  async remove(req, res) {
    try {
      const userRole = parseInt(req.user?.user_type, 10);
      if (userRole === ROLES.ORG_EXECUTIVE) {
        return res
          .status(403)
          .json({ error: 'Executives are not permitted to delete questionnaires' });
      }

      const deleted = await parentQuestionnaireModel.delete(
        req.params.id,
        req.center_id,
        req.isMultiCenter
      );
      if (!deleted) {
        return res.status(404).json({ error: 'Parent questionnaire not found' });
      }
      res.json({ message: 'Deleted successfully' });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },

  async getReports(req, res) {
    try {
      const centerId = req.center_id;
      const isMultiCenter = req.isMultiCenter;
      const rows = await parentQuestionnaireModel.getReportAggregations(
        centerId,
        isMultiCenter
      );

      const totalsByCenter = rows.reduce((acc, row) => {
        const key = row.center_id;
        if (!acc[key]) {
          acc[key] = {
            center_id: row.center_id,
            center_name: row.center_name,
            total: 0,
            high: 0,
            moderate: 0,
            low: 0
          };
        }
        acc[key].total += 1;
        acc[key][row.commitment_category] =
          (acc[key][row.commitment_category] || 0) + 1;
        return acc;
      }, {});

      const totalsByGrade = rows.reduce((acc, row) => {
        const grade = row.grade && row.grade.trim().length > 0 ? row.grade : null;
        if (!grade) {
          return acc;
        }
        if (!acc[grade]) {
          acc[grade] = {
            grade,
            total: 0,
            high: 0,
            moderate: 0,
            low: 0
          };
        }
        acc[grade].total += 1;
        acc[grade][row.commitment_category] =
          (acc[grade][row.commitment_category] || 0) + 1;
        return acc;
      }, {});

      const summaryCounts = rows.reduce(
        (acc, row) => {
          acc.totalResponses += 1;
          acc[row.commitment_category] =
            (acc[row.commitment_category] || 0) + 1;
          return acc;
        },
        { totalResponses: 0, high: 0, moderate: 0, low: 0 }
      );

      res.json({
        totalsByCenter: Object.values(totalsByCenter),
        totalsByGrade: Object.values(totalsByGrade),
        commitmentDistribution: buildCommitmentDistribution(rows),
        narrative: buildNarrative(summaryCounts)
      });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },

  async getFlags(req, res) {
    try {
      const centerId = req.center_id;
      const isMultiCenter = req.isMultiCenter;
      const rows = await parentQuestionnaireModel.getFlagged(
        centerId,
        isMultiCenter
      );
      res.json(rows.map(hydrateRecord));
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }
};

module.exports = parentQuestionnaireController;

