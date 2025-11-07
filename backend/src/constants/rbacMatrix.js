/**
 * RBAC Matrix - Centralized Role-Based Access Control Definitions
 * 
 * Role Hierarchy:
 * 1 = App Admin (SuperAdmin) - Global access, all centers, all operations
 * 2 = HQ - Multi-center access, all operations except center management
 * 3 = Org Admin - Full CRUD within own center
 * 4 = Org Executives - READ-ONLY within own center
 * 5 = Org Caseworkers - CRUD for Applicants & Tasks only within own center
 */

const ROLES = {
  APP_ADMIN: 1,
  HQ: 2,
  ORG_ADMIN: 3,
  ORG_EXECUTIVE: 4,
  ORG_CASEWORKER: 5,
};

const ROLE_DEFINITIONS = {
  1: {
    id: 1,
    name: "App Admin",
    label: "App Admin",
    access: "global",
    center_restriction: false,
    allowed_methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
    allowed_modules: "all",
    description: "Super Admin - full access to all centers and all operations",
  },
  2: {
    id: 2,
    name: "HQ",
    label: "HQ",
    access: "multi-center", // Can view data across centers, but dashboard shows only their assigned center
    center_restriction: false,
    allowed_methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
    allowed_modules: "all_except_centers",
    restricted_modules: ["Center_Detail"], // Cannot add/edit organizations
    description: "HQ - Access to all data except organization management. Dashboard filtered by assigned center.",
  },
  3: {
    id: 3,
    name: "Org Admin",
    label: "Org Admin",
    access: "center-only",
    center_restriction: true,
    allowed_methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
    allowed_modules: "all",
    description: "Organization Admin - Full CRUD within own center",
  },
  4: {
    id: 4,
    name: "Org Executive",
    label: "Org Executives",
    access: "center-only",
    center_restriction: true,
    allowed_methods: ["GET"], // READ-ONLY
    allowed_modules: "all",
    description: "Organization Executive - View-only access within own center",
  },
  5: {
    id: 5,
    name: "Org Caseworker",
    label: "Org Caseworkers",
    access: "center-only",
    center_restriction: true,
    allowed_methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
    allowed_modules: ["Dashboard", "Applicant_Details", "Tasks", "Comments", "Relationships", "Home_Visit", "Financial_Assistance", "Food_Assistance", "Attachments", "Programs", "Financial_Assessment", "Applicant_Income", "Applicant_Expense", "Madressa_Application", "Madressah_Application", "Conduct_Assessment", "Islamic_Results", "Academic_Results", "Parent_Questionnaire", "Policy_and_Procedure", "Folders", "Conversations"], // ✅ Added Folders, Conversations, Madressa Application, Conduct/Islamic/Academic Results, Parent Questionnaire, Policy & Procedure for caseworker access
    description: "Caseworker - CRUD for Applicants and Tasks only within own center, plus access to Folders and Conversations",
  },
};

/**
 * Module to route mapping
 * Maps database tables/modules to API route prefixes
 */
const MODULE_ROUTE_MAP = {
  "Applicant_Details": "/api/applicantDetails",
  "Tasks": "/api/tasks",
  "Comments": "/api/comments",
  "Relationships": "/api/relationships",
  "Home_Visit": "/api/homeVisit",
  "Financial_Assistance": "/api/financialAssistance",
  "Food_Assistance": "/api/foodAssistance",
  "Attachments": "/api/attachments",
  "Programs": "/api/programs",
  "Financial_Assessment": "/api/financialAssessment",
  "Applicant_Income": "/api/applicantIncome",
  "Applicant_Expense": "/api/applicantExpense",
  "Employee": "/api/employee",
  "Inventory_Items": "/api/inventoryItems",
  "Inventory_Transactions": "/api/inventoryTransactions",
  "Supplier_Profile": "/api/supplierProfile",
  "Center_Detail": "/api/centerDetail",
  "Dashboard": "/api/dashboard", // ✅ Fix Issue #4: Add Dashboard to module map
  "Folders": "/api/folders", // ✅ Added for caseworker access
  "Conversations": "/api/conversations", // ✅ Added for caseworker access
  "Madressa_Application": "/api/madressaApplication", // ✅ Allow Madressa applications routing
  "Conduct_Assessment": "/api/conductAssessment", // ✅ Allow Conduct Assessment routing
  "Islamic_Results": "/api/islamicResults", // ✅ Allow Islamic Results routing
  "Academic_Results": "/api/academicResults", // ✅ Allow Academic Results routing
  "Parent_Questionnaire": "/api/parent-questionnaire", // ✅ Allow Parent Questionnaire routing
  "Policy_and_Procedure": "/api/policyAndProcedure", // ✅ Allow Policy & Procedure routing
  "Lookup": "/api/lookup", // ✅ Added for Org Executive lookup access
};

/**
 * Get route module name from path
 */
function getModuleFromRoute(routePath) {
  const normalized = routePath.replace('/api/', '');
  const module = Object.keys(MODULE_ROUTE_MAP).find(key => 
    MODULE_ROUTE_MAP[key].includes(normalized)
  );
  return module || normalized;
}

/**
 * Check if user role can access route
 */
function canAccessRoute(userType, routePath) {
  const role = ROLE_DEFINITIONS[userType];
  if (!role) return false;
  
  // App Admin has global access
  if (userType === ROLES.APP_ADMIN) return true;
  
  const module = getModuleFromRoute(routePath);
  
  // ✅ Allow lookup routes for all authenticated users (they're global tables)
  if (routePath && (routePath.includes('/lookup') || module === "Lookup" || module === "lookup")) {
    return true;
  }
  
  // HQ cannot access Center_Detail
  if (userType === ROLES.HQ && module === "Center_Detail") {
    return false;
  }
  
  // Caseworkers only access specific modules
  if (userType === ROLES.ORG_CASEWORKER) {
    // ✅ Fix Issue #4: Allow Dashboard for caseworkers
    if (module === "Dashboard" || module === "dashboard") {
      return true;
    }
    // ✅ Allow Folders and Conversations for caseworkers
    if (module === "Folders" || module === "folders" || routePath.includes('/folders')) {
      return true;
    }
    if (module === "Conversations" || module === "conversations" || routePath.includes('/conversations')) {
      return true;
    }
    return role.allowed_modules.includes(module);
  }
  
  // ✅ Org Executive (role 4) should have access to all modules for read-only (GET requests)
  // The method check (GET only) is handled by canPerformMethod, so allow all modules here
  if (userType === ROLES.ORG_EXECUTIVE) {
    return true; // Org Executive can access all modules (read-only enforced by canPerformMethod)
  }
  
  return true;
}

/**
 * Check if user role can perform HTTP method
 */
function canPerformMethod(userType, method) {
  const role = ROLE_DEFINITIONS[userType];
  if (!role) return false;
  
  return role.allowed_methods.includes(method.toUpperCase());
}

/**
 * Check if user needs center restriction
 */
function needsCenterRestriction(userType) {
  const role = ROLE_DEFINITIONS[userType];
  if (!role) return true; // Default to restricted
  
  return role.center_restriction;
}

module.exports = {
  ROLES,
  ROLE_DEFINITIONS,
  MODULE_ROUTE_MAP,
  getModuleFromRoute,
  canAccessRoute,
  canPerformMethod,
  needsCenterRestriction,
};

