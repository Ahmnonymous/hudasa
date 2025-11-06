const ATTENDANCE_SCORE_MAP = {
  '7 days per week': 5,
  '6 days per week': 5,
  '5 days per week': 4,
  '4 days per week': 4,
  'only weekdays (monday to friday)': 4,
  'only weekends (saturday & sunday)': 3,
  '3 days per week': 3,
  'flexible / varies weekly': 3,
  '2 days per week': 2,
  '1 day per week': 1,
  'not sure / irregular attendance': 1
};

const HIGH_COMMITMENT_THRESHOLD = 4;
const AMBER_COMMITMENT_SCORE = 3;

/**
 * Normalize string values for comparison
 */
const normalize = (value) =>
  typeof value === 'string' ? value.trim().toLowerCase() : value;

/**
 * Convert incoming payload into a structure suitable for persistence
 */
function sanitizePayload(payload = {}) {
  const sanitized = { ...payload };

  if (sanitized.expectations && Array.isArray(sanitized.expectations)) {
    sanitized.expectations = JSON.stringify(sanitized.expectations);
  }

  if (
    sanitized.inconsistency_flags &&
    Array.isArray(sanitized.inconsistency_flags)
  ) {
    sanitized.inconsistency_flags = JSON.stringify(
      sanitized.inconsistency_flags
    );
  }

  return sanitized;
}

/**
 * Convert database row into API-friendly shape
 */
function hydrateRecord(record = {}) {
  const hydrated = { ...record };

  if (hydrated.expectations) {
    if (typeof hydrated.expectations === 'string') {
      try {
        hydrated.expectations = JSON.parse(hydrated.expectations);
      } catch (err) {
        hydrated.expectations = [];
      }
    } else if (!Array.isArray(hydrated.expectations)) {
      hydrated.expectations = [];
    }
  } else {
    hydrated.expectations = [];
  }

  if (hydrated.inconsistency_flags) {
    if (typeof hydrated.inconsistency_flags === 'string') {
      try {
        hydrated.inconsistency_flags = JSON.parse(hydrated.inconsistency_flags);
      } catch (err) {
        hydrated.inconsistency_flags = [];
      }
    } else if (!Array.isArray(hydrated.inconsistency_flags)) {
      hydrated.inconsistency_flags = [];
    }
  } else {
    hydrated.inconsistency_flags = [];
  }

  return hydrated;
}

/**
 * Score parental commitment based on attendance intent
 */
function calculateCommitmentScore(data = {}) {
  const frequency = normalize(data.attendance_frequency);
  if (!frequency) {
    return 0;
  }
  return ATTENDANCE_SCORE_MAP[frequency] || 0;
}

function determineCommitmentCategory(score) {
  if (score >= HIGH_COMMITMENT_THRESHOLD) return 'high';
  if (score === AMBER_COMMITMENT_SCORE) return 'moderate';
  return 'low';
}

function determineFlagLevel(score) {
  if (score >= HIGH_COMMITMENT_THRESHOLD) return 'green';
  if (score === AMBER_COMMITMENT_SCORE) return 'amber';
  return 'red';
}

/**
 * Build inconsistency flags for further review
 */
function evaluateInconsistencies(data = {}) {
  const flags = [];

  const burialConsent = normalize(data.burial_consent);
  const interest = normalize(data.parent_interest);
  if (
    burialConsent &&
    burialConsent.startsWith('yes') &&
    interest &&
    (interest.startsWith('no') || interest.includes('not interested'))
  ) {
    flags.push(
      'Parent consented to Islamic burial but indicated no interest in learning about Islam.'
    );
  }

  const expectations = Array.isArray(data.expectations)
    ? data.expectations.map(normalize)
    : [];
  const welfareFocused = expectations.includes(
    'we are primarily interested in the welfare and material benefits provided'
  );
  const attendanceScore = calculateCommitmentScore(data);
  if (welfareFocused && attendanceScore <= 2) {
    flags.push(
      'Low attendance commitment paired with welfare-focused expectations.'
    );
  }

  if (!attendanceScore && data.attendance_frequency_other) {
    flags.push(
      'Unable to score attendance commitment because frequency response is unrecognized.'
    );
  }

  if (
    Array.isArray(data.expectations) &&
    data.expectations.includes('Other (please specify)') &&
    !data.expectations_other
  ) {
    flags.push('Expectations include "Other" without additional context.');
  }

  if (
    normalize(data.medical_consent)?.startsWith('no') &&
    normalize(data.policy_compliance)?.startsWith('yes')
  ) {
    flags.push('Parent declined medical consent but agreed to policy compliance.');
  }

  return flags;
}

/**
 * Decorate payload with derived scoring and flag data
 */
function enrichForPersistence(payload = {}) {
  const data = { ...payload };

  const expectations =
    typeof data.expectations === 'string'
      ? (() => {
          try {
            return JSON.parse(data.expectations);
          } catch (err) {
            return [];
          }
        })()
      : data.expectations;

  const working = {
    ...data,
    expectations
  };

  const commitmentScore = calculateCommitmentScore(working);
  const commitmentCategory = determineCommitmentCategory(commitmentScore);
  const flagLevel = determineFlagLevel(commitmentScore);
  const inconsistencies = evaluateInconsistencies(working);

  working.commitment_score = commitmentScore;
  working.commitment_category = commitmentCategory;
  working.flag_level = inconsistencies.length > 0 ? 'amber' : flagLevel;
  working.inconsistency_flags = inconsistencies;

  return sanitizePayload(working);
}

/**
 * Prepare datasets for reporting endpoints
 */
function buildCommitmentDistribution(rows = []) {
  const counts = rows.reduce(
    (acc, item) => {
      const category = item.commitment_category || 'unknown';
      acc[category] = (acc[category] || 0) + 1;
      return acc;
    },
    {}
  );

  const total = rows.length || 1;
  return Object.entries(counts).map(([category, value]) => ({
    category,
    total: value,
    percentage: Math.round((value / total) * 100)
  }));
}

function buildNarrative(summary = {}) {
  const { totalResponses = 0, high = 0, moderate = 0, low = 0 } = summary;
  if (!totalResponses) {
    return 'No parent questionnaire responses recorded for the selected filters.';
  }

  const highPct = Math.round((high / totalResponses) * 100);
  const moderatePct = Math.round((moderate / totalResponses) * 100);
  const lowPct = Math.round((low / totalResponses) * 100);

  return `Out of ${totalResponses} parent questionnaires, ${highPct}% demonstrate high commitment to Madressa attendance while ${moderatePct}% fall into the moderate range. ${lowPct}% remain low commitment and require additional follow-up.`;
}

module.exports = {
  ATTENDANCE_SCORE_MAP,
  sanitizePayload,
  hydrateRecord,
  calculateCommitmentScore,
  determineFlagLevel,
  determineCommitmentCategory,
  evaluateInconsistencies,
  enrichForPersistence,
  buildCommitmentDistribution,
  buildNarrative
};

