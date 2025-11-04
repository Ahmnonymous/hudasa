/**
 * Test Configuration
 * Defines test users, roles, and API endpoints for sanity testing
 */

module.exports = {
  // Test environments
  environments: {
    staging: {
      name: "Staging",
      baseURL: process.env.VITE_API_URL || "http://localhost:5000/api",
      description: "Test/staging environment"
    },
    production: {
      name: "Production",
      baseURL: process.env.PROD_API_URL || "/api", // Use same-origin in prod
      description: "Production/live environment"
    }
  },

  // Test users from schema.sql (password: '12345' before hashing)
  testUsers: [
    {
      id: 1,
      username: "admin",
      password: "12345",
      role: 1, // App Admin
      roleName: "App Admin",
      center_id: null, // No center restriction
      expectedAccess: {
        dashboard: true,
        applicants: true,
        employees: true,
        suppliers: true,
        inventory: true,
        centers: true,
        meetings: true,
        reports: true,
        lookups: true,
        chat: true,
        fileManager: true
      }
    },
    {
      id: 2,
      username: "hquser",
      password: "12345",
      role: 2, // HQ
      roleName: "HQ",
      center_id: 1,
      expectedAccess: {
        dashboard: true,
        applicants: true,
        employees: true,
        suppliers: true,
        inventory: true,
        centers: false, // HQ cannot manage centers
        meetings: true,
        reports: true,
        lookups: true,
        chat: true,
        fileManager: true
      }
    },
    {
      id: 3,
      username: "orgadmin",
      password: "12345",
      role: 3, // Org Admin
      roleName: "Org Admin",
      center_id: 1,
      expectedAccess: {
        dashboard: true,
        applicants: true,
        employees: true,
        suppliers: true,
        inventory: true,
        centers: false,
        meetings: true,
        reports: true,
        lookups: true,
        chat: true,
        fileManager: true
      }
    },
    {
      id: 4,
      username: "orgexeuser",
      password: "12345",
      role: 4, // Org Executive
      roleName: "Org Executive",
      center_id: 1,
      expectedAccess: {
        dashboard: true,
        applicants: true, // READ-ONLY
        employees: true, // READ-ONLY
        suppliers: true, // READ-ONLY
        inventory: true, // READ-ONLY
        centers: false,
        meetings: false,
        reports: true, // READ-ONLY
        lookups: true, // READ-ONLY
        chat: true,
        fileManager: true
      },
      readOnly: true
    },
    {
      id: 5,
      username: "orgcaseuser",
      password: "12345",
      role: 5, // Org Caseworker
      roleName: "Org Caseworker",
      center_id: 1,
      expectedAccess: {
        dashboard: true,
        applicants: true, // CRUD
        employees: false,
        suppliers: false,
        inventory: false,
        centers: false,
        meetings: false,
        reports: false,
        lookups: true, // READ-ONLY lookup tables
        chat: true,
        fileManager: true
      }
    }
  ],

  // API endpoints to test
  apiEndpoints: {
    auth: {
      login: "/auth/login",
      logout: "/auth/logout" // if exists
    },
    dashboard: {
      applicantStatistics: "/dashboard/applicant-statistics"
    },
    applicants: {
      list: "/applicantDetails",
      create: "/applicantDetails",
      update: "/applicantDetails/:id",
      delete: "/applicantDetails/:id"
    },
    employees: {
      list: "/employee",
      create: "/employee",
      update: "/employee/:id",
      delete: "/employee/:id"
    },
    suppliers: {
      list: "/supplierProfile",
      create: "/supplierProfile",
      update: "/supplierProfile/:id",
      delete: "/supplierProfile/:id"
    },
    inventory: {
      items: "/inventoryItems",
      transactions: "/inventoryTransactions"
    },
    lookups: {
      list: "/lookup/:tableName",
      common: ["Gender", "Nationality", "Race", "Suburb", "Education_Level"]
    },
    chat: {
      conversations: "/conversations",
      messages: "/messages"
    },
    files: {
      folders: "/folders",
      files: "/personalFiles"
    },
    reports: {
      applicantDetails: "/reports/applicant-details",
      financialAssistance: "/reports/financial-assistance"
    },
    madressa: {
      applications: {
        list: "/madressaApplication",
        create: "/madressaApplication",
        update: "/madressaApplication/:id",
        delete: "/madressaApplication/:id",
        getByRelationship: "/madressaApplication/relationship/:relationshipId"
      },
      academicResults: {
        list: "/academicResults",
        create: "/academicResults",
        update: "/academicResults/:id",
        delete: "/academicResults/:id",
        getByAppId: "/academicResults/madressah-app/:madressahAppId"
      },
      islamicResults: {
        list: "/islamicResults",
        create: "/islamicResults",
        update: "/islamicResults/:id",
        delete: "/islamicResults/:id",
        getByAppId: "/islamicResults/madressah-app/:madressahAppId"
      },
      conductAssessment: {
        list: "/conductAssessment",
        create: "/conductAssessment",
        update: "/conductAssessment/:id",
        delete: "/conductAssessment/:id",
        getByAppId: "/conductAssessment/madressah-app/:madressahAppId"
      },
      survey: {
        list: "/survey",
        create: "/survey",
        update: "/survey/:id",
        delete: "/survey/:id",
        getByAppId: "/survey/madressah-app/:madressahAppId"
      }
    }
  },

  // Frontend routes to test
  frontendRoutes: {
    dashboard: "/dashboard",
    applicants: "/applicants",
    employees: "/employees/profile/1",
    suppliers: "/suppliers",
    inventory: "/inventory",
    centers: "/centers",
    meetings: "/meetings",
    reports: "/reports/applicant-details",
    lookups: "/lookups",
    chat: "/chat",
    fileManager: "/FileManager",
    madressa: "/madressa"
  },

  // Expected response codes
  expectedCodes: {
    success: 200,
    created: 201,
    noContent: 204,
    badRequest: 400,
    unauthorized: 401,
    forbidden: 403,
    notFound: 404,
    serverError: 500
  },

  // Test timeout (ms)
  testTimeout: 30000,

  // HAR capture settings
  captureHAR: true,
  harOutputDir: "./test-results/har-files"
};

