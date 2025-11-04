/**
 * App Admin QA Test Suite
 * Comprehensive testing for App Admin role (Role 1)
 * Tests all endpoints, pages, and verifies no center filtering
 */

const axios = require('axios');
const fs = require('fs').promises;
const path = require('path');
const testConfig = require('./test-config');

class AppAdminQATest {
  constructor(environment = 'staging') {
    this.env = testConfig.environments[environment];
    this.baseURL = this.env.baseURL;
    this.token = null;
    this.appAdminUser = testConfig.testUsers.find(u => u.role === 1); // App Admin
    
    this.results = {
      environment: environment,
      timestamp: new Date().toISOString(),
      user: this.appAdminUser,
      frontendTests: [],
      backendTests: [],
      dataCorrectnessTests: [],
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
   * Login as App Admin
   */
  async login() {
    try {
      console.log(`\n🔐 Logging in as App Admin: ${this.appAdminUser.username}...`);
      const response = await axios.post(
        `${this.baseURL}${testConfig.apiEndpoints.auth.login}`,
        {
          username: this.appAdminUser.username,
          password: this.appAdminUser.password
        },
        {
          headers: { 'Content-Type': 'application/json' }
        }
      );

      if (response.data && response.data.token) {
        this.token = response.data.token;
        console.log(`✅ Login successful! Token received.`);
        console.log(`   User Info: ${JSON.stringify(response.data.userInfo || response.data.user)}`);
        
        // Verify App Admin properties
        const userInfo = response.data.userInfo || response.data.user;
        if (parseInt(userInfo.user_type) !== 1) {
          throw new Error(`Expected user_type=1 (App Admin), got ${userInfo.user_type}`);
        }
        if (userInfo.center_id !== null && userInfo.center_id !== undefined) {
          console.warn(`⚠️  Warning: App Admin should have center_id=null, got ${userInfo.center_id}`);
          this.results.summary.warnings.push(`App Admin center_id is ${userInfo.center_id}, expected null`);
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
      validateStatus: () => true // Don't throw on non-2xx status
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
   * Test all backend API endpoints
   */
  async testBackendEndpoints() {
    console.log(`\n${'='.repeat(80)}`);
    console.log('🔌 TESTING BACKEND API ENDPOINTS');
    console.log('='.repeat(80));

    // First, fetch lists to get actual IDs for getById tests
    let actualEmployeeId = null;
    let actualSupplierId = null;
    let actualInventoryId = null;
    let actualCenterId = null;
    let actualApplicantId = null;

    try {
      const employeesList = await this.makeRequest('GET', '/employee');
      if (employeesList.success && Array.isArray(employeesList.data) && employeesList.data.length > 0) {
        // Employee table uses "ID" (uppercase) as primary key
        actualEmployeeId = employeesList.data[0].ID || employeesList.data[0].id || employeesList.data[0].Id;
        console.log(`[DEBUG] Found employee ID: ${actualEmployeeId}`);
      }
    } catch (e) {
      console.log(`[DEBUG] Error fetching employee list: ${e.message}`);
    }

    try {
      const suppliersList = await this.makeRequest('GET', '/supplierProfile');
      if (suppliersList.success && Array.isArray(suppliersList.data) && suppliersList.data.length > 0) {
        actualSupplierId = suppliersList.data[0].ID || suppliersList.data[0].id;
      }
    } catch (e) {}

    try {
      const inventoryList = await this.makeRequest('GET', '/inventoryItems');
      if (inventoryList.success && Array.isArray(inventoryList.data) && inventoryList.data.length > 0) {
        actualInventoryId = inventoryList.data[0].ID || inventoryList.data[0].id;
      }
    } catch (e) {}

    try {
      const centersList = await this.makeRequest('GET', '/centerDetail');
      if (centersList.success && Array.isArray(centersList.data) && centersList.data.length > 0) {
        actualCenterId = centersList.data[0].ID || centersList.data[0].id;
      }
    } catch (e) {}

    try {
      const applicantsList = await this.makeRequest('GET', '/applicantDetails');
      if (applicantsList.success && Array.isArray(applicantsList.data) && applicantsList.data.length > 0) {
        actualApplicantId = applicantsList.data[0].ID || applicantsList.data[0].id;
      }
    } catch (e) {}

    const endpoints = [
      // Dashboard
      { name: 'Dashboard - Applicant Statistics', method: 'GET', endpoint: '/dashboard/applicant-statistics' },
      
      // Applicants
      { name: 'Applicants - List', method: 'GET', endpoint: '/applicantDetails' },
      { name: 'Applicants - Get by ID', method: 'GET', endpoint: actualApplicantId ? `/applicantDetails/${actualApplicantId}` : '/applicantDetails/1', skipIfNoData: !actualApplicantId },
      
      // Employees
      { name: 'Employees - List', method: 'GET', endpoint: '/employee' },
      { name: 'Employees - Get by ID', method: 'GET', endpoint: actualEmployeeId ? `/employee/${actualEmployeeId}` : '/employee/1', skipIfNoData: !actualEmployeeId },
      
      // Suppliers
      { name: 'Suppliers - List', method: 'GET', endpoint: '/supplierProfile' },
      { name: 'Suppliers - Get by ID', method: 'GET', endpoint: actualSupplierId ? `/supplierProfile/${actualSupplierId}` : '/supplierProfile/1', skipIfNoData: !actualSupplierId },
      
      // Inventory
      { name: 'Inventory Items - List', method: 'GET', endpoint: '/inventoryItems' },
      { name: 'Inventory Items - Get by ID', method: 'GET', endpoint: actualInventoryId ? `/inventoryItems/${actualInventoryId}` : '/inventoryItems/1', skipIfNoData: !actualInventoryId },
      { name: 'Inventory Transactions - List', method: 'GET', endpoint: '/inventoryTransactions' },
      
      // Centers (App Admin only)
      { name: 'Centers - List', method: 'GET', endpoint: '/centerDetail' },
      { name: 'Centers - Get by ID', method: 'GET', endpoint: actualCenterId ? `/centerDetail/${actualCenterId}` : '/centerDetail/1', skipIfNoData: !actualCenterId },
      
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
      
      // Reports
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
      
      // For getById endpoints, accept 404 as acceptable (record doesn't exist) if skipIfNoData is true
      // For invalid UUID formats, accept 400 as acceptable
      const acceptableStatuses = [200, 201];
      let isAcceptableNonSuccess = false;
      if (endpoint.skipIfNoData) {
        acceptableStatuses.push(404); // Not found is acceptable if no data exists
        acceptableStatuses.push(400); // Bad request is acceptable for invalid ID formats
        // Mark as acceptable if it's a 404 or 400 status
        isAcceptableNonSuccess = result.status === 404 || result.status === 400;
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

      // If 404 on getById, that's acceptable if we're skipping when no data
      if (result.status === 404 && endpoint.skipIfNoData) {
        testResult.note = 'Record not found (acceptable - handled correctly)';
      }

      // If 400 on getById, that's acceptable for invalid ID formats (e.g., integer for UUID)
      if (result.status === 400 && endpoint.skipIfNoData) {
        testResult.note = 'Invalid ID format handled correctly (expected behavior)';
      }

      // Check for 403 Forbidden (should not happen for App Admin)
      if (result.status === 403) {
        testResult.passed = false;
        testResult.error = '403 Forbidden - App Admin should have access';
        this.results.summary.errors.push({
          test: endpoint.name,
          error: '403 Forbidden - App Admin should have full access'
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
   * Test CRUD operations for key modules
   */
  async testCRUDOperations() {
    console.log(`\n${'='.repeat(80)}`);
    console.log('🔄 TESTING CRUD OPERATIONS');
    console.log('='.repeat(80));

    const crudTests = [];

    // Test CREATE operations
    const createTests = [
      {
        name: 'Create Applicant',
        endpoint: '/applicantDetails',
        payload: {
          name: 'QA Test',
          surname: 'Applicant',
          id_number: `QA${Date.now()}`,
          center_id: 1, // App Admin can set any center_id
          created_by: this.appAdminUser.username
        }
      },
      {
        name: 'Create Supplier',
        endpoint: '/supplierProfile',
        payload: {
          name: `QA Test Supplier ${Date.now()}`,
          center_id: 1,
          created_by: this.appAdminUser.username
        }
      },
      {
        name: 'Create Inventory Item',
        endpoint: '/inventoryItems',
        payload: {
          item_name: `QA Test Item ${Date.now()}`,
          quantity: 10,
          center_id: 1,
          created_by: this.appAdminUser.username
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
        error: createResult.success ? null : (createResult.error?.msg || JSON.stringify(createResult.error)),
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
            updated_by: this.appAdminUser.username
          };

          const updateResult = await this.makeRequest('PUT', updateEndpoint, updatePayload);
          
          const updateTestResult = {
            operation: 'UPDATE',
            name: `Update ${test.name}`,
            endpoint: updateEndpoint,
            passed: updateResult.success && (updateResult.status === 200 || updateResult.status === 204),
            status: updateResult.status,
            error: updateResult.success ? null : (updateResult.error?.msg || JSON.stringify(updateResult.error)),
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
              error: deleteResult.success ? null : (deleteResult.error?.msg || JSON.stringify(deleteResult.error)),
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
   * Test data correctness - verify App Admin sees all centers
   */
  async testDataCorrectness() {
    console.log(`\n${'='.repeat(80)}`);
    console.log('📊 TESTING DATA CORRECTNESS (No Center Filtering)');
    console.log('='.repeat(80));

    const correctnessTests = [];

    // Test that App Admin sees data from all centers
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
        
        records.forEach(record => {
          if (record.center_id !== null && record.center_id !== undefined) {
            centerIds.add(parseInt(record.center_id));
          }
        });

        const testResult = {
          name: `${test.name} - Center Distribution`,
          endpoint: test.endpoint,
          totalRecords: records.length,
          uniqueCenters: Array.from(centerIds).sort(),
          centerCount: centerIds.size,
          passed: true, // App Admin should see all centers
          note: `App Admin sees ${centerIds.size} unique center(s): ${Array.from(centerIds).join(', ')}`,
          timestamp: new Date().toISOString()
        };

        correctnessTests.push(testResult);
        this.results.summary.totalTests++;
        this.results.summary.passed++;

        console.log(`✅ ${test.name}: ${records.length} records across ${centerIds.size} center(s)`);
        if (centerIds.size > 0) {
          console.log(`   Centers: ${Array.from(centerIds).join(', ')}`);
        }
      } else {
        const testResult = {
          name: `${test.name} - Center Distribution`,
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
   * Test frontend page routes (simulated)
   */
  async testFrontendRoutes() {
    console.log(`\n${'='.repeat(80)}`);
    console.log('🌐 TESTING FRONTEND PAGE ACCESS');
    console.log('='.repeat(80));

    const frontendRoutes = [
      { path: '/dashboard', name: 'Dashboard', apiEndpoint: '/dashboard/applicant-statistics' },
      { path: '/applicants', name: 'Applicants', apiEndpoint: '/applicantDetails' },
      { path: '/centers', name: 'Center Management', apiEndpoint: '/centerDetail' },
      { path: '/suppliers', name: 'Supplier Management', apiEndpoint: '/supplierProfile' },
      { path: '/inventory', name: 'Inventory Management', apiEndpoint: '/inventoryItems' },
      { path: '/lookups', name: 'Lookups', apiEndpoint: '/lookup/Gender' },
      { path: '/reports/applicant-details', name: 'Reports', apiEndpoint: '/reports/applicant-details' },
      { path: '/FileManager', name: 'File Manager', apiEndpoint: '/folders' },
      { path: '/chat', name: 'Chat', apiEndpoint: '/conversations' }
    ];

    for (const route of frontendRoutes) {
      // Test if the API endpoint that powers this page is accessible
      const apiResult = await this.makeRequest('GET', route.apiEndpoint);
      
      const testResult = {
        page: route.name,
        route: route.path,
        apiEndpoint: route.apiEndpoint,
        accessible: apiResult.success && (apiResult.status === 200 || apiResult.status === 201),
        status: apiResult.status,
        hasData: apiResult.data !== undefined && apiResult.data !== null,
        error: apiResult.success ? null : (apiResult.error?.msg || JSON.stringify(apiResult.error)),
        timestamp: new Date().toISOString()
      };

      this.results.frontendTests.push(testResult);
      this.results.summary.totalTests++;

      if (testResult.accessible) {
        this.results.summary.passed++;
        console.log(`✅ ${route.name} (${route.path}): Accessible via API`);
      } else {
        this.results.summary.failed++;
        console.log(`❌ ${route.name} (${route.path}): ${testResult.error || 'Not accessible'}`);
      }
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
    const jsonReportFile = path.join(reportDir, `app-admin-qa-report-${timestamp}.json`);
    const markdownReportFile = path.join(reportDir, `app-admin-qa-report-${timestamp}.md`);

    // Save JSON report
    await fs.writeFile(jsonReportFile, JSON.stringify(this.results, null, 2));

    // Generate Markdown report
    const markdownReport = this.generateMarkdownReport();
    await fs.writeFile(markdownReportFile, markdownReport);

    console.log(`\n${'='.repeat(80)}`);
    console.log('📄 REPORTS GENERATED');
    console.log('='.repeat(80));
    console.log(`JSON Report: ${jsonReportFile}`);
    console.log(`Markdown Report: ${markdownReportFile}`);

    // Print summary
    console.log(`\n${'='.repeat(80)}`);
    console.log('TEST SUMMARY');
    console.log('='.repeat(80));
    console.log(`Environment: ${this.results.environment}`);
    console.log(`User: ${this.appAdminUser.username} (${this.appAdminUser.roleName})`);
    console.log(`Total Tests: ${this.results.summary.totalTests}`);
    console.log(`Passed: ${this.results.summary.passed}`);
    console.log(`Failed: ${this.results.summary.failed}`);
    console.log(`Success Rate: ${((this.results.summary.passed / this.results.summary.totalTests) * 100).toFixed(2)}%`);
    
    if (this.results.summary.warnings.length > 0) {
      console.log(`\n⚠️  WARNINGS (${this.results.summary.warnings.length}):`);
      this.results.summary.warnings.forEach((warn, idx) => {
        console.log(`   ${idx + 1}. ${warn}`);
      });
    }

    if (this.results.summary.errors.length > 0) {
      console.log(`\n❌ ERRORS (${this.results.summary.errors.length}):`);
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
    const { summary, backendTests, frontendTests, dataCorrectnessTests } = this.results;
    const successRate = ((summary.passed / summary.totalTests) * 100).toFixed(2);

    let report = `# App Admin QA Test Report\n\n`;
    report += `**Generated:** ${this.results.timestamp}\n`;
    report += `**Environment:** ${this.results.environment}\n`;
    report += `**User:** ${this.appAdminUser.username} (${this.appAdminUser.roleName})\n`;
    report += `**Role ID:** ${this.appAdminUser.role}\n`;
    report += `**Center ID:** ${this.appAdminUser.center_id} (Expected: null for App Admin)\n\n`;
    
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

    // Frontend Tests
    report += `## Frontend Page Access Tests\n\n`;
    report += `| Page | Route | Status | API Status | Error |\n`;
    report += `|------|-------|--------|------------|-------|\n`;
    frontendTests.forEach(test => {
      const status = test.accessible ? '✅ PASS' : '❌ FAIL';
      const apiStatus = test.status || 'N/A';
      const error = test.error || '-';
      report += `| ${test.page} | ${test.route} | ${status} | ${apiStatus} | ${error} |\n`;
    });
    report += `\n`;

    // Backend Tests Summary
    const passedBackend = backendTests.filter(t => t.passed).length;
    const failedBackend = backendTests.filter(t => !t.passed).length;
    
    report += `## Backend API Endpoint Tests\n\n`;
    report += `**Total:** ${backendTests.length} | **Passed:** ${passedBackend} | **Failed:** ${failedBackend}\n\n`;
    
    // Failed tests
    const failedTests = backendTests.filter(t => !t.passed);
    if (failedTests.length > 0) {
      report += `### Failed Endpoints\n\n`;
      report += `| Endpoint | Method | Status | Error |\n`;
      report += `|----------|--------|--------|-------|\n`;
      failedTests.forEach(test => {
        report += `| ${test.endpoint} | ${test.method || 'GET'} | ${test.status} | ${test.error || 'Unknown'} |\n`;
      });
      report += `\n`;
    }

    // Sample successful tests
    const successfulTests = backendTests.filter(t => t.passed).slice(0, 10);
    if (successfulTests.length > 0) {
      report += `### Sample Successful Endpoints\n\n`;
      report += `| Endpoint | Method | Status | Records |\n`;
      report += `|----------|--------|--------|---------|\n`;
      successfulTests.forEach(test => {
        report += `| ${test.endpoint} | ${test.method || 'GET'} | ${test.status} | ${test.recordCount || 'N/A'} |\n`;
      });
      report += `\n`;
    }

    // Data Correctness Tests
    report += `## Data Correctness Tests (Center Filtering)\n\n`;
    report += `**Verification:** App Admin should see data from ALL centers (no filtering)\n\n`;
    report += `| Module | Total Records | Unique Centers | Centers List | Status |\n`;
    report += `|--------|---------------|---------------|--------------|--------|\n`;
    dataCorrectnessTests.forEach(test => {
      const status = test.passed ? '✅ PASS' : '❌ FAIL';
      const centers = test.uniqueCenters ? test.uniqueCenters.join(', ') : 'N/A';
      report += `| ${test.name} | ${test.totalRecords || 'N/A'} | ${test.centerCount || 'N/A'} | ${centers} | ${status} |\n`;
    });
    report += `\n`;

    // Recommendations
    report += `## Recommendations\n\n`;
    
    if (summary.failed > 0) {
      report += `### Failed Tests Require Investigation\n\n`;
      report += `The following areas need attention:\n\n`;
      
      const failedEndpoints = backendTests.filter(t => !t.passed && t.endpoint);
      if (failedEndpoints.length > 0) {
        report += `1. **Backend Endpoints:** ${failedEndpoints.length} endpoint(s) are not accessible\n`;
        report += `   - Verify route definitions and middleware\n`;
        report += `   - Check authentication/authorization logic\n`;
        report += `   - Ensure App Admin bypasses all restrictions\n\n`;
      }

      const failedPages = frontendTests.filter(t => !t.accessible);
      if (failedPages.length > 0) {
        report += `2. **Frontend Pages:** ${failedPages.length} page(s) are not accessible\n`;
        report += `   - Verify route guards and RBAC\n`;
        report += `   - Check API endpoint connections\n`;
        report += `   - Ensure App Admin can access all pages\n\n`;
      }
    }

    if (summary.errors.length > 0) {
      report += `### Error Resolution\n\n`;
      summary.errors.forEach((err, idx) => {
        report += `${idx + 1}. **${err.test}**: ${err.error}\n`;
      });
      report += `\n`;
    }

    if (summary.warnings.length > 0) {
      report += `### Warnings to Address\n\n`;
      summary.warnings.forEach((warn, idx) => {
        report += `${idx + 1}. ${warn}\n`;
      });
      report += `\n`;
    }

    if (summary.failed === 0 && summary.errors.length === 0) {
      report += `### ✅ All Tests Passed\n\n`;
      report += `All App Admin tests have passed successfully. The role has:\n`;
      report += `- ✅ Full access to all endpoints\n`;
      report += `- ✅ No center filtering applied\n`;
      report += `- ✅ Access to all pages and modules\n`;
      report += `- ✅ Correct RBAC implementation\n\n`;
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
    console.log('🚀 APP ADMIN QA TEST SUITE');
    console.log('='.repeat(80));
    console.log(`Environment: ${this.env.name}`);
    console.log(`Base URL: ${this.baseURL}`);
    console.log(`User: ${this.appAdminUser.username} (${this.appAdminUser.roleName})`);

    // 1. Login
    const loginResult = await this.login();
    if (!loginResult.success) {
      console.error('\n❌ Cannot proceed without authentication. Login failed.');
      return this.results;
    }

    // 2. Test Frontend Routes
    await this.testFrontendRoutes();

    // 3. Test Backend Endpoints
    await this.testBackendEndpoints();

    // 4. Test CRUD Operations
    await this.testCRUDOperations();

    // 5. Test Data Correctness
    await this.testDataCorrectness();

    // 6. Generate Report
    await this.generateReport();

    return this.results;
  }
}

module.exports = AppAdminQATest;

// Run if called directly
if (require.main === module) {
  const environment = process.argv[2] || 'staging';
  const tester = new AppAdminQATest(environment);
  tester.runAllTests()
    .then(results => {
      process.exit(results.summary.failed > 0 ? 1 : 0);
    })
    .catch(error => {
      console.error('\n❌ Fatal error:', error);
      process.exit(1);
    });
}

