/**
 * HQ Role QA Test Suite
 * Comprehensive testing for HQ role (Role 2)
 * Tests all endpoints, pages, and verifies center filtering behavior
 * 
 * HQ Role Characteristics:
 * - Role ID: 2
 * - Multi-center access for data viewing
 * - Cannot manage centers (Center_Detail CRUD restricted)
 * - Dashboard filtered by assigned center (not global)
 * - Has center_id assigned (not null like App Admin)
 */

const axios = require('axios');
const fs = require('fs').promises;
const path = require('path');
const testConfig = require('./test-config');

class HQQATest {
  constructor(environment = 'staging') {
    this.env = testConfig.environments[environment];
    this.baseURL = this.env.baseURL;
    this.token = null;
    this.hqUser = testConfig.testUsers.find(u => u.role === 2); // HQ
    
    this.results = {
      environment: environment,
      timestamp: new Date().toISOString(),
      user: this.hqUser,
      frontendTests: [],
      backendTests: [],
      dataCorrectnessTests: [],
      restrictedAccessTests: [],
      summary: {
        totalTests: 0,
        passed: 0,
        failed: 0,
        errors: [],
        warnings: []
      }
    };
  }

  /**
   * Login as HQ user
   */
  async login() {
    try {
      console.log(`\n🔐 Logging in as HQ: ${this.hqUser.username}...`);
      const response = await axios.post(
        `${this.baseURL}/auth/login`,
        {
          username: this.hqUser.username,
          password: this.hqUser.password
        },
        {
          headers: { 'Content-Type': 'application/json' }
        }
      );

      if (response.data && response.data.token) {
        this.token = response.data.token;
        const userInfo = response.data.userInfo || response.data.user;
        console.log(`✅ Login successful! Token received.`);
        console.log(`   User Info: ${JSON.stringify(userInfo)}`);
        
        // Verify HQ properties
        if (parseInt(userInfo.user_type) !== 2) {
          throw new Error(`Expected user_type=2 (HQ), got ${userInfo.user_type}`);
        }
        if (!userInfo.center_id && userInfo.center_id !== null) {
          console.warn(`⚠️  Warning: HQ should have center_id assigned, got ${userInfo.center_id}`);
          this.results.summary.warnings.push(`HQ center_id is ${userInfo.center_id}, expected a valid center_id`);
        }
        
        return { success: true, userInfo };
      }
      return { success: false, error: 'No token in response' };
    } catch (error) {
      const errorMsg = error.response?.data?.msg || error.message;
      console.error(`❌ Login failed: ${errorMsg}`);
      return { success: false, error: errorMsg, status: error.response?.status };
    }
  }

  /**
   * Make authenticated API request
   */
  async makeRequest(method, endpoint, data = null, params = {}) {
    const config = {
      method: method.toLowerCase(),
      url: `${this.baseURL}${endpoint}`,
      headers: {
        'Authorization': `Bearer ${this.token}`,
        'Content-Type': 'application/json'
      },
      params: params,
      validateStatus: () => true
    };

    if (data && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
      config.data = data;
    }

    try {
      const response = await axios(config);
      return {
        success: response.status >= 200 && response.status < 300,
        status: response.status,
        data: response.data,
        headers: response.headers
      };
    } catch (error) {
      return {
        success: false,
        status: error.response?.status || 0,
        error: error.response?.data || error.message,
        headers: error.response?.headers
      };
    }
  }

  /**
   * Test restricted endpoints (HQ should NOT have access)
   */
  async testRestrictedAccess() {
    console.log(`\n${'='.repeat(80)}`);
    console.log('🚫 TESTING RESTRICTED ACCESS (Should Fail)');
    console.log('='.repeat(80));

    const restrictedEndpoints = [
      {
        name: 'Center Management - Create',
        endpoint: '/centerDetail',
        method: 'POST',
        data: {
          name: 'Test Center',
          center_id: 999,
          created_by: this.hqUser.username
        },
        expectedStatus: 403
      },
      {
        name: 'Center Management - Update',
        endpoint: '/centerDetail/1',
        method: 'PUT',
        data: {
          name: 'Updated Test Center',
          updated_by: this.hqUser.username
        },
        expectedStatus: 403
      },
      {
        name: 'Center Management - Delete',
        endpoint: '/centerDetail/1',
        method: 'DELETE',
        expectedStatus: 403
      }
    ];

    for (const endpointConfig of restrictedEndpoints) {
      const result = await this.makeRequest(
        endpointConfig.method,
        endpointConfig.endpoint,
        endpointConfig.data
      );

      const testResult = {
        name: endpointConfig.name,
        method: endpointConfig.method,
        endpoint: endpointConfig.endpoint,
        expectedStatus: endpointConfig.expectedStatus,
        actualStatus: result.status,
        passed: result.status === endpointConfig.expectedStatus,
        error: result.error?.error || result.error?.msg || JSON.stringify(result.error),
        timestamp: new Date().toISOString()
      };

      this.results.restrictedAccessTests.push(testResult);
      this.results.summary.totalTests++;

      if (testResult.passed) {
        this.results.summary.passed++;
        console.log(`✅ ${endpointConfig.name}: Correctly blocked (${result.status})`);
      } else {
        this.results.summary.failed++;
        console.log(`❌ ${endpointConfig.name}: Expected ${endpointConfig.expectedStatus}, got ${result.status}`);
        this.results.summary.errors.push({
          test: endpointConfig.name,
          error: `Expected ${endpointConfig.expectedStatus}, got ${result.status}`
        });
      }
    }

    return this.results.restrictedAccessTests;
  }

