/**
 * API Test Runner
 * Automated API endpoint testing with role-based access validation
 */

const axios = require('axios');
const fs = require('fs').promises;
const path = require('path');
const testConfig = require('./test-config');

class APITestRunner {
  constructor(environment = 'staging') {
    this.env = testConfig.environments[environment];
    this.baseURL = this.env.baseURL;
    this.results = {
      environment: environment,
      timestamp: new Date().toISOString(),
      tests: [],
      summary: {
        total: 0,
        passed: 0,
        failed: 0,
        errors: []
      }
    };
  }

  /**
   * Login and get JWT token
   */
  async login(user) {
    try {
      const response = await axios.post(
        `${this.baseURL}${testConfig.apiEndpoints.auth.login}`,
        {
          username: user.username,
          password: user.password
        },
        {
          headers: { 'Content-Type': 'application/json' }
        }
      );

      if (response.data && response.data.token) {
        return {
          token: response.data.token,
          userInfo: response.data.userInfo || response.data.user,
          success: true
        };
      }
      return { success: false, error: 'No token in response' };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.msg || error.message,
        status: error.response?.status
      };
    }
  }

  /**
   * Make authenticated API request
   */
  async makeRequest(method, endpoint, token, data = null, params = {}) {
    const config = {
      method: method.toLowerCase(),
      url: `${this.baseURL}${endpoint}`,
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      params: params
    };

    if (data && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
      config.data = data;
    }

    try {
      const response = await axios(config);
      return {
        success: true,
        status: response.status,
        data: response.data,
        headers: response.headers
      };
    } catch (error) {
      return {
        success: false,
        status: error.response?.status,
        error: error.response?.data || error.message,
        headers: error.response?.headers
      };
    }
  }

  /**
   * Test authentication flow
   */
  async testAuthentication(user) {
    const testName = `Authentication - ${user.roleName} (${user.username})`;
    console.log(`\n🔐 Testing ${testName}...`);

    const loginResult = await this.login(user);

    const result = {
      test: testName,
      user: user.username,
      role: user.roleName,
      passed: loginResult.success,
      status: loginResult.status || (loginResult.success ? 200 : 401),
      response: loginResult.userInfo || loginResult.error,
      timestamp: new Date().toISOString()
    };

    this.recordTest(result);
    return loginResult;
  }

  /**
   * Test dashboard endpoint
   */
  async testDashboard(token, user) {
    const testName = `Dashboard - ${user.roleName}`;
    console.log(`\n📊 Testing ${testName}...`);

    const result = await this.makeRequest(
      'GET',
      testConfig.apiEndpoints.dashboard.applicantStatistics,
      token
    );

    const testResult = {
      test: testName,
      user: user.username,
      role: user.roleName,
      endpoint: testConfig.apiEndpoints.dashboard.applicantStatistics,
      method: 'GET',
      passed: result.success && result.status === 200,
      status: result.status,
      response: result.success ? 'Data received' : result.error,
      dataKeys: result.success && result.data ? Object.keys(result.data) : [],
      timestamp: new Date().toISOString()
    };

    // Check dashboard data scope by role:
    // - App Admin (role 1): Global dashboards (aggregate data, no center filter)
    // - HQ (role 2): Dashboard for their assigned center only (center-specific data)
    // - Center-Based Roles (3,4,5): Dashboard for their own center only (center-specific data)
    if (user.role === 1 && result.success) {
      testResult.notes = 'App Admin should see aggregate data (global, no center filter)';
    } else if (user.role !== 1 && result.success) {
      testResult.notes = 'HQ and center-based roles should see center-specific data only (dashboard for their assigned center)';
    }

    this.recordTest(testResult);
    return result;
  }

  /**
   * Test CRUD operations
   */
  async testCRUD(module, endpoints, token, user, testData = {}) {
    const results = [];
    const testName = `${module} CRUD - ${user.roleName}`;
    console.log(`\n🔄 Testing ${testName}...`);

    // Test READ (List)
    const listResult = await this.makeRequest('GET', endpoints.list, token);
    results.push({
      test: `${testName} - List`,
      operation: 'READ',
      user: user.username,
      role: user.roleName,
      endpoint: endpoints.list,
      passed: listResult.success && (listResult.status === 200 || listResult.status === 403),
      status: listResult.status,
      response: listResult.success ? `Found ${Array.isArray(listResult.data) ? listResult.data.length : 'N/A'} records` : listResult.error,
      timestamp: new Date().toISOString()
    });

    // Test CREATE (if user has write access)
    if (!user.readOnly && user.expectedAccess[module.toLowerCase()]) {
      const createPayload = testData.create || {
        name: `Test ${module} ${Date.now()}`,
        created_by: user.username
      };
      
      const createResult = await this.makeRequest('POST', endpoints.create, token, createPayload);
      results.push({
        test: `${testName} - Create`,
        operation: 'CREATE',
        user: user.username,
        role: user.roleName,
        endpoint: endpoints.create,
        passed: createResult.success && (createResult.status === 200 || createResult.status === 201),
        status: createResult.status,
        response: createResult.success ? 'Created successfully' : createResult.error,
        createdId: createResult.data?.id || createResult.data?.ID,
        timestamp: new Date().toISOString()
      });

      // If create succeeded, test UPDATE and DELETE
      if (createResult.success && createResult.data) {
        const createdId = createResult.data.id || createResult.data.ID;

        // Test UPDATE
        if (endpoints.update) {
          const updateEndpoint = endpoints.update.replace(':id', createdId);
          const updatePayload = testData.update || {
            ...createPayload,
            updated_by: user.username
          };
          
          const updateResult = await this.makeRequest('PUT', updateEndpoint, token, updatePayload);
          results.push({
            test: `${testName} - Update`,
            operation: 'UPDATE',
            user: user.username,
            role: user.roleName,
            endpoint: updateEndpoint,
            passed: updateResult.success && (updateResult.status === 200 || updateResult.status === 204),
            status: updateResult.status,
            response: updateResult.success ? 'Updated successfully' : updateResult.error,
            timestamp: new Date().toISOString()
          });
        }

        // Test DELETE
        if (endpoints.delete) {
          const deleteEndpoint = endpoints.delete.replace(':id', createdId);
          const deleteResult = await this.makeRequest('DELETE', deleteEndpoint, token);
          results.push({
            test: `${testName} - Delete`,
            operation: 'DELETE',
            user: user.username,
            role: user.roleName,
            endpoint: deleteEndpoint,
            passed: deleteResult.success && (deleteResult.status === 200 || deleteResult.status === 204),
            status: deleteResult.status,
            response: deleteResult.success ? 'Deleted successfully' : deleteResult.error,
            timestamp: new Date().toISOString()
          });
        }
      }
    } else {
      // Test that READ-ONLY users get 403 on CREATE
      const createResult = await this.makeRequest('POST', endpoints.create, token, testData.create || {});
      results.push({
        test: `${testName} - Create (Should Fail)`,
        operation: 'CREATE',
        user: user.username,
        role: user.roleName,
        endpoint: endpoints.create,
        passed: !createResult.success && (createResult.status === 403 || createResult.status === 401),
        status: createResult.status,
        response: createResult.status === 403 ? 'Correctly blocked' : createResult.error,
        timestamp: new Date().toISOString()
      });
    }

    results.forEach(r => this.recordTest(r));
    return results;
  }

  /**
   * Test lookup endpoints
   */
  async testLookups(token, user) {
    const results = [];
    console.log(`\n🔍 Testing Lookups - ${user.roleName}...`);

    for (const tableName of testConfig.apiEndpoints.lookups.common) {
      const endpoint = testConfig.apiEndpoints.lookups.list.replace(':tableName', tableName);
      const result = await this.makeRequest('GET', endpoint, token);

      results.push({
        test: `Lookup - ${tableName}`,
        user: user.username,
        role: user.roleName,
        endpoint: endpoint,
        passed: result.success && result.status === 200,
        status: result.status,
        response: result.success ? `Found ${Array.isArray(result.data) ? result.data.length : 'N/A'} records` : result.error,
        timestamp: new Date().toISOString()
      });

      this.recordTest(results[results.length - 1]);
    }

    return results;
  }

  /**
   * Test unauthorized access attempts
   */
  async testUnauthorizedAccess(token, user) {
    const results = [];
    console.log(`\n🚫 Testing Unauthorized Access - ${user.roleName}...`);

    // Test accessing restricted endpoints
    const restrictedEndpoints = [];

    // Centers endpoint (App Admin only)
    if (user.role !== 1) {
      restrictedEndpoints.push({
        name: 'Centers Management',
        endpoint: '/centerDetail',
        method: 'GET',
        expectedStatus: 403
      });
    }

    // Reports endpoint (Caseworkers excluded)
    if (user.role === 5) {
      restrictedEndpoints.push({
        name: 'Reports',
        endpoint: testConfig.apiEndpoints.reports.applicantDetails,
        method: 'GET',
        expectedStatus: 403
      });
    }

    for (const endpoint of restrictedEndpoints) {
      const result = await this.makeRequest(endpoint.method, endpoint.endpoint, token);
      results.push({
        test: `Unauthorized Access - ${endpoint.name}`,
        user: user.username,
        role: user.roleName,
        endpoint: endpoint.endpoint,
        passed: !result.success && result.status === endpoint.expectedStatus,
        status: result.status,
        expectedStatus: endpoint.expectedStatus,
        response: result.error,
        timestamp: new Date().toISOString()
      });

      this.recordTest(results[results.length - 1]);
    }

    return results;
  }

  /**
   * Test center_id filtering
   */
  async testCenterFiltering(token, user) {
    const results = [];
    console.log(`\n🏢 Testing Center Filtering - ${user.roleName}...`);

    // Test applicants endpoint - should filter by center_id for non-App Admin and non-HQ
    // HQ (role 2) and App Admin (role 1) should see all centers
    const applicantsResult = await this.makeRequest('GET', testConfig.apiEndpoints.applicants.list, token);
    
    if (applicantsResult.success) {
      const applicants = Array.isArray(applicantsResult.data) ? applicantsResult.data : [];
      // ✅ Fix: Convert to same type for comparison and exclude HQ (role 2) from filtering check
      const userCenterId = user.center_id ? parseInt(user.center_id) : null;
      const hasWrongCenter = applicants.some(a => {
        const applicantCenterId = a.center_id ? parseInt(a.center_id) : null;
        return applicantCenterId && applicantCenterId !== userCenterId;
      });
      
      // App Admin (1) and HQ (2) can see all centers - should not filter
      const shouldSeeAll = user.role === 1 || user.role === 2;
      const passed = shouldSeeAll || !hasWrongCenter;

      results.push({
        test: 'Center Filtering - Applicants',
        user: user.username,
        role: user.roleName,
        passed: passed,
        status: applicantsResult.status,
        response: shouldSeeAll
          ? `${user.roleName} sees ${applicants.length} applicants (all centers - correct)` 
          : hasWrongCenter
            ? `Found applicants from wrong center (should only see center_id=${userCenterId})`
            : `Found ${applicants.length} applicants (correctly filtered by center_id=${userCenterId})`,
        filteredCorrectly: passed,
        timestamp: new Date().toISOString()
      });

      this.recordTest(results[results.length - 1]);
    }

    return results;
  }

  /**
   * Record test result
   */
  recordTest(result) {
    this.results.tests.push(result);
    this.results.summary.total++;
    
    if (result.passed) {
      this.results.summary.passed++;
    } else {
      this.results.summary.failed++;
      if (result.error || result.response) {
        this.results.summary.errors.push({
          test: result.test,
          error: result.error || result.response
        });
      }
    }
  }

  /**
   * Generate test report
   */
  async generateReport() {
    const reportDir = path.join(__dirname, 'test-results');
    await fs.mkdir(reportDir, { recursive: true });

    const reportFile = path.join(
      reportDir,
      `api-test-report-${this.results.environment}-${Date.now()}.json`
    );

    await fs.writeFile(reportFile, JSON.stringify(this.results, null, 2));
    console.log(`\n📄 Test report saved to: ${reportFile}`);

    // Generate summary
    console.log('\n' + '='.repeat(60));
    console.log('TEST SUMMARY');
    console.log('='.repeat(60));
    console.log(`Environment: ${this.results.environment}`);
    console.log(`Total Tests: ${this.results.summary.total}`);
    console.log(`Passed: ${this.results.summary.passed}`);
    console.log(`Failed: ${this.results.summary.failed}`);
    console.log(`Success Rate: ${((this.results.summary.passed / this.results.summary.total) * 100).toFixed(2)}%`);
    
    if (this.results.summary.errors.length > 0) {
      console.log('\n❌ ERRORS:');
      this.results.summary.errors.forEach((err, idx) => {
        console.log(`${idx + 1}. ${err.test}: ${JSON.stringify(err.error)}`);
      });
    }

    return reportFile;
  }

  /**
   * Run all tests for a user
   */
  async runTestsForUser(user) {
    console.log(`\n${'='.repeat(60)}`);
    console.log(`Testing user: ${user.username} (${user.roleName})`);
    console.log('='.repeat(60));

    // 1. Test authentication
    const loginResult = await this.testAuthentication(user);
    if (!loginResult.success) {
      console.log(`❌ Login failed for ${user.username}, skipping further tests`);
      return;
    }

    const token = loginResult.token;

    // 2. Test dashboard
    await this.testDashboard(token, user);

    // 3. Test CRUD operations for accessible modules
    if (user.expectedAccess.applicants) {
      await this.testCRUD('Applicants', testConfig.apiEndpoints.applicants, token, user, {
        create: {
          name: 'Test Applicant',
          surname: 'Test',
          id_number: `TEST${Date.now()}`,
          center_id: user.center_id || 1,
          created_by: user.username
        }
      });
    }

    if (user.expectedAccess.suppliers && !user.readOnly) {
      await this.testCRUD('Suppliers', testConfig.apiEndpoints.suppliers, token, user, {
        create: {
          name: `Test Supplier ${Date.now()}`,
          center_id: user.center_id || 1,
          created_by: user.username
        }
      });
    }

    // 4. Test lookups
    await this.testLookups(token, user);

    // 5. Test unauthorized access
    await this.testUnauthorizedAccess(token, user);

    // 6. Test center filtering
    if (user.center_id) {
      await this.testCenterFiltering(token, user);
    }
  }

  /**
   * Run all tests
   */
  async runAllTests() {
    console.log(`\n🚀 Starting API tests for environment: ${this.env.name}`);
    console.log(`Base URL: ${this.baseURL}\n`);

    for (const user of testConfig.testUsers) {
      await this.runTestsForUser(user);
    }

    await this.generateReport();
    return this.results;
  }
}

module.exports = APITestRunner;

// Run if called directly
if (require.main === module) {
  const environment = process.argv[2] || 'staging';
  const runner = new APITestRunner(environment);
  runner.runAllTests().catch(console.error);
}

