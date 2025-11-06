const db = require('../config/db');

class ReportsModel {
    // Center Audits Report
    static async getCenterAudits(centerId = null) {
        try {
            let query = `
                SELECT 
                    ca.id,
                    ca.audit_date,
                    ca.audit_type,
                    ca.findings,
                    ca.recommendations,
                    ca.conducted_by,
                    ca.created_by,
                    ca.created_at,
                    ca.updated_by,
                    ca.updated_at,
                    ca.center_id
                FROM center_audits ca
            `;
            const params = [];
            if (centerId) {
                query += ` WHERE ca.center_id = $1`;
                params.push(centerId);
            }
            query += ` ORDER BY ca.audit_date DESC`;
            const result = await db.query(query, params);
            return result.rows;
        } catch (error) {
            throw new Error(`Error fetching center audits: ${error.message}`);
        }
    }
    // Applicant Details Report
    static async getApplicantDetails(centerId = null) {
        try {
            let query = `
                SELECT 
                    ad.id,
                    ad.name,
                    ad.surname,
                    ad.id_number,
                    ad.file_number,
                    ad.date_intake,
                    ad.cell_number,
                    ad.alternate_number,
                    ad.email_address,
                    ad.street_address,
                    ad.popia_agreement,
                    ad.race,
                    ad.nationality,
                    ad.gender,
                    ad.file_condition,
                    ad.file_status,
                    ad.highest_education_level,
                    ad.marital_status,
                    ad.employment_status,
                    ad.suburb,
                    ad.dwelling_type,
                    ad.dwelling_status,
                    ad.health,
                    ad.skills,
                    ad.created_by,
                    ad.created_at,
                    -- Join with lookup tables for readable names
                    r.name AS race_name,
                    n.name AS nationality_name,
                    g.name AS gender_name,
                    fc.name AS file_condition_name,
                    fs.name AS file_status_name,
                    el.name AS education_level_name,
                    ms.name AS marital_status_name,
                    es.name AS employment_status_name,
                    s.name AS suburb_name,
                    dt.name AS dwelling_type_name,
                    ds.name AS dwelling_status_name,
                    hc.name AS health_condition_name,
                    sk.name AS skills_name,
                    ad.center_id,
                    cd.organisation_name AS center_name
                FROM applicant_details ad
                LEFT JOIN race r ON ad.race = r.id
                LEFT JOIN nationality n ON ad.nationality = n.id
                LEFT JOIN gender g ON ad.gender = g.id
                LEFT JOIN file_condition fc ON ad.file_condition = fc.id
                LEFT JOIN file_status fs ON ad.file_status = fs.id
                LEFT JOIN education_level el ON ad.highest_education_level = el.id
                LEFT JOIN marital_status ms ON ad.marital_status = ms.id
                LEFT JOIN employment_status es ON ad.employment_status = es.id
                LEFT JOIN suburb s ON ad.suburb = s.id
                LEFT JOIN dwelling_type dt ON ad.dwelling_type = dt.id
                LEFT JOIN dwelling_status ds ON ad.dwelling_status = ds.id
                LEFT JOIN health_conditions hc ON ad.health = hc.id
                LEFT JOIN skills sk ON ad.skills = sk.id
                LEFT JOIN center_detail cd ON cd.id = ad.center_id
            `;
            
            const params = [];
            if (centerId) {
                query += ` WHERE ad.center_id = $1`;
                params.push(centerId);
            }
            
            query += ` ORDER BY ad.created_at DESC`;
            
            const result = await db.query(query, params);
            return result.rows;
        } catch (error) {
            throw new Error(`Error fetching applicant details: ${error.message}`);
        }
    }