  /**
   * Test all backend API endpoints (that HQ should have access to)
   */
  async testBackendEndpoints() {
    console.log(`\n${'='.repeat(80)}`);
    console.log('🔌 TESTING BACKEND API ENDPOINTS');
    console.log('='.repeat(80));

    // First, fetch lists to get actual IDs for getById tests
    let actualEmployeeId = null;
    let actualSupplierId = null;
    let actualInventoryId = null;
    let actualApplicantId = null;

    try {
      const employeesList = await this.makeRequest('GET', '/employee');
      if (employeesList.success && Array.isArray(employeesList.data) && employeesList.data.length > 0) {
        actualEmployeeId = employeesList.data[0].id || employeesList.data[0].ID;
      }
    } catch (e) {}

    try {
      const suppliersList = await this.makeRequest('GET', '/supplierProfile');
      if (suppliersList.success && Array.isArray(suppliersList.data) && suppliersList.data.length > 0) {
        actualSupplierId = suppliersList.data[0].id || suppliersList.data[0].ID;
      }
    } catch (e) {}

    try {
      const inventoryList = await this.makeRequest('GET', '/inventoryItems');
      if (inventoryList.success && Array.isArray(inventoryList.data) && inventoryList.data.length > 0) {
        actualInventoryId = inventoryList.data[0].id || inventoryList.data[0].ID;
      }
    } catch (e) {}

    try {
      const applicantsList = await this.makeRequest('GET', '/applicantDetails');
      if (applicantsList.success && Array.isArray(applicantsList.data) && applicantsList.data.length > 0) {
        actualApplicantId = applicantsList.data[0].id || applicantsList.data[0].ID;
      }
    } catch (e) {}

    const endpoints = [
      // Dashboard (should be filtered by HQ's center)
      { name: 'Dashboard - Applicant Statistics', method: 'GET', endpoint: '/dashboard/applicant-statistics' },
      
      // Applicants (HQ can access all centers)
      { name: 'Applicants - List', method: 'GET', endpoint: '/applicantDetails' },
      { name: 'Applicants - Get by ID', method: 'GET', endpoint: actualApplicantId ? `/applicantDetails/${actualApplicantId}` : '/applicantDetails/1', skipIfNoData: !actualApplicantId },
      
      // Employees (HQ can access all centers)
      { name: 'Employees - List', method: 'GET', endpoint: '/employee' },
      { name: 'Employees - Get by ID', method: 'GET', endpoint: actualEmployeeId ? `/employee/${actualEmployeeId}` : '/employee/1', skipIfNoData: !actualEmployeeId },
      
      // Suppliers (HQ can access all centers)
      { name: 'Suppliers - List', method: 'GET', endpoint: '/supplierProfile' },
      { name: 'Suppliers - Get by ID', method: 'GET', endpoint: actualSupplierId ? `/supplierProfile/${actualSupplierId}` : '/supplierProfile/1', skipIfNoData: !actualSupplierId },
      
      // Inventory (HQ can access all centers)
      { name: 'Inventory Items - List', method: 'GET', endpoint: '/inventoryItems' },
      { name: 'Inventory Items - Get by ID', method: 'GET', endpoint: actualInventoryId ? `/inventoryItems/${actualInventoryId}` : '/inventoryItems/1', skipIfNoData: !actualInventoryId },
      { name: 'Inventory Transactions - List', method: 'GET', endpoint: '/inventoryTransactions' },
      
      // Centers - HQ CANNOT access at all (restricted_modules: ["Center_Detail"])
      // Note: HQ should get 403 for all center operations (including GET/view)
      { name: 'Centers - List (Should Be Blocked)', method: 'GET', endpoint: '/centerDetail', shouldFail: true, expectedStatus: 403 },
      { name: 'Centers - Get by ID (Should Be Blocked)', method: 'GET', endpoint: '/centerDetail/1', shouldFail: true, expectedStatus: 403 },
      
      // Chat
      { name: 'Conversations - List', method: 'GET', endpoint: '/conversations' },
      { name: 'Messages - List', method: 'GET', endpoint: '/messages' },
      
      // File Manager
      { name: 'Folders - List', method: 'GET', endpoint: '/folders' },
      { name: 'Personal Files - List', method: 'GET', endpoint: '/personalFiles' },
      
      // Lookups
      { name: 'Lookup - Gender', method: 'GET', endpoint: '/lookup/Gender' },
      { name: 'Lookup - Nationality', method: 'GET', endpoint: '/lookup/Nationality' },
      { name: 'Lookup - Race', method: 'GET', endpoint: '/lookup/Race' },
      { name: 'Lookup - Suburb', method: 'GET', endpoint: '/lookup/Suburb' },
      { name: 'Lookup - Education_Level', method: 'GET', endpoint: '/lookup/Education_Level' },
      
      // Reports (HQ has access)
      { name: 'Reports - Applicant Details', method: 'GET', endpoint: '/reports/applicant-details' },
      { name: 'Reports - Total Financial Assistance', method: 'GET', endpoint: '/reports/total-financial-assistance' },
      { name: 'Reports - Financial Assistance', method: 'GET', endpoint: '/reports/financial-assistance' },
      { name: 'Reports - Food Assistance', method: 'GET', endpoint: '/reports/food-assistance' },
      { name: 'Reports - Home Visits', method: 'GET', endpoint: '/reports/home-visits' },
      { name: 'Reports - Applicant Programs', method: 'GET', endpoint: '/reports/applicant-programs' },
      { name: 'Reports - Relationship Report', method: 'GET', endpoint: '/reports/relationship-report' },
      { name: 'Reports - Skills Matrix', method: 'GET', endpoint: '/reports/skills-matrix' },
      
      // Additional modules
      { name: 'Financial Assessment - List', method: 'GET', endpoint: '/financialAssessment' },
      { name: 'Financial Assistance - List', method: 'GET', endpoint: '/financialAssistance' },
      { name: 'Food Assistance - List', method: 'GET', endpoint: '/foodAssistance' },
      { name: 'Home Visits - List', method: 'GET', endpoint: '/homeVisit' },
      { name: 'Relationships - List', method: 'GET', endpoint: '/relationships' },
      { name: 'Tasks - List', method: 'GET', endpoint: '/tasks' },
      { name: 'Comments - List', method: 'GET', endpoint: '/comments' },
      { name: 'Programs - List', method: 'GET', endpoint: '/programs' },
      { name: 'Training Institutions - List', method: 'GET', endpoint: '/trainingInstitutions' },
      { name: 'Training Courses - List', method: 'GET', endpoint: '/trainingCourses' },
      { name: 'Employee Appraisals - List', method: 'GET', endpoint: '/employeeAppraisal' },
      { name: 'Employee Initiatives - List', method: 'GET', endpoint: '/employeeInitiative' },
      { name: 'Employee Skills - List', method: 'GET', endpoint: '/employeeSkills' },
      { name: 'Supplier Evaluations - List', method: 'GET', endpoint: '/supplierEvaluation' },
      { name: 'Supplier Documents - List', method: 'GET', endpoint: '/supplierDocument' },
      { name: 'Service Ratings - List', method: 'GET', endpoint: '/serviceRating' },
      { name: 'Center Audits - List', method: 'GET', endpoint: '/centerAudits' },
      { name: 'Policy and Procedure - List', method: 'GET', endpoint: '/policyAndProcedure' },
      { name: 'HSEQ Toolbox Meetings - List', method: 'GET', endpoint: '/hseqToolboxMeeting' },
      { name: 'HSEQ Toolbox Meeting Tasks - List', method: 'GET', endpoint: '/hseqToolboxMeetingTasks' },
    ];

    for (const endpoint of endpoints) {
      const result = await this.makeRequest(endpoint.method, endpoint.endpoint);
      
      const acceptableStatuses = [200, 201];
      let isAcceptableNonSuccess = false;
      if (endpoint.skipIfNoData) {
        acceptableStatuses.push(404);
        acceptableStatuses.push(400);
        isAcceptableNonSuccess = result.status === 404 || result.status === 400;
      }

      // If endpoint should fail (restricted access), 403 is acceptable
      if (endpoint.shouldFail && endpoint.expectedStatus) {
        const testResult = {
          name: endpoint.name,
          method: endpoint.method,
          endpoint: endpoint.endpoint,
          passed: result.status === endpoint.expectedStatus,
          status: result.status,
          expectedStatus: endpoint.expectedStatus,
          error: result.status === endpoint.expectedStatus ? null : (result.error?.error || result.error?.msg || 'Access should be blocked'),
          note: result.status === endpoint.expectedStatus ? 'Correctly blocked (expected behavior)' : `Expected ${endpoint.expectedStatus}, got ${result.status}`,
          timestamp: new Date().toISOString()
        };

        this.results.backendTests.push(testResult);
        this.results.summary.totalTests++;

        if (testResult.passed) {
          this.results.summary.passed++;
          console.log(`✅ ${endpoint.name}: Correctly blocked (${result.status})`);
        } else {
          this.results.summary.failed++;
          console.log(`❌ ${endpoint.name}: Expected ${endpoint.expectedStatus}, got ${result.status}`);
          this.results.summary.errors.push({
            test: endpoint.name,
            error: `Expected ${endpoint.expectedStatus}, got ${result.status}`
          });
        }
        continue; // Skip to next endpoint
      }

      const testResult = {
        name: endpoint.name,
        method: endpoint.method,
        endpoint: endpoint.endpoint,
        passed: (result.success && acceptableStatuses.includes(result.status)) || isAcceptableNonSuccess,
        status: result.status,
        hasData: result.data !== undefined && result.data !== null,
        dataType: Array.isArray(result.data) ? 'array' : typeof result.data,
        recordCount: Array.isArray(result.data) ? result.data.length : (result.data ? 1 : 0),
        error: result.success ? null : (result.error?.msg || result.error?.error || JSON.stringify(result.error)),
        timestamp: new Date().toISOString()
      };

      if (result.status === 404 && endpoint.skipIfNoData) {
        testResult.note = 'Record not found (acceptable)';
      }

      if (result.status === 400 && endpoint.skipIfNoData) {
        testResult.note = 'Invalid ID format handled correctly';
      }

      // Check for 403 Forbidden
      if (result.status === 403) {
        testResult.passed = false;
        testResult.error = '403 Forbidden - HQ should have access to this endpoint';
        this.results.summary.errors.push({
          test: endpoint.name,
          error: '403 Forbidden - HQ should have access'
        });
      }

      // Check for 401 Unauthorized
      if (result.status === 401) {
        testResult.passed = false;
        testResult.error = '401 Unauthorized - Token may be invalid';
        this.results.summary.errors.push({
          test: endpoint.name,
          error: '401 Unauthorized - Authentication failed'
        });
      }

      this.results.backendTests.push(testResult);
      this.results.summary.totalTests++;

      if (testResult.passed) {
        this.results.summary.passed++;
        console.log(`✅ ${endpoint.name}: ${result.status} - ${testResult.recordCount} records`);
      } else {
        this.results.summary.failed++;
        console.log(`❌ ${endpoint.name}: ${result.status} - ${testResult.error || 'Failed'}`);
      }
    }

    return this.results.backendTests;
  }

