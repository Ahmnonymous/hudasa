// middlewares/roleMiddleware.js
// RBAC middleware to enforce role-based access control
// 
// ✅ CORRECTED Role IDs:
// 1 = App Admin (SuperAdmin) - Global access, all centers, all operations
// 2 = HQ - Multi-center access, all operations except center management
// 3 = Org Admin - Full CRUD within own center
// 4 = Org Executives - READ-ONLY within own center
// 5 = Org Caseworkers - CRUD Applicants & Tasks only within own center

const { ROLES, ROLE_DEFINITIONS, canAccessRoute, canPerformMethod, getModuleFromRoute } = require('../constants/rbacMatrix');

module.exports = (roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ msg: "Not authenticated" });
    }

    const userType = parseInt(req.user.user_type);
    const method = req.method;
    // ✅ Fix Issue #4: Check both baseUrl and originalUrl to catch dashboard routes
    const routePath = req.baseUrl || req.path || req.originalUrl || '';
    const pathCheck = String(req.originalUrl || req.baseUrl || req.url || routePath || '').toLowerCase();
    
    // Convert roles array to integers for comparison
    const allowedRoles = roles.map(r => parseInt(r));
    
    // ✅ Fix Issue #4: Early check for dashboard routes for caseworkers
    if (userType === ROLES.ORG_CASEWORKER) {
      if (pathCheck.includes('dashboard')) {
        return next(); // Allow dashboard access for caseworkers
      }
      // ✅ Allow lookup APIs for all user types (they're reference data)
      // Check for 'lookup' anywhere in the path (e.g., /api/lookup/Gender, /lookup/Gender)
      // Must check BEFORE the allowedRoles check to bypass role restriction
      if (pathCheck.includes('lookup')) {
        return next(); // Allow lookup APIs for caseworkers (bypass role check entirely)
      }
      // ✅ Allow employee GET requests for dropdowns (e.g., "Assisted By", "Communicated By")
      // Caseworkers need employee data for applicant forms
      if (pathCheck.includes('/employee') && method === 'GET') {
        return next(); // Allow GET employee requests for caseworkers (bypass role check for GET)
      }
      // ✅ Allow training institutions GET requests for dropdowns (e.g., "Training Provider")
      // Caseworkers need training institution data for applicant Programs tab
      if ((pathCheck.includes('traininginstitution') || pathCheck.includes('training_institution')) && method === 'GET') {
        return next(); // Allow GET training institution requests for caseworkers
      }
      // ✅ Allow all Madressa-related modules (madressa/madressah/parent-questionnaire)
      if (pathCheck.includes('madressa') || pathCheck.includes('madressah') || pathCheck.includes('parent-questionnaire') || pathCheck.includes('policyandprocedure') || pathCheck.includes('policy_and_procedure')) {
        return next();
      }
      // ✅ Allow folders and conversations for caseworkers (if role is allowed)
      if ((pathCheck.includes('/folders') || pathCheck.includes('/conversations') || 
           pathCheck.includes('/personalfiles') || pathCheck.includes('/messages')) && allowedRoles.includes(userType)) {
        return next(); // Allow folders, files, conversations, and messages for caseworkers
      }
    }
    
    // ✅ App Admin (role 1) bypasses ALL restrictions
    if (userType === ROLES.APP_ADMIN) {
      return next();
    }
    
    // Check if user's role is in the allowed list
    if (!allowedRoles.includes(userType)) {
      return res.status(403).json({ 
        msg: "Forbidden: insufficient rights",
        required_roles: allowedRoles,
        your_role: userType,
        role_name: ROLE_DEFINITIONS[userType]?.label || 'Unknown'
      });
    }

    // ✅ Org Executives (role 4) - READ-ONLY enforcement (except File Manager and Chat)
    if (userType === ROLES.ORG_EXECUTIVE) {
      const pathCheck = String(req.originalUrl || req.baseUrl || req.url || routePath || '').toLowerCase();
      // Allow full CRUD for File Manager and Chat
      const isFileManager = pathCheck.includes('/folders') || pathCheck.includes('/personalfiles');
      const isChat = pathCheck.includes('/conversations') || pathCheck.includes('/messages');
      // Allow full CRUD for Lookups (APIs)
      const isLookup = pathCheck.includes('/lookup');
      
      // If it's File Manager, Chat, or Lookup, allow all methods
      if (!isFileManager && !isChat && !isLookup) {
        // For all other modules, enforce read-only (GET only)
        if (!canPerformMethod(userType, method)) {
          return res.status(403).json({ 
            msg: "Forbidden: Executives have view-only access",
            your_role: userType,
            role_name: "Org Executive",
            allowed_methods: ["GET"],
            attempted_method: method
          });
        }
      }
    }

    // ✅ Org Caseworkers (role 5) - Module restriction enforcement
    if (userType === ROLES.ORG_CASEWORKER) {
      // Dashboard check already handled in early check above
      // Double-check dashboard here as well (defensive)
      const pathCheck = String(req.originalUrl || req.baseUrl || req.url || routePath || '').toLowerCase();
      if (pathCheck.includes('dashboard')) {
        return next(); // Allow dashboard
      }
      
      // ✅ Allow lookup APIs for all user types (they're reference data)
      // Check for both '/lookup' and 'lookup' (with or without leading slash, with or without /api prefix)
      if (pathCheck.includes('lookup') || pathCheck.includes('/lookup/')) {
        return next(); // Allow lookup APIs
      }
      
      // ✅ Allow employee GET requests for dropdowns (e.g., "Assisted By", "Communicated By")
      // Caseworkers need employee data for applicant forms
      if (pathCheck.includes('/employee') && method === 'GET') {
        return next(); // Allow GET employee requests for caseworkers
      }
      
      // ✅ Allow training institutions GET requests for dropdowns (e.g., "Training Provider")
      // Caseworkers need training institution data for applicant Programs tab
      if ((pathCheck.includes('traininginstitution') || pathCheck.includes('training_institution')) && method === 'GET') {
        return next(); // Allow GET training institution requests for caseworkers
      }
      // ✅ Allow all Madressa-related modules (madressa/madressah/parent-questionnaire)
      if (pathCheck.includes('madressa') || pathCheck.includes('madressah') || pathCheck.includes('parent-questionnaire') || pathCheck.includes('policyandprocedure') || pathCheck.includes('policy_and_procedure')) {
        return next();
      }
      
      // ✅ Allow folders and conversations (File Manager and Chat)
      if (pathCheck.includes('/folders') || pathCheck.includes('/personalfiles') || 
          pathCheck.includes('/conversations') || pathCheck.includes('/messages')) {
        return next(); // Allow File Manager and Chat
      }
      
      // For all other routes, check module access
      if (!canAccessRoute(userType, routePath)) {
        return res.status(403).json({ 
          msg: "Forbidden: Caseworkers can only access Applicants, Tasks, File Manager, Chat, and Lookup APIs",
          your_role: userType,
          role_name: "Org Caseworker",
          allowed_modules: ROLE_DEFINITIONS[5].allowed_modules,
          attempted_route: routePath
        });
      }
    }

    // ✅ HQ (role 2) - Cannot access Center_Detail management
    if (userType === ROLES.HQ) {
      const module = getModuleFromRoute(routePath);
      if (module === "Center_Detail" && method !== "GET") {
        return res.status(403).json({ 
          msg: "Forbidden: HQ cannot manage organizations (add/edit centers)",
          your_role: userType,
          role_name: "HQ"
        });
      }
    }

    next();
  };
};
