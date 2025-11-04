const pool = require('../config/db');

const dashboardModel = {
  getApplicantStatistics: async (centerId, isSuperAdmin) => {
    try {
      // ✅ Build tenant filter condition
      const tenantFilter = !isSuperAdmin && centerId 
        ? `AND a.center_id = $1`
        : '';
      const params = !isSuperAdmin && centerId ? [centerId] : [];

      // Get all statistics in parallel
      const [
        nationalityStats,
        genderStats,
        educationStats,
        raceStats,
        suburbStats,
        employmentStats,
        maritalStats,
        fileStatusStats,
        fileConditionStats,
        summaryStats,
      ] = await Promise.all([
        // Nationality statistics with tenant filter
        pool.query(`
          SELECT 
            n.name as label,
            COUNT(a.id)::INTEGER as value
          FROM applicant_details a
          LEFT JOIN nationality n ON a.nationality = n.id
          WHERE n.name IS NOT NULL ${tenantFilter}
          GROUP BY n.id, n.name
          ORDER BY value DESC
        `, params),
        
        // Gender statistics with tenant filter
        pool.query(`
          SELECT 
            g.name as label,
            COUNT(a.id)::INTEGER as value
          FROM applicant_details a
          LEFT JOIN gender g ON a.gender = g.id
          WHERE g.name IS NOT NULL ${tenantFilter}
          GROUP BY g.id, g.name
          ORDER BY value DESC
        `, params),
        
        // Education statistics with tenant filter
        pool.query(`
          SELECT 
            e.name as label,
            COUNT(a.id)::INTEGER as value
          FROM applicant_details a
          LEFT JOIN education_level e ON a.highest_education_level = e.id
          WHERE e.name IS NOT NULL ${tenantFilter}
          GROUP BY e.id, e.name
          ORDER BY value DESC
        `, params),
        
        // Race statistics with tenant filter
        pool.query(`
          SELECT 
            r.name as label,
            COUNT(a.id)::INTEGER as value
          FROM applicant_details a
          LEFT JOIN race r ON a.race = r.id
          WHERE r.name IS NOT NULL ${tenantFilter}
          GROUP BY r.id, r.name
          ORDER BY value DESC
        `, params),
        
        // Suburb statistics with tenant filter
        pool.query(`
          SELECT 
            s.name as label,
            COUNT(a.id)::INTEGER as value
          FROM applicant_details a
          LEFT JOIN suburb s ON a.suburb = s.id
          WHERE s.name IS NOT NULL ${tenantFilter}
          GROUP BY s.id, s.name
          ORDER BY value DESC
        `, params),
        
        // Employment Status statistics with tenant filter
        pool.query(`
          SELECT 
            e.name as label,
            COUNT(a.id)::INTEGER as value
          FROM applicant_details a
          LEFT JOIN employment_status e ON a.employment_status = e.id
          WHERE e.name IS NOT NULL ${tenantFilter}
          GROUP BY e.id, e.name
          ORDER BY value DESC
        `, params),
        
        // Marital Status statistics with tenant filter
        pool.query(`
          SELECT 
            m.name as label,
            COUNT(a.id)::INTEGER as value
          FROM applicant_details a
          LEFT JOIN marital_status m ON a.marital_status = m.id
          WHERE m.name IS NOT NULL ${tenantFilter}
          GROUP BY m.id, m.name
          ORDER BY value DESC
        `, params),
        
        // File Status statistics with tenant filter
        pool.query(`
          SELECT 
            f.name as label,
            COUNT(a.id)::INTEGER as value
          FROM applicant_details a
          LEFT JOIN file_status f ON a.file_status = f.id
          WHERE f.name IS NOT NULL ${tenantFilter}
          GROUP BY f.id, f.name
          ORDER BY value DESC
        `, params),
        
        // File Condition statistics with tenant filter
        pool.query(`
          SELECT 
            f.name as label,
            COUNT(a.id)::INTEGER as value
          FROM applicant_details a
          LEFT JOIN file_condition f ON a.file_condition = f.id
          WHERE f.name IS NOT NULL ${tenantFilter}
          GROUP BY f.id, f.name
          ORDER BY value DESC
        `, params),
        
        // Summary statistics with tenant filter
        pool.query(`
          SELECT 
            COUNT(*)::INTEGER as total_applicants,
            COUNT(CASE WHEN file_status = (SELECT id FROM file_status WHERE name = 'Active' LIMIT 1) THEN 1 END)::INTEGER as active_applicants,
            COUNT(CASE WHEN created_at >= DATE_TRUNC('month', CURRENT_DATE) THEN 1 END)::INTEGER as new_this_month
          FROM applicant_details a
          WHERE 1=1 ${tenantFilter}
        `, params),
      ]);

      return {
        nationality: nationalityStats.rows,
        gender: genderStats.rows,
        education: educationStats.rows,
        race: raceStats.rows,
        suburbs: suburbStats.rows,
        employment: employmentStats.rows,
        marital: maritalStats.rows,
        fileStatus: fileStatusStats.rows,
        fileCondition: fileConditionStats.rows,
        summary: summaryStats.rows[0] || {
          total_applicants: 0,
          active_applicants: 0,
          new_this_month: 0,
        },
      };
    } catch (err) {
      throw new Error('Error fetching applicant statistics: ' + err.message);
    }
  },
};

module.exports = dashboardModel;