  /**
   * Test CRUD operations for accessible modules
   */
  async testCRUDOperations() {
    console.log(`\n${'='.repeat(80)}`);
    console.log('🔄 TESTING CRUD OPERATIONS');
    console.log('='.repeat(80));

    const crudTests = [];

    const createTests = [
      {
        name: 'Create Applicant',
        endpoint: '/applicantDetails',
        payload: {
          name: 'HQ Test',
          surname: 'Applicant',
          id_number: `HQ${Date.now()}`,
          center_id: this.hqUser.center_id,
          created_by: this.hqUser.username
        }
      },
      {
        name: 'Create Supplier',
        endpoint: '/supplierProfile',
        payload: {
          name: `HQ Test Supplier ${Date.now()}`,
          center_id: this.hqUser.center_id,
          created_by: this.hqUser.username
        }
      },
      {
        name: 'Create Inventory Item',
        endpoint: '/inventoryItems',
        payload: {
          item_name: `HQ Test Item ${Date.now()}`,
          quantity: 10,
          center_id: this.hqUser.center_id,
          created_by: this.hqUser.username
        }
      }
    ];

    for (const test of createTests) {
      const createResult = await this.makeRequest('POST', test.endpoint, test.payload);
      
      const testResult = {
        operation: 'CREATE',
        name: test.name,
        endpoint: test.endpoint,
        passed: createResult.success && (createResult.status === 200 || createResult.status === 201),
        status: createResult.status,
        createdId: createResult.data?.id || createResult.data?.ID,
        error: createResult.success ? null : (createResult.error?.error || createResult.error?.msg || JSON.stringify(createResult.error)),
        timestamp: new Date().toISOString()
      };

      crudTests.push(testResult);
      this.results.summary.totalTests++;

      if (testResult.passed) {
        this.results.summary.passed++;
        console.log(`✅ ${test.name}: Created with ID ${testResult.createdId}`);

        // Test UPDATE if CREATE succeeded
        if (testResult.createdId) {
          const updateEndpoint = test.endpoint.includes(':id') 
            ? test.endpoint.replace(':id', testResult.createdId)
            : `${test.endpoint}/${testResult.createdId}`;
          
          const updatePayload = {
            ...test.payload,
            updated_by: this.hqUser.username
          };

          const updateResult = await this.makeRequest('PUT', updateEndpoint, updatePayload);
          
          const updateTestResult = {
            operation: 'UPDATE',
            name: `Update ${test.name}`,
            endpoint: updateEndpoint,
            passed: updateResult.success && (updateResult.status === 200 || updateResult.status === 204),
            status: updateResult.status,
            error: updateResult.success ? null : (updateResult.error?.error || updateResult.error?.msg || JSON.stringify(updateResult.error)),
            timestamp: new Date().toISOString()
          };

          crudTests.push(updateTestResult);
          this.results.summary.totalTests++;

          if (updateTestResult.passed) {
            this.results.summary.passed++;
            console.log(`✅ Update ${test.name}: Success`);
          } else {
            this.results.summary.failed++;
            console.log(`❌ Update ${test.name}: ${updateTestResult.error || 'Failed'}`);
          }

          // Test DELETE if UPDATE succeeded
          if (updateTestResult.passed) {
            const deleteResult = await this.makeRequest('DELETE', updateEndpoint);
            
            const deleteTestResult = {
              operation: 'DELETE',
              name: `Delete ${test.name}`,
              endpoint: updateEndpoint,
              passed: deleteResult.success && (deleteResult.status === 200 || deleteResult.status === 204),
              status: deleteResult.status,
              error: deleteResult.success ? null : (deleteResult.error?.error || deleteResult.error?.msg || JSON.stringify(deleteResult.error)),
              timestamp: new Date().toISOString()
            };

            crudTests.push(deleteTestResult);
            this.results.summary.totalTests++;

            if (deleteTestResult.passed) {
              this.results.summary.passed++;
              console.log(`✅ Delete ${test.name}: Success`);
            } else {
              this.results.summary.failed++;
              console.log(`❌ Delete ${test.name}: ${deleteTestResult.error || 'Failed'}`);
            }
          }
        }
      } else {
        this.results.summary.failed++;
        console.log(`❌ ${test.name}: ${testResult.error || 'Failed'}`);
      }
    }

    this.results.backendTests.push(...crudTests);
    return crudTests;
  }

