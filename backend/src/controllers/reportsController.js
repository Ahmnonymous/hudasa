const ReportsModel = require('../models/reportsModel');

class ReportsController {
    // ✅ FIXED: Use req.center_id from filterMiddleware (App Admin = null, others = their center_id)
    // Center Audits Report
    static async getCenterAudits(req, res) {
        try {
            const centerId = req.center_id; // Set by filterMiddleware
            const data = await ReportsModel.getCenterAudits(centerId);
            res.status(200).json({ success: true, data, count: data.length, message: 'Center audits report retrieved successfully' });
        } catch (error) {
            console.error('Error in getCenterAudits:', error);
            res.status(500).json({ success: false, message: 'Error retrieving center audits report', error: error.message });
        }
    }
    // Get Applicant Details Report
    static async getApplicantDetails(req, res) {
        try {
            const centerId = req.center_id; // Set by filterMiddleware
            const data = await ReportsModel.getApplicantDetails(centerId);
            
            res.status(200).json({
                success: true,
                data: data,
                count: data.length,
                message: 'Applicant details report retrieved successfully'
            });
        } catch (error) {
            console.error('Error in getApplicantDetails:', error);
            res.status(500).json({
                success: false,
                message: 'Error retrieving applicant details report',
                error: error.message
            });
        }
    }

    // Get Total Financial Assistance Report
    static async getTotalFinancialAssistance(req, res) {
        try {
            const centerId = req.center_id; // Set by filterMiddleware
            const data = await ReportsModel.getTotalFinancialAssistance(centerId);
            
            res.status(200).json({
                success: true,
                data: data,
                count: data.length,
                message: 'Total financial assistance report retrieved successfully'
            });
        } catch (error) {
            console.error('Error in getTotalFinancialAssistance:', error);
            res.status(500).json({
                success: false,
                message: 'Error retrieving total financial assistance report',
                error: error.message
            });
        }
    }

    // Get Financial Assistance Report
    static async getFinancialAssistance(req, res) {
        try {
            const centerId = req.center_id; // Set by filterMiddleware
            const data = await ReportsModel.getFinancialAssistance(centerId);
            
            res.status(200).json({
                success: true,
                data: data,
                count: data.length,
                message: 'Financial assistance report retrieved successfully'
            });
        } catch (error) {
            console.error('Error in getFinancialAssistance:', error);
            res.status(500).json({
                success: false,
                message: 'Error retrieving financial assistance report',
                error: error.message
            });
        }
    }

    // Get Food Assistance Report
    static async getFoodAssistance(req, res) {
        try {
            const centerId = req.center_id; // Set by filterMiddleware
            const data = await ReportsModel.getFoodAssistance(centerId);
            
            res.status(200).json({
                success: true,
                data: data,
                count: data.length,
                message: 'Food assistance report retrieved successfully'
            });
        } catch (error) {
            console.error('Error in getFoodAssistance:', error);
            res.status(500).json({
                success: false,
                message: 'Error retrieving food assistance report',
                error: error.message
            });
        }
    }

    // Get Home Visits Report
    static async getHomeVisits(req, res) {
        try {
            const centerId = req.center_id; // Set by filterMiddleware
            const data = await ReportsModel.getHomeVisits(centerId);
            
            res.status(200).json({
                success: true,
                data: data,
                count: data.length,
                message: 'Home visits report retrieved successfully'
            });
        } catch (error) {
            console.error('Error in getHomeVisits:', error);
            res.status(500).json({
                success: false,
                message: 'Error retrieving home visits report',
                error: error.message
            });
        }
    }

    // Get Relationship Report
    static async getRelationshipReport(req, res) {
        try {
            const centerId = req.center_id; // Set by filterMiddleware
            const data = await ReportsModel.getRelationshipReport(centerId);
            
            res.status(200).json({
                success: true,
                data: data,
                count: data.length,
                message: 'Relationship report retrieved successfully'
            });
        } catch (error) {
            console.error('Error in getRelationshipReport:', error);
            res.status(500).json({
                success: false,
                message: 'Error retrieving relationship report',
                error: error.message
            });
        }
    }

    // Get Applicant Programs Report
    static async getApplicantPrograms(req, res) {
        try {
            const centerId = req.center_id; // Set by filterMiddleware
            const data = await ReportsModel.getApplicantPrograms(centerId);
            
            res.status(200).json({
                success: true,
                data: data,
                count: data.length,
                message: 'Applicant programs report retrieved successfully'
            });
        } catch (error) {
            console.error('Error in getApplicantPrograms:', error);
            res.status(500).json({
                success: false,
                message: 'Error retrieving applicant programs report',
                error: error.message
            });
        }
    }

    // Get Financial Assessment Report
    static async getFinancialAssessment(req, res) {
        try {
            const centerId = req.center_id; // Set by filterMiddleware
            const data = await ReportsModel.getFinancialAssessment(centerId);
            
            res.status(200).json({
                success: true,
                data: data,
                count: data.length,
                message: 'Financial assessment report retrieved successfully'
            });
        } catch (error) {
            console.error('Error in getFinancialAssessment:', error);
            res.status(500).json({
                success: false,
                message: 'Error retrieving financial assessment report',
                error: error.message
            });
        }
    }

    // Get Skills Matrix Report
    static async getSkillsMatrix(req, res) {
        try {
            const centerId = req.center_id; // Set by filterMiddleware
            const data = await ReportsModel.getSkillsMatrix(centerId);
            
            res.status(200).json({
                success: true,
                data: data,
                count: data.length,
                message: 'Skills matrix report retrieved successfully'
            });
        } catch (error) {
            console.error('Error in getSkillsMatrix:', error);
            res.status(500).json({
                success: false,
                message: 'Error retrieving skills matrix report',
                error: error.message
            });
        }
    }
}

module.exports = ReportsController;
