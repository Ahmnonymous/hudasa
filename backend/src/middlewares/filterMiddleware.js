// middlewares/filterMiddleware.js
// Automatically injects center_id from authenticated user into request context
// This ensures tenant isolation across all routes
//
// ✅ CORRECTED Role IDs:
// 1 = App Admin (SuperAdmin) - No center filter, global access
// 2 = HQ (multi-center access for data viewing, but dashboard filtered by assigned center)
// 3 = Org Admin - Center-specific access
// 4 = Org Executives - Center-specific access (read-only)
// 5 = Org Caseworkers - Center-specific access (limited modules)
//
// Dashboard Access Rules:
// - App Admin: Global dashboards (no center filter)
// - HQ: Dashboard for their assigned center only
// - Center-Based Roles: Dashboard for their own center only

const { ROLES } = require('../constants/rbacMatrix');

module.exports = (req, res, next) => {
  try {
    if (req.user) {
      const userType = parseInt(req.user.user_type);
      
      // ✅ App Admin (user_type 1) has NULL center_id and can access all centers
      req.isSuperAdmin = userType === ROLES.APP_ADMIN; // Role 1
      req.isAppAdmin = userType === ROLES.APP_ADMIN;   // Role 1
      req.isHQ = userType === ROLES.HQ;                // Role 2
      // ✅ Only App Admin gets isMultiCenter = true (bypasses center filtering)
      // ✅ HQ (role 2) should be filtered by their center_id (NOT multi-center)
      req.isMultiCenter = userType === ROLES.APP_ADMIN; // Only App Admin (role 1), NOT HQ
      
      // ✅ Center ID assignment:
      // - App Admin: NULL (no center filter - global access)
      // - HQ: Their assigned center_id (filtered by their own center - NOT global)
      // - Center-Based Roles: Their center_id (filtered by their own center)
      if (req.isSuperAdmin) {
        req.center_id = null; // App Admin explicitly has no center (global access)
      } else if (req.user.center_id !== null && req.user.center_id !== undefined) {
        // ✅ Normalize center_id to integer or null
        // ✅ HQ and other roles get their center_id (will be filtered)
        const centerIdValue = parseInt(req.user.center_id);
        req.center_id = isNaN(centerIdValue) ? null : centerIdValue;
      } else {
        req.center_id = null; // Explicitly set to null if not provided
      }
      
      // Log tenant context for debugging (remove in production)
      // console.log(`🔒 Tenant Filter: user=${req.user.username}, center=${req.center_id}, admin=${req.isSuperAdmin}, hq=${req.isHQ}`);
    }
    
    next();
  } catch (err) {
    console.error("❌ Filter middleware error:", err.message);
    next();
  }
};