    // Total Financial Assistance Report
    static async getTotalFinancialAssistance(centerId = null) {
        try {
            let query = `
                SELECT 
                    ad.name,
                    ad.surname,
                    ad.file_number,
                    ad.file_condition,
                    ad.file_status,
                    ad.employment_status,
                    ad.health,
                    ad.cell_number,
                    COALESCE(SUM(fa.financial_cost), 0) AS financial_food_assistance,
                    COALESCE(SUM(fin.financial_amount), 0) AS financial_transactions,
                    COALESCE(SUM(fa.financial_cost), 0) + COALESCE(SUM(fin.financial_amount), 0) AS total_financial,
                    -- Join with lookup tables for readable names
                    fc.name AS file_condition_name,
                    fs.name AS file_status_name,
                    es.name AS employment_status_name,
                    hc.name AS health_condition_name,
                    ad.center_id,
                    cd.organisation_name AS center_name
                FROM applicant_details ad
                LEFT JOIN food_assistance fa ON fa.file_id = ad.id
                LEFT JOIN financial_assistance fin ON fin.file_id = ad.id
                LEFT JOIN file_condition fc ON ad.file_condition = fc.id
                LEFT JOIN file_status fs ON ad.file_status = fs.id
                LEFT JOIN employment_status es ON ad.employment_status = es.id
                LEFT JOIN health_conditions hc ON ad.health = hc.id
                LEFT JOIN center_detail cd ON cd.id = ad.center_id
            `;
            
            const params = [];
            if (centerId) {
                query += ` WHERE ad.center_id = $1`;
                params.push(centerId);
            }
            
            query += `
                GROUP BY
                    ad.name, ad.surname, ad.file_number, ad.cell_number,
                    ad.file_condition, ad.file_status, ad.employment_status, ad.health,
                    fc.name, fs.name, es.name, hc.name, ad.center_id, cd.organisation_name
                ORDER BY total_financial DESC
            `;
            
            const result = await db.query(query, params);
            return result.rows;
        } catch (error) {
            throw new Error(`Error fetching total financial assistance: ${error.message}`);
        }
    }

    // Financial Assistance Report
    static async getFinancialAssistance(centerId = null) {
        try {
            let query = `
                SELECT 
                    ad.name,
                    ad.surname,
                    ad.file_number,
                    ad.cell_number,
                    fin.created_by AS assisted_by,
                    fin.financial_amount,
                    fin.assistance_type,
                    fin.date_of_assistance,
                    fin.created_by,
                    fin.created_at,
                    -- Join with lookup tables for readable names
                    at.name AS assistance_type_name,
                    COALESCE(fin.center_id, ad.center_id) AS center_id,
                    cd.organisation_name AS center_name
                FROM financial_assistance fin
                INNER JOIN applicant_details ad ON fin.file_id = ad.id
                LEFT JOIN assistance_types at ON fin.assistance_type = at.id
                LEFT JOIN center_detail cd ON cd.id = COALESCE(fin.center_id, ad.center_id)
            `;
            
            const params = [];
            if (centerId) {
                query += ` WHERE fin.center_id = $1`;
                params.push(centerId);
            }
            
            query += ` ORDER BY fin.date_of_assistance DESC`;
            
            const result = await db.query(query, params);
            return result.rows;
        } catch (error) {
            throw new Error(`Error fetching financial assistance: ${error.message}`);
        }
    }

    // Food Assistance Report
    static async getFoodAssistance(centerId = null) {
        try {
            let query = `
                SELECT 
                    ad.name,
                    ad.surname,
                    ad.file_number,
                    ad.cell_number,
                    fa.hamper_type,
                    fa.financial_cost,
                    fa.created_by AS assisted_by,
                    fa.distributed_date,
                    fa.created_by,
                    fa.created_at,
                    -- Join with lookup tables for readable names
                    h.name AS hamper_type_name,
                    COALESCE(fa.center_id, ad.center_id) AS center_id,
                    cd.organisation_name AS center_name
                FROM food_assistance fa
                INNER JOIN applicant_details ad ON fa.file_id = ad.id
                LEFT JOIN hampers h ON fa.hamper_type = h.id
                LEFT JOIN center_detail cd ON cd.id = COALESCE(fa.center_id, ad.center_id)
            `;
            
            const params = [];
            if (centerId) {
                query += ` WHERE fa.center_id = $1`;
                params.push(centerId);
            }
            
            query += ` ORDER BY fa.distributed_date DESC`;
            
            const result = await db.query(query, params);
            return result.rows;
        } catch (error) {
            throw new Error(`Error fetching food assistance: ${error.message}`);
        }
    }