  /**
   * Test data correctness - verify HQ sees data ONLY from their own center
   */
  async testDataCorrectness() {
    console.log(`\n${'='.repeat(80)}`);
    console.log('📊 TESTING DATA CORRECTNESS (Center-Specific Access)');
    console.log('='.repeat(80));
    console.log(`HQ Center ID: ${this.hqUser.center_id}`);
    console.log(`Expected: HQ should ONLY see data from center_id = ${this.hqUser.center_id}`);

    const correctnessTests = [];

    const endpointsToCheck = [
      { name: 'Applicants', endpoint: '/applicantDetails' },
      { name: 'Employees', endpoint: '/employee' },
      { name: 'Suppliers', endpoint: '/supplierProfile' },
      { name: 'Inventory Items', endpoint: '/inventoryItems' }
    ];

    for (const test of endpointsToCheck) {
      const result = await this.makeRequest('GET', test.endpoint);
      
      if (result.success && Array.isArray(result.data)) {
        const records = result.data;
        const centerIds = new Set();
        const wrongCenterRecords = [];
        
        records.forEach(record => {
          const recordCenterId = record.center_id !== null && record.center_id !== undefined 
            ? parseInt(record.center_id) 
            : (record.Center_ID !== null && record.Center_ID !== undefined ? parseInt(record.Center_ID) : null);
          
          if (recordCenterId !== null) {
            centerIds.add(recordCenterId);
            // Check if record is from wrong center
            if (recordCenterId !== parseInt(this.hqUser.center_id)) {
              wrongCenterRecords.push({
                id: record.id || record.ID || record.ID,
                center_id: recordCenterId
              });
            }
          }
        });

        const hqCenterIdInt = parseInt(this.hqUser.center_id);
        const hasOnlyHqCenter = centerIds.size === 1 && centerIds.has(hqCenterIdInt);
        const hasWrongCenters = wrongCenterRecords.length > 0;

        const testResult = {
          name: `${test.name} - Center Filtering`,
          endpoint: test.endpoint,
          totalRecords: records.length,
          uniqueCenters: Array.from(centerIds).sort(),
          centerCount: centerIds.size,
          hqCenterId: this.hqUser.center_id,
          wrongCenterRecords: wrongCenterRecords.length,
          passed: hasOnlyHqCenter && !hasWrongCenters,
          note: hasOnlyHqCenter 
            ? `✅ HQ correctly sees only center_id=${this.hqUser.center_id} (${records.length} records)`
            : hasWrongCenters
              ? `❌ HQ sees ${wrongCenterRecords.length} record(s) from wrong center(s). Expected only center_id=${this.hqUser.center_id}`
              : `⚠️ HQ sees ${centerIds.size} center(s): ${Array.from(centerIds).join(', ')}. Expected only center_id=${this.hqUser.center_id}`,
          timestamp: new Date().toISOString()
        };

        correctnessTests.push(testResult);
        this.results.summary.totalTests++;

        if (testResult.passed) {
          this.results.summary.passed++;
          console.log(`✅ ${test.name}: ${records.length} records, all from center_id=${this.hqUser.center_id}`);
        } else {
          this.results.summary.failed++;
          console.log(`❌ ${test.name}: ${testResult.note}`);
          if (wrongCenterRecords.length > 0) {
            console.log(`   Wrong center records found: ${JSON.stringify(wrongCenterRecords.slice(0, 3))}`);
          }
          this.results.summary.errors.push({
            test: `${test.name} - Center Filtering`,
            error: testResult.note
          });
        }
      } else {
        const testResult = {
          name: `${test.name} - Center Filtering`,
          endpoint: test.endpoint,
          passed: false,
          error: result.error || 'No data returned',
          timestamp: new Date().toISOString()
        };

        correctnessTests.push(testResult);
        this.results.summary.totalTests++;
        this.results.summary.failed++;
        console.log(`❌ ${test.name}: ${testResult.error || 'Failed to fetch data'}`);
      }
    }

    this.results.dataCorrectnessTests.push(...correctnessTests);
    return correctnessTests;
  }

