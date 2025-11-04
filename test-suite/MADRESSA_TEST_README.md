# Madressa Module Test Suite

## Overview

This comprehensive test suite validates all functionality of the Madressa module, including backend API endpoints, frontend components, RBAC (Role-Based Access Control), tenant isolation, and data validation.

## Test Coverage

### Backend API Tests

The test suite covers all CRUD operations for the following Madressa module endpoints:

1. **MadressaApplication** (`/api/madressaApplication`)
   - GET all applications
   - GET by ID
   - GET by Relationship ID
   - CREATE new application
   - UPDATE application
   - DELETE application

2. **AcademicResults** (`/api/academicResults`)
   - GET all results
   - GET by ID
   - GET by Madressah App ID
   - CREATE with file upload support
   - UPDATE with file upload support
   - DELETE

3. **IslamicResults** (`/api/islamicResults`)
   - GET all results
   - GET by ID
   - GET by Madressah App ID
   - CREATE with file upload support
   - UPDATE with file upload support
   - DELETE

4. **ConductAssessment** (`/api/conductAssessment`)
   - GET all assessments
   - GET by ID
   - GET by Madressah App ID
   - CREATE assessment
   - UPDATE assessment
   - DELETE assessment

5. **Survey** (`/api/survey`)
   - GET all surveys
   - GET by ID
   - GET by Madressah App ID
   - CREATE survey (with all 19 questions)
   - UPDATE survey
   - DELETE survey

### Additional Test Scenarios

- **RBAC Testing**: Tests all 5 user roles (App Admin, HQ, Org Admin, Org Executive, Org Caseworker)
- **Tenant Isolation**: Verifies that users can only access data from their own center (except App Admin)
- **Error Handling**: Validates proper error responses for invalid requests
- **Data Validation**: Tests required fields and data integrity
- **File Uploads**: Tests multipart/form-data uploads for AcademicResults and IslamicResults

## Prerequisites

1. **Node.js** (v14 or higher)
2. **Database**: PostgreSQL database with the Hudasa schema
3. **Backend Server**: Backend API server should be running
4. **Test Users**: The following test users must exist in the database:
   - `admin` (App Admin, password: `12345`)
   - `hquser` (HQ, password: `12345`)
   - `orgadmin` (Org Admin, password: `12345`)
   - `orgexeuser` (Org Executive, password: `12345`)
   - `orgcaseuser` (Org Caseworker, password: `12345`)

## Installation

1. Navigate to the test-suite directory:
```bash
cd test-suite
```

2. Install dependencies:
```bash
npm install
```

This will install:
- `axios` - HTTP client for API requests
- `form-data` - For multipart/form-data file uploads

## Configuration

Edit `test-config.js` to configure:

- **Environment URLs**: Update `environments.staging.baseURL` and `environments.production.baseURL`
- **Test Users**: Modify user credentials if different from defaults
- **API Endpoints**: Adjust endpoint paths if they differ from defaults

## Running Tests

### Run All Madressa Tests (Staging)

```bash
npm run test:madressa
```

or

```bash
npm run test:madressa:staging
```

### Run Madressa Tests (Production)

```bash
npm run test:madressa:prod
```

### Run Tests Directly with Node

```bash
node madressa-qa-test.js staging
```

or

```bash
node madressa-qa-test.js production
```

## Test Output

The test suite provides:

1. **Console Output**: Real-time progress with emojis indicating test status
   - ✅ Passed tests
   - ❌ Failed tests
   - ⚠️ Warnings

2. **JSON Results File**: Detailed results saved to `test-results/madressa-qa-test-[timestamp].json`

### Test Summary

At the end of the test run, a summary is displayed:

```
📊 TEST SUMMARY
============================================================
Total Tests: 150
✅ Passed: 145
❌ Failed: 5
Success Rate: 96.67%
```

## Test Results Structure

Each test result includes:

- `test`: Test name and description
- `user`: Username who ran the test
- `passed`: Boolean indicating pass/fail
- `status`: HTTP status code
- `error`: Error message (if failed)
- `data`: Response data (if applicable)

## Expected Behavior by Role

### App Admin (Role 1)
- ✅ Full CRUD access to all Madressa endpoints
- ✅ Can access data from all centers
- ✅ No tenant restrictions

### HQ (Role 2)
- ✅ Full CRUD access to all Madressa endpoints
- ✅ Can only access data from their assigned center
- ✅ Tenant isolation enforced

### Org Admin (Role 3)
- ✅ Full CRUD access to all Madressa endpoints
- ✅ Can only access data from their assigned center
- ✅ Tenant isolation enforced

### Org Executive (Role 4)
- ✅ READ-ONLY access (GET operations only)
- ✅ Cannot CREATE, UPDATE, or DELETE
- ✅ Can only access data from their assigned center

### Org Caseworker (Role 5)
- ✅ Full CRUD access to all Madressa endpoints
- ✅ Can only access data from their assigned center
- ✅ Tenant isolation enforced

## Common Issues and Troubleshooting

### Issue: "Login failed for user X"

**Solution**: 
- Verify the user exists in the database
- Check that the password matches the test configuration
- Ensure the backend authentication endpoint is working

### Issue: "No MadressaApplication found"

**Solution**:
- The tests require at least one relationship to exist in the database
- Run the Applicants module first to create relationships
- Or create test data manually using the API

### Issue: "FormData is not defined"

**Solution**:
```bash
npm install form-data
```

### Issue: Tests fail due to missing relationships

**Solution**:
- The tests automatically fetch relationship IDs, but if none exist, some tests will be skipped
- Create test relationships through the Applicants module or API

## Integration with CI/CD

To integrate with CI/CD pipelines:

```yaml
# Example GitHub Actions
- name: Run Madressa Tests
  run: |
    cd test-suite
    npm install
    npm run test:madressa:staging
  env:
    VITE_API_URL: ${{ secrets.API_URL }}
```

## Test Data Cleanup

The test suite:
- Creates test data during execution
- Attempts to clean up created records after each test
- May leave some data if tests fail mid-execution

**Manual Cleanup**: Check the `testData` object in the results JSON file for IDs of created records.

## Extending the Test Suite

To add new tests:

1. Add a new test method in `madressa-qa-test.js`:
```javascript
async testNewFeature(user) {
  const token = this.tokens[user.username];
  // Add your test logic
  const result = await this.makeRequest('GET', '/api/newEndpoint', token);
  this.recordTest({
    test: 'New Feature Test',
    user: user.username,
    passed: result.success,
    // ...
  });
}
```

2. Call the method in `runAllTests()`:
```javascript
await this.testNewFeature(user);
```

## Performance Considerations

- Each test suite run may take 5-15 minutes depending on network latency
- Tests run sequentially to avoid race conditions
- Consider parallelizing in the future if test execution time becomes an issue

## Support

For issues or questions:
1. Check the test results JSON file for detailed error messages
2. Verify backend server logs for API errors
3. Ensure all prerequisites are met
4. Review the test configuration

## Version History

- **v1.0.0** (Initial Release)
  - Comprehensive CRUD testing for all Madressa endpoints
  - RBAC validation
  - Tenant isolation testing
  - Error handling validation
  - File upload testing
