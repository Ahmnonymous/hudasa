/**
 * Madressa Module QA Test Suite
 * Comprehensive testing for all Madressa module endpoints
 * 
 * Tests:
 * - MadressaApplication CRUD operations
 * - AcademicResults CRUD operations
 * - IslamicResults CRUD operations
 * - ConductAssessment CRUD operations
 * - Survey CRUD operations
 * - RBAC (Role-Based Access Control)
 * - Tenant Isolation (center_id filtering)
 * - Data validation and error handling
 * - File uploads (for AcademicResults and IslamicResults)
 * - Relationships between entities
 * 
 * Roles Tested: App Admin (1), HQ (2), Org Admin (3), Org Executive (4), Org Caseworker (5)
 */

const axios = require('axios');
const fs = require('fs').promises;
const path = require('path');
const FormData = require('form-data');
const testConfig = require('./test-config');

class MadressaQATest {
  constructor(environment = 'staging') {
    this.env = testConfig.environments[environment];
    this.baseURL = this.env.baseURL;
    this.tokens = {};
    this.testData = {
      madressaApplications: [],
      academicResults: [],
      islamicResults: [],
      conductAssessments: [],
      surveys: [],
      relationships: [] // Store relationship IDs for linking applications
    };
    
    this.results = {
      environment: environment,
      timestamp: new Date().toISOString(),
      tests: [],
      summary: {
        total: 0,
        passed: 0,
        failed: 0,
        errors: [],
        warnings: []
      }
    };
  }