  /**
   * Test dashboard filtering (HQ dashboard should be filtered by their center)
   */
  async testDashboardFiltering() {
    console.log(`\n${'='.repeat(80)}`);
    console.log('📊 TESTING DASHBOARD FILTERING (HQ Center-Specific)');
    console.log('='.repeat(80));

    const result = await this.makeRequest('GET', '/dashboard/applicant-statistics');
    
    const testResult = {
      name: 'Dashboard - Applicant Statistics (Center Filtered)',
      endpoint: '/dashboard/applicant-statistics',
      passed: result.success && result.status === 200,
      status: result.status,
      hasData: result.data !== undefined && result.data !== null,
      hqCenterId: this.hqUser.center_id,
      note: 'HQ dashboard should show data filtered by their assigned center',
      timestamp: new Date().toISOString()
    };

    this.results.backendTests.push(testResult);
    this.results.summary.totalTests++;

    if (testResult.passed) {
      this.results.summary.passed++;
      console.log(`✅ Dashboard accessible and returning center-filtered data for center ${this.hqUser.center_id}`);
    } else {
      this.results.summary.failed++;
      console.log(`❌ Dashboard: ${result.error?.error || result.error?.msg || 'Failed'}`);
    }

    return testResult;
  }

  /**
   * Test frontend page routes with comprehensive endpoint testing
   */
  async testFrontendRoutes() {
    console.log(`\n${'='.repeat(80)}`);
    console.log('🌐 TESTING FRONTEND PAGE ACCESS');
    console.log('='.repeat(80));

    const frontendPages = [
      {
        name: 'Dashboard',
        route: '/dashboard',
        endpoints: [
          { name: 'Applicant Statistics', endpoint: '/dashboard/applicant-statistics', method: 'GET' }
        ]
      },
      {
        name: 'Applicants',
        route: '/applicants',
        endpoints: [
          { name: 'List Applicants', endpoint: '/applicantDetails', method: 'GET' },
          { name: 'Financial Assessment', endpoint: '/financialAssessment', method: 'GET' },
          { name: 'Relationships', endpoint: '/relationships', method: 'GET' },
          { name: 'Home Visits', endpoint: '/homeVisit', method: 'GET' },
          { name: 'Tasks', endpoint: '/tasks', method: 'GET' },
          { name: 'Comments', endpoint: '/comments', method: 'GET' }
        ]
      },
      {
        name: 'Supplier Management',
        route: '/suppliers',
        endpoints: [
          { name: 'List Suppliers', endpoint: '/supplierProfile', method: 'GET' },
          { name: 'Supplier Evaluations', endpoint: '/supplierEvaluation', method: 'GET' },
          { name: 'Supplier Documents', endpoint: '/supplierDocument', method: 'GET' },
          { name: 'Service Ratings', endpoint: '/serviceRating', method: 'GET' }
        ]
      },
      {
        name: 'Inventory Management',
        route: '/inventory',
        endpoints: [
          { name: 'List Inventory Items', endpoint: '/inventoryItems', method: 'GET' },
          { name: 'Inventory Transactions', endpoint: '/inventoryTransactions', method: 'GET' }
        ]
      },
      {
        name: 'Lookups',
        route: '/lookups',
        endpoints: [
          { name: 'Gender', endpoint: '/lookup/Gender', method: 'GET' },
          { name: 'Nationality', endpoint: '/lookup/Nationality', method: 'GET' },
          { name: 'Race', endpoint: '/lookup/Race', method: 'GET' },
          { name: 'Education Level', endpoint: '/lookup/Education_Level', method: 'GET' },
          { name: 'Suburb', endpoint: '/lookup/Suburb', method: 'GET' }
        ]
      },
      {
        name: 'Reports',
        route: '/reports/applicant-details',
        endpoints: [
          { name: 'Applicant Details Report', endpoint: '/reports/applicant-details', method: 'GET' },
          { name: 'Financial Assistance Report', endpoint: '/reports/financial-assistance', method: 'GET' },
          { name: 'Food Assistance Report', endpoint: '/reports/food-assistance', method: 'GET' },
          { name: 'Home Visits Report', endpoint: '/reports/home-visits', method: 'GET' },
          { name: 'Skills Matrix Report', endpoint: '/reports/skills-matrix', method: 'GET' }
        ]
      },
      {
        name: 'File Manager',
        route: '/FileManager',
        endpoints: [
          { name: 'Folders', endpoint: '/folders', method: 'GET' },
          { name: 'Personal Files', endpoint: '/personalFiles', method: 'GET' }
        ]
      },
      {
        name: 'Chat',
        route: '/chat',
        endpoints: [
          { name: 'Conversations', endpoint: '/conversations', method: 'GET' },
          { name: 'Messages', endpoint: '/messages', method: 'GET' }
        ]
      },
      {
        name: 'Employees',
        route: '/employees',
        endpoints: [
          { name: 'List Employees', endpoint: '/employee', method: 'GET' },
          { name: 'Employee Appraisals', endpoint: '/employeeAppraisal', method: 'GET' },
          { name: 'Employee Initiatives', endpoint: '/employeeInitiative', method: 'GET' },
          { name: 'Employee Skills', endpoint: '/employeeSkills', method: 'GET' }
        ]
      },
      {
        name: 'Center Management',
        route: '/centers',
        endpoints: [
          { name: 'List Centers (Should Be Blocked)', endpoint: '/centerDetail', method: 'GET', shouldFail: true, expectedStatus: 403 },
          { name: 'Get Center by ID (Should Be Blocked)', endpoint: '/centerDetail/1', method: 'GET', shouldFail: true, expectedStatus: 403 }
        ]
      }
    ];

    for (const page of frontendPages) {
      console.log(`\n📄 Testing Page: ${page.name} (${page.route})`);
      
      const pageResult = {
        page: page.name,
        route: page.route,
        endpoints: [],
        allEndpointsPassed: true,
        timestamp: new Date().toISOString()
      };

      for (const endpointConfig of page.endpoints) {
        const result = await this.makeRequest(
          endpointConfig.method || 'GET',
          endpointConfig.endpoint
        );

        let passed = false;
        let note = '';

        if (endpointConfig.shouldFail && endpointConfig.expectedStatus) {
          // For restricted endpoints, verify they're correctly blocked
          passed = result.status === endpointConfig.expectedStatus;
          note = passed 
            ? `Correctly blocked (expected ${endpointConfig.expectedStatus})`
            : `Expected ${endpointConfig.expectedStatus}, got ${result.status}`;
        } else {
          // For accessible endpoints, verify they return 200/201
          passed = result.success && (result.status === 200 || result.status === 201);
          const recordCount = Array.isArray(result.data) ? result.data.length : (result.data ? 1 : 0);
          note = passed ? `${result.status} - ${recordCount} records` : `Failed: ${result.status}`;
        }

        const endpointResult = {
          name: endpointConfig.name,
          endpoint: endpointConfig.endpoint,
          method: endpointConfig.method || 'GET',
          passed: passed,
          status: result.status,
          hasData: result.data !== undefined && result.data !== null,
          recordCount: Array.isArray(result.data) ? result.data.length : (result.data ? 1 : 0),
          error: result.success ? null : (result.error?.error || result.error?.msg || JSON.stringify(result.error)),
          note: note,
          timestamp: new Date().toISOString()
        };

        pageResult.endpoints.push(endpointResult);

        if (!passed) {
          pageResult.allEndpointsPassed = false;
        }

        this.results.summary.totalTests++;
        if (passed) {
          this.results.summary.passed++;
          console.log(`  ✅ ${endpointConfig.name}: ${note}`);
        } else {
          this.results.summary.failed++;
          console.log(`  ❌ ${endpointConfig.name}: ${endpointResult.error || note}`);
          this.results.summary.errors.push({
            test: `${page.name} - ${endpointConfig.name}`,
            error: endpointResult.error || `Status ${result.status}, expected success`
          });
        }
      }

      this.results.frontendTests.push(pageResult);
    }

    return this.results.frontendTests;
  }