    // Home Visits Report
    static async getHomeVisits(centerId = null) {
        try {
            let query = `
                SELECT 
                    ad.name,
                    ad.surname,
                    ad.file_number,
                    ad.cell_number,
                    hv.visit_date,
                    hv.representative,
                    hv.comments,
                    hv.attachment_1,
                    hv.attachment_2,
                    hv.created_by,
                    hv.created_at,
                    COALESCE(hv.center_id, ad.center_id) AS center_id,
                    cd.organisation_name AS center_name
                FROM home_visit hv
                INNER JOIN applicant_details ad ON hv.file_id = ad.id
                LEFT JOIN center_detail cd ON cd.id = COALESCE(hv.center_id, ad.center_id)
            `;
            
            const params = [];
            if (centerId) {
                query += ` WHERE hv.center_id = $1`;
                params.push(centerId);
            }
            
            query += ` ORDER BY hv.visit_date DESC`;
            
            const result = await db.query(query, params);
            return result.rows;
        } catch (error) {
            throw new Error(`Error fetching home visits: ${error.message}`);
        }
    }

    // Relationship Report
    static async getRelationshipReport(centerId = null) {
        try {
            let query = `
                SELECT 
                    ad.name,
                    ad.surname,
                    ad.file_number,
                    ad.cell_number,
                    rel.relationship_type,
                    rel.name AS relatives_name,
                    rel.surname AS relatives_surname,
                    rel.employment_status,
                    rel.gender,
                    EXTRACT(YEAR FROM AGE(CURRENT_DATE, rel.date_of_birth)) AS age,
                    rel.highest_education,
                    rel.health_condition,
                    -- Join with lookup tables for readable names
                    rt.name AS relationship_type_name,
                    es.name AS employment_status_name,
                    g.name AS gender_name,
                    el.name AS education_level_name,
                    hc.name AS health_condition_name,
                    COALESCE(rel.center_id, ad.center_id) AS center_id,
                    cd.organisation_name AS center_name
                FROM relationships rel
                INNER JOIN applicant_details ad ON rel.file_id = ad.id
                LEFT JOIN relationship_types rt ON rel.relationship_type = rt.id
                LEFT JOIN employment_status es ON rel.employment_status = es.id
                LEFT JOIN gender g ON rel.gender = g.id
                LEFT JOIN education_level el ON rel.highest_education = el.id
                LEFT JOIN health_conditions hc ON rel.health_condition = hc.id
                LEFT JOIN center_detail cd ON cd.id = COALESCE(rel.center_id, ad.center_id)
            `;
            
            const params = [];
            if (centerId) {
                query += ` WHERE rel.center_id = $1`;
                params.push(centerId);
            }
            
            query += ` ORDER BY ad.name, rel.name`;
            
            const result = await db.query(query, params);
            return result.rows;
        } catch (error) {
            throw new Error(`Error fetching relationship report: ${error.message}`);
        }
    }