  /**
   * Login as a user and store token
   */
  async login(user) {
    try {
      const response = await axios.post(
        `${this.baseURL}/auth/login`,
        {
          username: user.username,
          password: user.password
        },
        {
          headers: { 'Content-Type': 'application/json' }
        }
      );

      if (response.data && response.data.token) {
        this.tokens[user.username] = response.data.token;
        return { 
          success: true, 
          token: response.data.token,
          userInfo: response.data.userInfo || response.data.user
        };
      }
      return { success: false, error: 'No token in response' };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || error.message
      };
    }
  }

  /**
   * Make authenticated API request
   */
  async makeRequest(method, path, token, data = null, isFormData = false) {
    try {
      const config = {
        method: method.toLowerCase(),
        url: `${this.baseURL}${path}`,
        headers: {
          'Authorization': `Bearer ${token}`
        },
        validateStatus: () => true // Don't throw on non-2xx status
      };

      if (isFormData && data instanceof FormData) {
        // For FormData, let axios handle the headers (including boundary)
        config.headers = {
          ...config.headers,
          ...data.getHeaders() // This sets Content-Type with boundary
        };
        config.data = data;
      } else {
        config.headers['Content-Type'] = 'application/json';
        if (data && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
          config.data = data;
        }
      }

      const response = await axios(config);
      return {
        success: response.status >= 200 && response.status < 300,
        status: response.status,
        data: response.data,
        error: response.status >= 300 ? response.data : null
      };
    } catch (error) {
      return {
        success: false,
        status: error.response?.status || 500,
        error: error.response?.data || error.message,
        data: null
      };
    }
  }

  /**
   * Record test result
   */
  recordTest(testResult) {
    this.results.tests.push(testResult);
    this.results.summary.total++;
    if (testResult.passed) {
      this.results.summary.passed++;
      console.log(`✅ ${testResult.test}`);
    } else {
      this.results.summary.failed++;
      console.log(`❌ ${testResult.test}`);
      if (testResult.error) {
        console.log(`   Error: ${JSON.stringify(testResult.error)}`);
        this.results.summary.errors.push(`${testResult.test}: ${JSON.stringify(testResult.error)}`);
      }
    }
  }

  /**
   * Test MadressaApplication endpoints
   */
  async testMadressaApplication(user) {
    const token = this.tokens[user.username];
    const isReadOnly = user.readOnly || false;
    
    console.log(`\n📚 Testing MadressaApplication endpoints for ${user.roleName}...`);

    // Caseworkers (role 5) are not allowed to access Madressa endpoints
    const isCaseworker = user.role === 5;
    if (isCaseworker) {
      // Test GET all - should be blocked (403)
      const getAllResult = await this.makeRequest('GET', '/madressaApplication', token);
      this.recordTest({
        test: `MadressaApplication - GET all (${user.roleName}) - RBAC Blocked`,
        user: user.username,
        passed: !getAllResult.success && getAllResult.status === 403,
        status: getAllResult.status,
        error: getAllResult.error,
        note: 'Caseworkers correctly blocked from Madressa endpoints'
      });
      return; // Skip all other tests for Caseworkers
    }

    // Get a relationship ID first (required for creating applications)
    let relationshipId = null;
    let relationshipCenterId = null;
    try {
      const relResponse = await this.makeRequest('GET', '/relationships', token);
      if (relResponse.success && relResponse.data && relResponse.data.length > 0) {
        relationshipId = relResponse.data[0].id;
        relationshipCenterId = relResponse.data[0].center_id;
      }
    } catch (error) {
      console.warn(`⚠️  Could not fetch relationship ID: ${error.message}`);
    }

    // Test GET all
    const getAllResult = await this.makeRequest('GET', '/madressaApplication', token);
    this.recordTest({
      test: `MadressaApplication - GET all (${user.roleName})`,
      user: user.username,
      passed: getAllResult.success && getAllResult.status === 200,
      status: getAllResult.status,
      error: getAllResult.error,
      data: getAllResult.success ? `${getAllResult.data?.length || 0} records` : null
    });

    let createdAppId = null;

    if (!isReadOnly && relationshipId) {
      // Test CREATE
      const createData = {
        applicant_relationship_id: relationshipId,
        chronic_condition: 'None',
        blood_type: 'O+',
        family_doctor: `Dr. Test`,
        contact_details: '123-456-7890'
      };
      
      // App Admin must provide center_id (get it from the relationship)
      if (user.role === 1 && relationshipCenterId) {
        createData.center_id = relationshipCenterId;
      }

      const createResult = await this.makeRequest('POST', '/madressaApplication', token, createData);
      this.recordTest({
        test: `MadressaApplication - CREATE (${user.roleName})`,
        user: user.username,
        passed: createResult.success && createResult.status === 201,
        status: createResult.status,
        error: createResult.error,
        data: createResult.success ? createResult.data : null
      });

      if (createResult.success && createResult.data) {
        createdAppId = createResult.data.id;
        this.testData.madressaApplications.push(createdAppId);

        // Test GET by ID
        const getByIdResult = await this.makeRequest('GET', `/madressaApplication/${createdAppId}`, token);
        this.recordTest({
          test: `MadressaApplication - GET by ID (${user.roleName})`,
          user: user.username,
          passed: getByIdResult.success && getByIdResult.status === 200,
          status: getByIdResult.status,
          error: getByIdResult.error
        });

        // Test GET by Relationship ID
        const getByRelResult = await this.makeRequest('GET', `/madressaApplication/relationship/${relationshipId}`, token);
        this.recordTest({
          test: `MadressaApplication - GET by Relationship ID (${user.roleName})`,
          user: user.username,
          passed: getByRelResult.success && getByRelResult.status === 200,
          status: getByRelResult.status,
          error: getByRelResult.error
        });

        // Test UPDATE
        const updateData = {
          chronic_condition: 'Updated condition',
          blood_type: 'A+'
        };
        const updateResult = await this.makeRequest('PUT', `/madressaApplication/${createdAppId}`, token, updateData);
        this.recordTest({
          test: `MadressaApplication - UPDATE (${user.roleName})`,
          user: user.username,
          passed: updateResult.success && updateResult.status === 200,
          status: updateResult.status,
          error: updateResult.error
        });

        // Test DELETE
        const deleteResult = await this.makeRequest('DELETE', `/madressaApplication/${createdAppId}`, token);
        this.recordTest({
          test: `MadressaApplication - DELETE (${user.roleName})`,
          user: user.username,
          passed: deleteResult.success && (deleteResult.status === 200 || deleteResult.status === 204),
          status: deleteResult.status,
          error: deleteResult.error
        });
      }
    } else if (isReadOnly) {
      console.log(`⏭️  Skipping CREATE/UPDATE/DELETE for read-only user ${user.username}`);
    }
  }

  /**
   * Test AcademicResults endpoints
   */
  async testAcademicResults(user, madressahAppId = null) {
    const token = this.tokens[user.username];
    const isReadOnly = user.readOnly || false;
    
    // Caseworkers (role 5) are not allowed to access Madressa endpoints
    if (user.role === 5) {
      return; // Skip all tests for Caseworkers
    }
    
    console.log(`\n📖 Testing AcademicResults endpoints for ${user.roleName}...`);

    // If no app ID provided, try to get one
    if (!madressahAppId) {
      const appResponse = await this.makeRequest('GET', '/madressaApplication', token);
      if (appResponse.success && appResponse.data && appResponse.data.length > 0) {
        madressahAppId = appResponse.data[0].id;
      } else {
        console.warn(`⚠️  No MadressaApplication found, skipping AcademicResults CREATE/UPDATE/DELETE tests`);
        // Still test GET endpoints
        const getAllResult = await this.makeRequest('GET', '/academicResults', token);
        this.recordTest({
          test: `AcademicResults - GET all (${user.roleName})`,
          user: user.username,
          passed: getAllResult.success && getAllResult.status === 200,
          status: getAllResult.status,
          error: getAllResult.error
        });
        return;
      }
    }

    // Test GET all
    const getAllResult = await this.makeRequest('GET', '/academicResults', token);
    this.recordTest({
      test: `AcademicResults - GET all (${user.roleName})`,
      user: user.username,
      passed: getAllResult.success && getAllResult.status === 200,
      status: getAllResult.status,
      error: getAllResult.error
    });

    // Test GET by Madressah App ID
    const getByAppResult = await this.makeRequest('GET', `/academicResults/madressah-app/${madressahAppId}`, token);
    this.recordTest({
      test: `AcademicResults - GET by Madressah App ID (${user.roleName})`,
      user: user.username,
      passed: getByAppResult.success && getByAppResult.status === 200,
      status: getByAppResult.status,
      error: getByAppResult.error
    });

    if (!isReadOnly && madressahAppId) {
      // Test CREATE with FormData (file upload)
      const formData = new FormData();
      // Ensure madressah_app_id is properly set as a string
      if (madressahAppId) {
        formData.append('madressah_app_id', String(madressahAppId));
      } else {
        console.warn(`⚠️  Cannot create AcademicResults - madressahAppId is null`);
        return;
      }
      formData.append('school', 'Test School');
      formData.append('grade', 'Grade 7');
      formData.append('term', 'Term 1');
      formData.append('subject1', 'A');
      formData.append('subject1name', 'Mathematics');
      formData.append('days_absent', '2');
      formData.append('comments', 'Test academic results');

      const createResult = await this.makeRequest('POST', '/academicResults', token, formData, true);
      this.recordTest({
        test: `AcademicResults - CREATE (${user.roleName})`,
        user: user.username,
        passed: createResult.success && createResult.status === 201,
        status: createResult.status,
        error: createResult.error,
        data: createResult.success ? createResult.data : null
      });

      if (createResult.success && createResult.data) {
        const createdId = createResult.data.id;
        this.testData.academicResults.push(createdId);

        // Test GET by ID
        const getByIdResult = await this.makeRequest('GET', `/academicResults/${createdId}`, token);
        this.recordTest({
          test: `AcademicResults - GET by ID (${user.roleName})`,
          user: user.username,
          passed: getByIdResult.success && getByIdResult.status === 200,
          status: getByIdResult.status,
          error: getByIdResult.error
        });

        // Test UPDATE
        const updateFormData = new FormData();
        updateFormData.append('grade', 'Grade 8');
        updateFormData.append('days_absent', '3');

        const updateResult = await this.makeRequest('PUT', `/academicResults/${createdId}`, token, updateFormData, true);
        this.recordTest({
          test: `AcademicResults - UPDATE (${user.roleName})`,
          user: user.username,
          passed: updateResult.success && updateResult.status === 200,
          status: updateResult.status,
          error: updateResult.error
        });

        // Test DELETE
        const deleteResult = await this.makeRequest('DELETE', `/academicResults/${createdId}`, token);
        this.recordTest({
          test: `AcademicResults - DELETE (${user.roleName})`,
          user: user.username,
          passed: deleteResult.success && (deleteResult.status === 200 || deleteResult.status === 204),
          status: deleteResult.status,
          error: deleteResult.error
        });
      }
    }
  }

  /**
   * Test IslamicResults endpoints
   */
  async testIslamicResults(user, madressahAppId = null) {
    const token = this.tokens[user.username];
    const isReadOnly = user.readOnly || false;
    
    // Caseworkers (role 5) are not allowed to access Madressa endpoints
    if (user.role === 5) {
      return; // Skip all tests for Caseworkers
    }
    
    console.log(`\n🕌 Testing IslamicResults endpoints for ${user.roleName}...`);

    // If no app ID provided, try to get one
    if (!madressahAppId) {
      const appResponse = await this.makeRequest('GET', '/madressaApplication', token);
      if (appResponse.success && appResponse.data && appResponse.data.length > 0) {
        madressahAppId = appResponse.data[0].id;
      } else {
        console.warn(`⚠️  No MadressaApplication found, skipping IslamicResults CREATE/UPDATE/DELETE tests`);
        // Still test GET endpoints
        const getAllResult = await this.makeRequest('GET', '/islamicResults', token);
        this.recordTest({
          test: `IslamicResults - GET all (${user.roleName})`,
          user: user.username,
          passed: getAllResult.success && getAllResult.status === 200,
          status: getAllResult.status,
          error: getAllResult.error
        });
        return;
      }
    }

    // Test GET all
    const getAllResult = await this.makeRequest('GET', '/islamicResults', token);
    this.recordTest({
      test: `IslamicResults - GET all (${user.roleName})`,
      user: user.username,
      passed: getAllResult.success && getAllResult.status === 200,
      status: getAllResult.status,
      error: getAllResult.error
    });

    // Test GET by Madressah App ID
    const getByAppResult = await this.makeRequest('GET', `/islamicResults/madressah-app/${madressahAppId}`, token);
    this.recordTest({
      test: `IslamicResults - GET by Madressah App ID (${user.roleName})`,
      user: user.username,
      passed: getByAppResult.success && getByAppResult.status === 200,
      status: getByAppResult.status,
      error: getByAppResult.error
    });

    if (!isReadOnly && madressahAppId) {
      // Test CREATE with FormData
      const formData = new FormData();
      // Ensure madressah_app_id is properly set as a string
      if (madressahAppId) {
        formData.append('madressah_app_id', String(madressahAppId));
      } else {
        console.warn(`⚠️  Cannot create IslamicResults - madressahAppId is null`);
        return;
      }
      formData.append('grade', 'Grade 7');
      formData.append('term', 'Term 1');
      formData.append('subject1', 'A+');
      formData.append('subject1name', 'Quran');
      formData.append('days_absent', '1');
      formData.append('comments', 'Test Islamic results');

      const createResult = await this.makeRequest('POST', '/islamicResults', token, formData, true);
      this.recordTest({
        test: `IslamicResults - CREATE (${user.roleName})`,
        user: user.username,
        passed: createResult.success && createResult.status === 201,
        status: createResult.status,
        error: createResult.error
      });

      if (createResult.success && createResult.data) {
        const createdId = createResult.data.id;
        this.testData.islamicResults.push(createdId);

        // Test GET by ID
        const getByIdResult = await this.makeRequest('GET', `/islamicResults/${createdId}`, token);
        this.recordTest({
          test: `IslamicResults - GET by ID (${user.roleName})`,
          user: user.username,
          passed: getByIdResult.success && getByIdResult.status === 200,
          status: getByIdResult.status,
          error: getByIdResult.error
        });

        // Test UPDATE
        const updateFormData = new FormData();
        updateFormData.append('grade', 'Grade 8');

        const updateResult = await this.makeRequest('PUT', `/islamicResults/${createdId}`, token, updateFormData, true);
        this.recordTest({
          test: `IslamicResults - UPDATE (${user.roleName})`,
          user: user.username,
          passed: updateResult.success && updateResult.status === 200,
          status: updateResult.status,
          error: updateResult.error
        });

        // Test DELETE
        const deleteResult = await this.makeRequest('DELETE', `/islamicResults/${createdId}`, token);
        this.recordTest({
          test: `IslamicResults - DELETE (${user.roleName})`,
          user: user.username,
          passed: deleteResult.success && (deleteResult.status === 200 || deleteResult.status === 204),
          status: deleteResult.status,
          error: deleteResult.error
        });
      }
    }
  }

  /**
   * Test ConductAssessment endpoints
   */
  async testConductAssessment(user, madressahAppId = null) {
    const token = this.tokens[user.username];
    const isReadOnly = user.readOnly || false;
    
    // Caseworkers (role 5) are not allowed to access Madressa endpoints
    if (user.role === 5) {
      return; // Skip all tests for Caseworkers
    }
    
    console.log(`\n📝 Testing ConductAssessment endpoints for ${user.roleName}...`);

    // If no app ID provided, try to get one
    if (!madressahAppId) {
      const appResponse = await this.makeRequest('GET', '/madressaApplication', token);
      if (appResponse.success && appResponse.data && appResponse.data.length > 0) {
        madressahAppId = appResponse.data[0].id;
      } else {
        console.warn(`⚠️  No MadressaApplication found, skipping ConductAssessment tests`);
        return;
      }
    }

    // Test GET all
    const getAllResult = await this.makeRequest('GET', '/conductAssessment', token);
    this.recordTest({
      test: `ConductAssessment - GET all (${user.roleName})`,
      user: user.username,
      passed: getAllResult.success && getAllResult.status === 200,
      status: getAllResult.status,
      error: getAllResult.error
    });

    // Test GET by Madressah App ID
    const getByAppResult = await this.makeRequest('GET', `/conductAssessment/madressah-app/${madressahAppId}`, token);
    this.recordTest({
      test: `ConductAssessment - GET by Madressah App ID (${user.roleName})`,
      user: user.username,
      passed: getByAppResult.success && getByAppResult.status === 200,
      status: getByAppResult.status,
      error: getByAppResult.error
    });

    if (!isReadOnly && madressahAppId) {
      // Get center_id from the madressa application if available
      let centerId = user.center_id;
      if (!centerId || user.role === 1) {
        // For App Admin or if center_id is not set, try to get it from the application
        const appResponse = await this.makeRequest('GET', `/madressaApplication/${madressahAppId}`, token);
        if (appResponse.success && appResponse.data && appResponse.data.center_id) {
          centerId = appResponse.data.center_id;
        } else {
          // Fallback: try to get from relationships
          const relResponse = await this.makeRequest('GET', '/relationships', token);
          if (relResponse.success && relResponse.data && relResponse.data.length > 0) {
            centerId = relResponse.data[0].center_id || 1;
          } else {
            centerId = 1; // Final fallback
          }
        }
      }
      
      // Test CREATE
      const createData = {
        madressah_app_id: madressahAppId,
        center_id: centerId, // Ensure center_id is set
        question1: 'How is the student\'s behavior?',
        question2: 'Is the student respectful?',
        question3: 'Does the student attend regularly?',
        question4: 'How is the student\'s participation?',
        question5: 'Additional observations?',
        jumah: 'Regular',
        eid: 'Attended',
        inclination: 'Positive',
        comment_on_character: 'Student shows good character and dedication'
      };

      const createResult = await this.makeRequest('POST', '/conductAssessment', token, createData);
      this.recordTest({
        test: `ConductAssessment - CREATE (${user.roleName})`,
        user: user.username,
        passed: createResult.success && createResult.status === 201,
        status: createResult.status,
        error: createResult.error
      });

      if (createResult.success && createResult.data) {
        const createdId = createResult.data.id;
        this.testData.conductAssessments.push(createdId);

        // Test GET by ID
        const getByIdResult = await this.makeRequest('GET', `/conductAssessment/${createdId}`, token);
        this.recordTest({
          test: `ConductAssessment - GET by ID (${user.roleName})`,
          user: user.username,
          passed: getByIdResult.success && getByIdResult.status === 200,
          status: getByIdResult.status,
          error: getByIdResult.error
        });

        // Test UPDATE
        const updateData = {
          comment_on_character: 'Updated comment - student continues to improve'
        };
        const updateResult = await this.makeRequest('PUT', `/conductAssessment/${createdId}`, token, updateData);
        this.recordTest({
          test: `ConductAssessment - UPDATE (${user.roleName})`,
          user: user.username,
          passed: updateResult.success && updateResult.status === 200,
          status: updateResult.status,
          error: updateResult.error
        });

        // Test DELETE
        const deleteResult = await this.makeRequest('DELETE', `/conductAssessment/${createdId}`, token);
        this.recordTest({
          test: `ConductAssessment - DELETE (${user.roleName})`,
          user: user.username,
          passed: deleteResult.success && (deleteResult.status === 200 || deleteResult.status === 204),
          status: deleteResult.status,
          error: deleteResult.error
        });
      }
    }
  }

  /**
   * Test Survey endpoints
   */
  async testSurvey(user, madressahAppId = null) {
    const token = this.tokens[user.username];
    const isReadOnly = user.readOnly || false;
    
    // Caseworkers (role 5) are not allowed to access Madressa endpoints
    if (user.role === 5) {
      return; // Skip all tests for Caseworkers
    }
    
    console.log(`\n📋 Testing Survey endpoints for ${user.roleName}...`);

    // If no app ID provided, try to get one
    if (!madressahAppId) {
      const appResponse = await this.makeRequest('GET', '/madressaApplication', token);
      if (appResponse.success && appResponse.data && appResponse.data.length > 0) {
        madressahAppId = appResponse.data[0].id;
      } else {
        console.warn(`⚠️  No MadressaApplication found, skipping Survey tests`);
        return;
      }
    }

    // Test GET all
    const getAllResult = await this.makeRequest('GET', '/survey', token);
    this.recordTest({
      test: `Survey - GET all (${user.roleName})`,
      user: user.username,
      passed: getAllResult.success && getAllResult.status === 200,
      status: getAllResult.status,
      error: getAllResult.error
    });

    // Test GET by Madressah App ID
    const getByAppResult = await this.makeRequest('GET', `/survey/madressah-app/${madressahAppId}`, token);
    this.recordTest({
      test: `Survey - GET by Madressah App ID (${user.roleName})`,
      user: user.username,
      passed: getByAppResult.success && getByAppResult.status === 200,
      status: getByAppResult.status,
      error: getByAppResult.error
    });

    if (!isReadOnly && madressahAppId) {
      // Get center_id from the madressa application if available
      let centerId = user.center_id;
      if (!centerId || user.role === 1) {
        // For App Admin or if center_id is not set, try to get it from the application
        const appResponse = await this.makeRequest('GET', `/madressaApplication/${madressahAppId}`, token);
        if (appResponse.success && appResponse.data && appResponse.data.center_id) {
          centerId = appResponse.data.center_id;
        } else {
          // Fallback: try to get from relationships
          const relResponse = await this.makeRequest('GET', '/relationships', token);
          if (relResponse.success && relResponse.data && relResponse.data.length > 0) {
            centerId = relResponse.data[0].center_id || 1;
          } else {
            centerId = 1; // Final fallback
          }
        }
      }
      
      // Test CREATE (with all 19 questions)
      const createData = {
        madressah_app_id: madressahAppId,
        center_id: centerId, // Ensure center_id is set
        question1: 'Answer 1',
        question2: 'Answer 2',
        question3: 'Answer 3',
        question4: 'Answer 4',
        question5: 'Longer answer for question 5',
        question6: 'Answer 6',
        question7: 'Answer 7',
        question8: 'Answer 8',
        question9: 'Answer 9',
        question10: 'Answer 10',
        question11: 'Answer 11',
        question12: 'Answer 12',
        question13: 'Answer 13',
        question14: 'Answer 14',
        question15: 'Longer answer for question 15',
        question16: 'Answer 16',
        question17: 'Answer 17',
        question18: 'Answer 18',
        question19: 'Answer 19'
      };

      const createResult = await this.makeRequest('POST', '/survey', token, createData);
      this.recordTest({
        test: `Survey - CREATE (${user.roleName})`,
        user: user.username,
        passed: createResult.success && createResult.status === 201,
        status: createResult.status,
        error: createResult.error
      });

      if (createResult.success && createResult.data) {
        const createdId = createResult.data.id;
        this.testData.surveys.push(createdId);

        // Test GET by ID
        const getByIdResult = await this.makeRequest('GET', `/survey/${createdId}`, token);
        this.recordTest({
          test: `Survey - GET by ID (${user.roleName})`,
          user: user.username,
          passed: getByIdResult.success && getByIdResult.status === 200,
          status: getByIdResult.status,
          error: getByIdResult.error
        });

        // Test UPDATE
        const updateData = {
          question1: 'Updated Answer 1'
        };
        const updateResult = await this.makeRequest('PUT', `/survey/${createdId}`, token, updateData);
        this.recordTest({
          test: `Survey - UPDATE (${user.roleName})`,
          user: user.username,
          passed: updateResult.success && updateResult.status === 200,
          status: updateResult.status,
          error: updateResult.error
        });

        // Test DELETE
        const deleteResult = await this.makeRequest('DELETE', `/survey/${createdId}`, token);
        this.recordTest({
          test: `Survey - DELETE (${user.roleName})`,
          user: user.username,
          passed: deleteResult.success && (deleteResult.status === 200 || deleteResult.status === 204),
          status: deleteResult.status,
          error: deleteResult.error
        });
      }
    }
  }

  /**
   * Test tenant isolation (center_id filtering)
   */
  async testTenantIsolation(user1, user2) {
    const token1 = this.tokens[user1.username];
    const token2 = this.tokens[user2.username];
    
    console.log(`\n🔒 Testing Tenant Isolation between ${user1.roleName} and ${user2.roleName}...`);

    // Skip if user2 is a Caseworker (they're blocked by RBAC, not tenant isolation)
    if (user2.role === 5) {
      console.log(`⏭️  Skipping tenant isolation test - ${user2.roleName} is blocked by RBAC, not tenant isolation`);
      return;
    }

    // Skip if user1 is a Caseworker (they can't create Madressa records)
    if (user1.role === 5) {
      console.log(`⏭️  Skipping tenant isolation test - ${user1.roleName} cannot create Madressa records`);
      return;
    }

    // Note: We test both same-center and cross-center scenarios
    // Same center_id users should be able to access each other's data

    // Create an application with user1
    // For proper tenant isolation testing, we need a relationship from a different center than user2
    let relationshipId = null;
    let relationshipCenterId = null;
    
    try {
      const relResponse = await this.makeRequest('GET', '/relationships', token1);
      if (relResponse.success && relResponse.data && relResponse.data.length > 0) {
        // For App Admin, try to find a relationship in a different center than user2
        if (user1.role === 1 && user2.center_id) {
          const relInDifferentCenter = relResponse.data.find(rel => rel.center_id !== user2.center_id);
          if (relInDifferentCenter) {
            relationshipId = relInDifferentCenter.id;
            relationshipCenterId = relInDifferentCenter.center_id;
          } else {
            // No relationship in different center - use first one (same center test)
            relationshipId = relResponse.data[0].id;
            relationshipCenterId = relResponse.data[0].center_id;
          }
        } else {
          // For non-App Admin, use first relationship (they can only see their center)
          relationshipId = relResponse.data[0].id;
          relationshipCenterId = relResponse.data[0].center_id;
        }
      }
    } catch (error) {
      console.warn(`⚠️  Could not fetch relationship ID`);
    }

    if (relationshipId && !user1.readOnly) {
      const createData = {
        applicant_relationship_id: relationshipId,
        chronic_condition: 'None',
        blood_type: 'O+'
      };
      
      // App Admin must provide center_id (get it from the relationship)
      if (user1.role === 1 && relationshipCenterId) {
        createData.center_id = relationshipCenterId;
      }

      const createResult = await this.makeRequest('POST', '/madressaApplication', token1, createData);
      
      if (createResult.success && createResult.data) {
        const createdAppId = createResult.data.id;
        const createdRecordCenterId = createResult.data.center_id;

        // Try to access with user2 (should fail if tenant isolation works)
        const accessResult = await this.makeRequest('GET', `/madressaApplication/${createdAppId}`, token2);
        
        // Determine if user2 should see the record:
        // 1. App Admin (role 1) should see all records
        // 2. Others should only see records in their own center
        // Convert to same type for comparison (handle number/string/null)
        const createdCenterId = createdRecordCenterId != null ? Number(createdRecordCenterId) : null;
        const user2CenterId = user2.center_id != null ? Number(user2.center_id) : null;
        const isSameCenter = createdCenterId === user2CenterId;
        const shouldSee = user2.role === 1 || isSameCenter; // App Admin or same center
        const canAccess = accessResult.success && accessResult.status === 200;

        // If same center and user2 is not App Admin, this is a valid test (they SHOULD see it)
        // Only skip if we can't properly test cross-center isolation
        if (isSameCenter && user2.role !== 1) {
          // Same center - user2 SHOULD be able to access it
          this.recordTest({
            test: `Tenant Isolation - Same-center access (${user1.roleName} → ${user2.roleName})`,
            user: `${user1.username} → ${user2.username}`,
            passed: canAccess === true, // Should be able to access same center
            status: accessResult.status,
            error: accessResult.error,
            note: `Same center (${createdRecordCenterId}) - access should be allowed`
          });
        } else {
          // Cross-center test or App Admin test
          this.recordTest({
            test: `Tenant Isolation - Cross-center access (${user1.roleName} → ${user2.roleName})`,
            user: `${user1.username} → ${user2.username}`,
            passed: shouldSee === canAccess,
            status: accessResult.status,
            error: accessResult.error,
            note: shouldSee ? (user2.role === 1 ? 'App Admin can access all centers' : 'Same center - access allowed') : `Different center (${createdRecordCenterId} vs ${user2.center_id}) - should be blocked by tenant isolation`
          });
        }

        // Cleanup
        await this.makeRequest('DELETE', `/madressaApplication/${createdAppId}`, token1);
      }
    }
  }

  /**
   * Test error handling and validation
   */
  async testErrorHandling(user) {
    const token = this.tokens[user.username];
    const isReadOnly = user.readOnly || false;
    
    console.log(`\n⚠️  Testing Error Handling for ${user.roleName}...`);

    // Caseworkers (role 5) are not allowed to access Madressa endpoints
    const isCaseworker = user.role === 5;
    if (isCaseworker) {
      // Test CREATE without required fields - should be blocked (403) for Caseworkers
      const invalidCreateResult = await this.makeRequest('POST', '/madressaApplication', token, {});
      this.recordTest({
        test: `Error Handling - CREATE without required fields (${user.roleName}) - RBAC Blocked`,
        user: user.username,
        passed: !invalidCreateResult.success && invalidCreateResult.status === 403,
        status: invalidCreateResult.status,
        error: invalidCreateResult.error,
        note: 'Caseworkers correctly blocked from Madressa endpoints'
      });
      
      // Test GET with invalid ID - should be blocked (403) for Caseworkers
      const invalidGetResult = await this.makeRequest('GET', '/madressaApplication/999999', token);
      this.recordTest({
        test: `Error Handling - GET with invalid ID (${user.roleName}) - RBAC Blocked`,
        user: user.username,
        passed: !invalidGetResult.success && invalidGetResult.status === 403,
        status: invalidGetResult.status,
        error: invalidGetResult.error,
        note: 'Caseworkers correctly blocked from Madressa endpoints'
      });
      
      // Test UPDATE with invalid ID - should be blocked (403) for Caseworkers
      const invalidUpdateResult = await this.makeRequest('PUT', '/madressaApplication/999999', token, { chronic_condition: 'Test' });
      this.recordTest({
        test: `Error Handling - UPDATE with invalid ID (${user.roleName}) - RBAC Blocked`,
        user: user.username,
        passed: !invalidUpdateResult.success && invalidUpdateResult.status === 403,
        status: invalidUpdateResult.status,
        error: invalidUpdateResult.error,
        note: 'Caseworkers correctly blocked from Madressa endpoints'
      });
      
      // Test DELETE with invalid ID - should be blocked (403) for Caseworkers
      const invalidDeleteResult = await this.makeRequest('DELETE', '/madressaApplication/999999', token);
      this.recordTest({
        test: `Error Handling - DELETE with invalid ID (${user.roleName}) - RBAC Blocked`,
        user: user.username,
        passed: !invalidDeleteResult.success && invalidDeleteResult.status === 403,
        status: invalidDeleteResult.status,
        error: invalidDeleteResult.error,
        note: 'Caseworkers correctly blocked from Madressa endpoints'
      });
      
      return; // Skip remaining error handling tests for Caseworkers
    }

    if (!isReadOnly) {
      // Test CREATE without required fields
      const invalidCreateResult = await this.makeRequest('POST', '/madressaApplication', token, {});
      this.recordTest({
        test: `Error Handling - CREATE without required fields (${user.roleName})`,
        user: user.username,
        passed: !invalidCreateResult.success && (invalidCreateResult.status === 400 || invalidCreateResult.status === 500),
        status: invalidCreateResult.status,
        error: invalidCreateResult.error
      });

      // Test GET with invalid ID
      const invalidGetResult = await this.makeRequest('GET', '/madressaApplication/999999', token);
      this.recordTest({
        test: `Error Handling - GET with invalid ID (${user.roleName})`,
        user: user.username,
        passed: !invalidGetResult.success && invalidGetResult.status === 404,
        status: invalidGetResult.status,
        error: invalidGetResult.error
      });

      // Test UPDATE with invalid ID
      const invalidUpdateResult = await this.makeRequest('PUT', '/madressaApplication/999999', token, { chronic_condition: 'Test' });
      this.recordTest({
        test: `Error Handling - UPDATE with invalid ID (${user.roleName})`,
        user: user.username,
        passed: !invalidUpdateResult.success && invalidUpdateResult.status === 404,
        status: invalidUpdateResult.status,
        error: invalidUpdateResult.error
      });

      // Test DELETE with invalid ID
      const invalidDeleteResult = await this.makeRequest('DELETE', '/madressaApplication/999999', token);
      this.recordTest({
        test: `Error Handling - DELETE with invalid ID (${user.roleName})`,
        user: user.username,
        passed: !invalidDeleteResult.success && invalidDeleteResult.status === 404,
        status: invalidDeleteResult.status,
        error: invalidDeleteResult.error
      });

      // Test AcademicResults without madressah_app_id
      const invalidAcadResult = await this.makeRequest('POST', '/academicResults', token, { school: 'Test' });
      this.recordTest({
        test: `Error Handling - AcademicResults CREATE without madressah_app_id (${user.roleName})`,
        user: user.username,
        passed: !invalidAcadResult.success,
        status: invalidAcadResult.status,
        error: invalidAcadResult.error
      });
    }
  }

  /**
   * Run all tests
   */
  async runAllTests() {
    console.log('\n🚀 Starting Madressa Module QA Test Suite...\n');
    console.log(`Environment: ${this.env.name}`);
    console.log(`Base URL: ${this.baseURL}\n`);

    // Login all test users
    console.log('🔐 Logging in all test users...');
    for (const user of testConfig.testUsers) {
      const loginResult = await this.login(user);
      if (loginResult.success) {
        console.log(`✅ Logged in as ${user.username} (${user.roleName})`);
      } else {
        console.error(`❌ Failed to login as ${user.username}: ${loginResult.error}`);
        this.results.summary.errors.push(`Login failed for ${user.username}: ${loginResult.error}`);
      }
    }

    // Run tests for each user
    for (const user of testConfig.testUsers) {
      if (!this.tokens[user.username]) {
        console.warn(`⚠️  Skipping tests for ${user.username} - no valid token`);
        continue;
      }

      console.log(`\n${'='.repeat(60)}`);
      console.log(`Testing as ${user.roleName} (${user.username})`);
      console.log(`${'='.repeat(60)}`);

      // Test all endpoints
      await this.testMadressaApplication(user);
      
      // Get a valid app ID for related tests - try to use an existing one or create one
      const appResponse = await this.makeRequest('GET', '/madressaApplication', this.tokens[user.username]);
      let appId = null;
      if (appResponse.success && appResponse.data && appResponse.data.length > 0) {
        appId = appResponse.data[0].id;
        console.log(`✅ Found existing MadressaApplication ID: ${appId}`);
      } else if (!user.readOnly && user.role !== 5) {
        // Try to create an application for testing if none exists
        console.log(`⚠️  No existing MadressaApplication found, attempting to create one...`);
        const relResponse = await this.makeRequest('GET', '/relationships', this.tokens[user.username]);
        if (relResponse.success && relResponse.data && relResponse.data.length > 0) {
          const relationshipId = relResponse.data[0].id;
          const createAppData = {
            applicant_relationship_id: relationshipId,
            chronic_condition: 'None',
            blood_type: 'O+'
          };
          if (user.role === 1 && relResponse.data[0].center_id) {
            createAppData.center_id = relResponse.data[0].center_id;
          }
          const createAppResult = await this.makeRequest('POST', '/madressaApplication', this.tokens[user.username], createAppData);
          if (createAppResult.success && createAppResult.data) {
            appId = createAppResult.data.id;
            this.testData.madressaApplications.push(appId);
            console.log(`✅ Created new MadressaApplication ID: ${appId}`);
          } else {
            console.error(`❌ Failed to create MadressaApplication: ${createAppResult.error}`);
          }
        } else {
          console.warn(`⚠️  No relationships found, cannot create MadressaApplication`);
        }
      }
      
      // Validate appId before proceeding
      if (!appId) {
        console.warn(`⚠️  No valid madressahAppId available for ${user.roleName}, skipping related entity tests`);
      }

      await this.testAcademicResults(user, appId);
      await this.testIslamicResults(user, appId);
      await this.testConductAssessment(user, appId);
      await this.testSurvey(user, appId);
      await this.testErrorHandling(user);
    }

    // Test tenant isolation between different users
    console.log(`\n${'='.repeat(60)}`);
    console.log('Testing Tenant Isolation');
    console.log(`${'='.repeat(60)}`);
    for (let i = 0; i < testConfig.testUsers.length; i++) {
      for (let j = i + 1; j < testConfig.testUsers.length; j++) {
        const user1 = testConfig.testUsers[i];
        const user2 = testConfig.testUsers[j];
        if (this.tokens[user1.username] && this.tokens[user2.username]) {
          await this.testTenantIsolation(user1, user2);
        }
      }
    }

    // Generate summary
    this.printSummary();
    
    // Save results
    await this.saveResults();
    
    // Return results for comprehensive test runner
    return this.results;
  }

  /**
   * Print test summary
   */
  printSummary() {
    console.log(`\n${'='.repeat(60)}`);
    console.log('📊 TEST SUMMARY');
    console.log(`${'='.repeat(60)}`);
    console.log(`Total Tests: ${this.results.summary.total}`);
    console.log(`✅ Passed: ${this.results.summary.passed}`);
    console.log(`❌ Failed: ${this.results.summary.failed}`);
    console.log(`Success Rate: ${((this.results.summary.passed / this.results.summary.total) * 100).toFixed(2)}%`);

    if (this.results.summary.errors.length > 0) {
      console.log(`\n⚠️  Errors:`);
      this.results.summary.errors.forEach((error, index) => {
        console.log(`  ${index + 1}. ${error}`);
      });
    }

    if (this.results.summary.failed > 0) {
      console.log(`\n❌ Failed Tests:`);
      this.results.tests
        .filter(t => !t.passed)
        .forEach((test, index) => {
          console.log(`  ${index + 1}. ${test.test} (${test.user})`);
          if (test.error) {
            console.log(`     Error: ${JSON.stringify(test.error)}`);
          }
        });
    }
  }

  /**
   * Save test results to file
   */
  async saveResults() {
    try {
      const resultsDir = path.join(__dirname, 'test-results');
      await fs.mkdir(resultsDir, { recursive: true });
      
      const filename = `madressa-qa-test-${this.results.timestamp.replace(/:/g, '-')}.json`;
      const filepath = path.join(resultsDir, filename);
      
      await fs.writeFile(filepath, JSON.stringify(this.results, null, 2));
      console.log(`\n💾 Results saved to: ${filepath}`);
    } catch (error) {
      console.error(`❌ Failed to save results: ${error.message}`);
    }
  }
}

// Run tests if executed directly
if (require.main === module) {
  const environment = process.argv[2] || 'staging';
  const tester = new MadressaQATest(environment);
  tester.runAllTests().catch(error => {
    console.error(`\n❌ Test suite failed: ${error.message}`);
    console.error(error.stack);
    process.exit(1);
  });
}

module.exports = MadressaQATest;