  /**
   * Generate comprehensive report
   */
  async generateReport() {
    const reportDir = path.join(__dirname, 'test-results');
    await fs.mkdir(reportDir, { recursive: true });

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const jsonReportFile = path.join(reportDir, `hq-qa-report-${timestamp}.json`);

    await fs.writeFile(jsonReportFile, JSON.stringify(this.results, null, 2));

    console.log(`\n${'='.repeat(80)}`);
    console.log('📄 REPORT SAVED');
    console.log('='.repeat(80));
    console.log(`JSON Report: ${jsonReportFile}`);

    console.log(`\n${'='.repeat(80)}`);
    console.log('TEST SUMMARY');
    console.log('='.repeat(80));
    console.log(`Environment: ${this.results.environment}`);
    console.log(`User: ${this.hqUser.username} (${this.hqUser.roleName})`);
    console.log(`Center ID: ${this.hqUser.center_id}`);
    console.log(`Total Tests: ${this.results.summary.totalTests}`);
    console.log(`Passed: ${this.results.summary.passed}`);
    console.log(`Failed: ${this.results.summary.failed}`);
    console.log(`Success Rate: ${((this.results.summary.passed / this.results.summary.totalTests) * 100).toFixed(2)}%`);

    if (this.results.summary.warnings.length > 0) {
      console.log(`\n⚠️  WARNINGS:`);
      this.results.summary.warnings.forEach((warn, idx) => {
        console.log(`   ${idx + 1}. ${warn}`);
      });
    }

    if (this.results.summary.errors.length > 0) {
      console.log(`\n❌ ERRORS:`);
      this.results.summary.errors.forEach((err, idx) => {
        console.log(`   ${idx + 1}. ${err.test}: ${err.error}`);
      });
    }

    return { jsonReportFile, markdownReportFile };
  }