    // Financial Assessment Report
    static async getFinancialAssessment(centerId = null) {
        try {
            let query = `
                SELECT 
                    ad.name,
                    ad.surname,
                    ad.file_number,
                    ad.cell_number,
                    fs.name AS file_status_name,
                    es.name AS employment_status_name,
                    fa.id AS assessment_id,
                    fa.total_income,
                    fa.total_expenses,
                    fa.disposable_income,
                    fa.created_by,
                    fa.created_at,
                    -- Income details (up to 9 items)
                    ARRAY_AGG(DISTINCT jsonb_build_object(
                        'income_type', it.name,
                        'income_amount', ai.amount,
                        'income_description', ai.description
                    )) FILTER (WHERE ai.id IS NOT NULL) AS income_items,
                    -- Expense details (up to 9 items)
                    ARRAY_AGG(DISTINCT jsonb_build_object(
                        'expense_type', et.name,
                        'expense_amount', ae.amount,
                        'expense_description', ae.description
                    )) FILTER (WHERE ae.id IS NOT NULL) AS expense_items,
                    COALESCE(fa.center_id, ad.center_id) AS center_id,
                    cd.organisation_name AS center_name
                FROM financial_assessment fa
                INNER JOIN applicant_details ad ON fa.file_id = ad.id
                LEFT JOIN file_status fs ON ad.file_status = fs.id
                LEFT JOIN employment_status es ON ad.employment_status = es.id
                LEFT JOIN applicant_income ai ON ai.financial_assessment_id = fa.id
                LEFT JOIN income_type it ON ai.income_type_id = it.id
                LEFT JOIN applicant_expense ae ON ae.financial_assessment_id = fa.id
                LEFT JOIN expense_type et ON ae.expense_type_id = et.id
                LEFT JOIN center_detail cd ON cd.id = COALESCE(fa.center_id, ad.center_id)
            `;
            
            const params = [];
            if (centerId) {
                query += ` WHERE fa.center_id = $1`;
                params.push(centerId);
            }
            
            query += `
                GROUP BY
                    ad.name, ad.surname, ad.file_number, ad.cell_number,
                    fs.name, es.name, fa.id, fa.total_income, fa.total_expenses, 
                    fa.disposable_income, fa.created_by, fa.created_at, ad.center_id, cd.organisation_name
                ORDER BY fa.created_at DESC
            `;
            
            const result = await db.query(query, params);
            return result.rows;
        } catch (error) {
            throw new Error(`Error fetching financial assessment: ${error.message}`);
        }
    }

    // Skills Matrix Report (Employee Skills)
    static async getSkillsMatrix(centerId = null) {
        try {
            let query = `
                SELECT 
                    e.id AS employee_id,
                    e.name,
                    e.surname,
                    e.id_number,
                    e.contact_number AS cell_number,
                    d.name AS department_name,
                    es.course,
                    es.institution,
                    es.date_conducted,
                    es.date_expired,
                    es.training_outcome,
                    es.created_by,
                    es.created_at,
                    -- Join with lookup tables for readable names
                    tc.name AS course_name,
                    ti.institute_name AS institution_name,
                    tout.name AS program_outcome_name,
                    -- Calculate status based on date_expired
                    CASE
                        WHEN es.date_expired IS NULL THEN 'No Expiry'
                        WHEN es.date_expired < CURRENT_DATE THEN 'Expired'
                        WHEN es.date_expired <= CURRENT_DATE + INTERVAL '30 days' THEN 'Coming Up Soon'
                        ELSE 'Still Valid'
                    END AS status,
                    COALESCE(es.center_id, e.center_id) AS center_id,
                    cd.organisation_name AS center_name
                FROM employee_skills es
                INNER JOIN employee e ON es.employee_id = e.id
                LEFT JOIN departments d ON e.department = d.id
                LEFT JOIN training_courses tc ON es.course = tc.id
                LEFT JOIN training_institutions ti ON es.institution = ti.id
                LEFT JOIN training_outcome tout ON es.training_outcome = tout.id
                LEFT JOIN center_detail cd ON cd.id = COALESCE(es.center_id, e.center_id)
            `;
            
            const params = [];
            if (centerId) {
                query += ` WHERE es.center_id = $1`;
                params.push(centerId);
            }
            
            query += ` ORDER BY e.surname, e.name, es.date_expired ASC`;
            
            const result = await db.query(query, params);
            return result.rows;
        } catch (error) {
            throw new Error(`Error fetching skills matrix: ${error.message}`);
        }
    }
}

module.exports = ReportsModel;