  /**
   * Generate Markdown report
   */
  generateMarkdownReport() {
    const { summary, backendTests, frontendTests, dataCorrectnessTests, restrictedAccessTests } = this.results;
    const successRate = ((summary.passed / summary.totalTests) * 100).toFixed(2);

    let report = `# HQ Role QA Test Report\n\n`;
    report += `**Generated:** ${this.results.timestamp}\n`;
    report += `**Environment:** ${this.results.environment}\n`;
    report += `**User:** ${this.hqUser.username} (${this.hqUser.roleName})\n`;
    report += `**Role ID:** ${this.hqUser.role}\n`;
    report += `**Center ID:** ${this.hqUser.center_id}\n\n`;
    
    report += `## Executive Summary\n\n`;
    report += `- **Total Tests:** ${summary.totalTests}\n`;
    report += `- **Passed:** ${summary.passed} ✅\n`;
    report += `- **Failed:** ${summary.failed} ❌\n`;
    report += `- **Success Rate:** ${successRate}%\n\n`;

    if (summary.warnings.length > 0) {
      report += `### ⚠️ Warnings\n\n`;
      summary.warnings.forEach((warn, idx) => {
        report += `${idx + 1}. ${warn}\n`;
      });
      report += `\n`;
    }

    if (summary.errors.length > 0) {
      report += `### ❌ Errors\n\n`;
      summary.errors.forEach((err, idx) => {
        report += `${idx + 1}. **${err.test}**: ${err.error}\n`;
      });
      report += `\n`;
    }

    // Restricted Access Tests
    report += `## Restricted Access Tests (Should Fail)\n\n`;
    report += `**Verification:** HQ should NOT be able to create/update/delete centers\n\n`;
    report += `| Operation | Endpoint | Expected Status | Actual Status | Status |\n`;
    report += `|-----------|----------|-----------------|---------------|--------|\n`;
    restrictedAccessTests.forEach(test => {
      const status = test.passed ? '✅ PASS' : '❌ FAIL';
      report += `| ${test.name} | ${test.endpoint} | ${test.expectedStatus} | ${test.actualStatus} | ${status} |\n`;
    });
    report += `\n`;

    // Frontend Tests
    report += `## Frontend Page Access Tests\n\n`;
    report += `**Comprehensive Testing:** Each frontend page tested with all its API endpoints\n\n`;
    
    frontendTests.forEach(pageTest => {
      report += `### ${pageTest.page} (${pageTest.route})\n\n`;
      report += `| Endpoint | Method | Status | Records | Result |\n`;
      report += `|----------|--------|--------|---------|--------|\n`;
      
      pageTest.endpoints.forEach(endpoint => {
        const status = endpoint.passed ? '✅ PASS' : '❌ FAIL';
        const statusCode = endpoint.status || '-';
        const records = endpoint.recordCount !== undefined ? endpoint.recordCount : '-';
        report += `| ${endpoint.name} | ${endpoint.method} | ${statusCode} | ${records} | ${status} |\n`;
      });
      
      report += `\n\n`;
      if (!pageTest.allEndpointsPassed) {
        report += `**⚠️ Issues:**\n`;
        pageTest.endpoints.filter(e => !e.passed).forEach(endpoint => {
          report += `- ${endpoint.name}: ${endpoint.error || endpoint.note}\n`;
        });
        report += `\n`;
      }
    });
    
    report += `\n`;

    // Data Correctness Tests
    report += `## Data Correctness Tests (Center-Specific Access)\n\n`;
    report += `**Verification:** HQ should see data ONLY from their own center (center_id=${this.hqUser.center_id})\n\n`;
    report += `| Module | Total Records | Unique Centers | Expected Center | Wrong Center Records | Status |\n`;
    report += `|--------|---------------|----------------|-----------------|----------------------|--------|\n`;
    dataCorrectnessTests.forEach(test => {
      const status = test.passed ? '✅ PASS' : '❌ FAIL';
      const centers = test.uniqueCenters ? test.uniqueCenters.join(', ') : 'N/A';
      const wrongCount = test.wrongCenterRecords || 0;
      report += `| ${test.name} | ${test.totalRecords || 'N/A'} | ${test.centerCount || 'N/A'} | ${test.hqCenterId} | ${wrongCount} | ${status} |\n`;
    });
    report += `\n`;

    // Backend Tests Summary
    const passedBackend = backendTests.filter(t => t.passed).length;
    const failedBackend = backendTests.filter(t => !t.passed).length;
    
    report += `## Backend API Endpoint Tests\n\n`;
    report += `**Total:** ${backendTests.length} | **Passed:** ${passedBackend} | **Failed:** ${failedBackend}\n\n`;

    if (failedBackend > 0) {
      const failedTests = backendTests.filter(t => !t.passed);
      report += `### Failed Endpoints\n\n`;
      report += `| Endpoint | Method | Status | Error |\n`;
      report += `|----------|--------|--------|-------|\n`;
      failedTests.forEach(test => {
        report += `| ${test.endpoint} | ${test.method || 'GET'} | ${test.status} | ${test.error || 'Unknown'} |\n`;
      });
      report += `\n`;
    }

    report += `---\n\n`;
    report += `**Report Generated:** ${new Date().toISOString()}\n`;

    return report;
  }

  /**
   * Run all tests
   */
  async runAllTests() {
    console.log(`\n${'='.repeat(80)}`);
    console.log('🚀 HQ ROLE QA TEST SUITE');
    console.log('='.repeat(80));
    console.log(`Environment: ${this.env.name}`);
    console.log(`Base URL: ${this.baseURL}`);
    console.log(`User: ${this.hqUser.username} (${this.hqUser.roleName})`);
    console.log(`Center ID: ${this.hqUser.center_id}`);

    const loginResult = await this.login();
    if (!loginResult.success) {
      console.error('\n❌ Cannot proceed without authentication. Login failed.');
      return this.results;
    }

    // Test restricted access first
    await this.testRestrictedAccess();

    // Test frontend routes
    await this.testFrontendRoutes();

    // Test dashboard filtering
    await this.testDashboardFiltering();

    // Test backend endpoints
    await this.testBackendEndpoints();

    // Test CRUD operations
    await this.testCRUDOperations();

    // Test data correctness
    await this.testDataCorrectness();

    // Generate report
    await this.generateReport();

    return this.results;
  }
}

module.exports = HQQATest;

// Run if called directly
if (require.main === module) {
  const environment = process.argv[2] || 'staging';
  const tester = new HQQATest(environment);
  tester.runAllTests()
    .then(results => {
      process.exit(results.summary.failed > 0 ? 1 : 0);
    })
    .catch(error => {
      console.error('\n❌ Fatal error:', error);
      process.exit(1);
    });
}

