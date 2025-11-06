/**
 * Comprehensive Test Runner
 * Executes all test suites and generates a unified report
 */

const fs = require('fs').promises;
const path = require('path');
const { spawn } = require('child_process');

// Import all test suites
const APITestRunner = require('./api-test-runner');
const AppAdminQATest = require('./app-admin-qa-test');
const OrgAdminQATest = require('./org-admin-qa-test');
const OrgCaseworkerQATest = require('./org-caseworker-qa-test');
const OrgExecutiveQATest = require('./org-executive-qa-test');
const HQQATest = require('./hq-qa-test');
const AttachmentQATest = require('./attachment-qa-test');
const MadressaQATest = require('./madressa-qa-test');

class ComprehensiveTestRunner {
  constructor(environment = 'staging') {
    this.environment = environment;
    this.results = {
      environment: environment,
      timestamp: new Date().toISOString(),
      testSuites: {},
      summary: {
        totalSuites: 0,
        completedSuites: 0,
        totalTests: 0,
        passedTests: 0,
        failedTests: 0,
        errors: [],
        warnings: []
      }
    };
  }

  /**
   * Run a test suite and capture results
   */
  async runTestSuite(suiteName, TestClass, ...args) {
    console.log(`\n${'='.repeat(80)}`);
    console.log(`🧪 Running ${suiteName}...`);
    console.log('='.repeat(80));

    try {
      const tester = new TestClass(...args);
      
      // Handle different method names
      let results;
      if (typeof tester.runAllTests === 'function') {
        results = await tester.runAllTests();
      } else if (typeof tester.run === 'function') {
        await tester.run();
        // Some test classes (like OrgAdminQATest) don't return results from run()
        // but store them in this.results
        results = tester.results || { summary: { totalTests: 0, passed: 0, failed: 0, errors: [], warnings: [] } };
      } else {
        throw new Error(`Test class ${suiteName} does not have runAllTests() or run() method`);
      }

      // Generate report if the test suite has a generateReport or saveResults method
      if (typeof tester.generateReport === 'function') {
        await tester.generateReport();
      } else if (typeof tester.saveResults === 'function') {
        await tester.saveResults();
      }

      // Handle different result structures
      const totalTests = results.summary?.total || results.summary?.totalTests || 0;
      const passedTests = results.summary?.passed || 0;
      const failedTests = results.summary?.failed || 0;
      const overallStatus = results.summary?.overallStatus;
      
      // Determine status - check if results object exists and has summary
      let status = 'PASSED';
      if (!results || !results.summary) {
        // If no results object, try to get from tester
        if (tester.results && tester.results.summary) {
          const tSummary = tester.results.summary;
          const tTotal = tSummary.total || tSummary.totalTests || 0;
          const tFailed = tSummary.failed || 0;
          status = tFailed > 0 ? 'FAILED' : 'PASSED';
        } else {
          status = 'ERROR';
        }
      } else if (overallStatus === 'FAIL' || overallStatus === 'ERROR') {
        status = 'FAILED';
      } else if (failedTests > 0) {
        status = 'FAILED';
      } else if (overallStatus === 'SKIP') {
        status = 'SKIPPED';
      }

      // Get errors and warnings from results or tester
      const errors = results?.summary?.errors || tester.results?.summary?.errors || [];
      const warnings = results?.summary?.warnings || tester.results?.summary?.warnings || [];
      
      this.results.testSuites[suiteName] = {
        status: status,
        totalTests: totalTests || (tester.results?.summary ? (tester.results.summary.total || tester.results.summary.totalTests || 0) : 0),
        passedTests: passedTests || (tester.results?.summary ? (tester.results.summary.passed || 0) : 0),
        failedTests: failedTests || (tester.results?.summary ? (tester.results.summary.failed || 0) : 0),
        errors: errors,
        warnings: warnings,
        details: results || tester.results || {}
      };

      this.results.summary.totalSuites++;
      if (status !== 'ERROR') {
        this.results.summary.completedSuites++;
      }
      this.results.summary.totalTests += this.results.testSuites[suiteName].totalTests;
      this.results.summary.passedTests += this.results.testSuites[suiteName].passedTests;
      this.results.summary.failedTests += this.results.testSuites[suiteName].failedTests;

      if (this.results.testSuites[suiteName].errors.length > 0) {
        this.results.summary.errors.push(...this.results.testSuites[suiteName].errors.map(err => ({
          suite: suiteName,
          error: err
        })));
      }

      if (this.results.testSuites[suiteName].warnings.length > 0) {
        this.results.summary.warnings.push(...this.results.testSuites[suiteName].warnings.map(warn => ({
          suite: suiteName,
          warning: warn
        })));
      }

      console.log(`✅ ${suiteName} completed: ${this.results.testSuites[suiteName].passedTests}/${this.results.testSuites[suiteName].totalTests} passed`);

      return results;
    } catch (error) {
      console.error(`❌ ${suiteName} failed with error:`, error.message);
      this.results.testSuites[suiteName] = {
        status: 'ERROR',
        error: error.message,
        stack: error.stack
      };
      this.results.summary.totalSuites++;
      this.results.summary.errors.push({
        suite: suiteName,
        error: error.message
      });
      return null;
    }
  }

  /**
   * Run all test suites
   */
  async runAllTests() {
    console.log(`\n${'='.repeat(80)}`);
    console.log('🚀 COMPREHENSIVE TEST RUNNER');
    console.log('='.repeat(80));
    console.log(`Environment: ${this.environment}`);
    console.log(`Timestamp: ${this.results.timestamp}`);
    console.log('='.repeat(80));

    // 1. API Test Runner (tests all roles)
    await this.runTestSuite('API Test Runner', APITestRunner, this.environment);

    // 2. Role-specific QA Tests
    await this.runTestSuite('App Admin QA', AppAdminQATest, this.environment);
    await this.runTestSuite('HQ QA', HQQATest, this.environment);
    await this.runTestSuite('Org Admin QA', OrgAdminQATest, this.environment);
    await this.runTestSuite('Org Executive QA', OrgExecutiveQATest, this.environment);
    await this.runTestSuite('Org Caseworker QA', OrgCaseworkerQATest, this.environment);

    // 3. Attachment Tests (test all roles)
    console.log(`\n${'='.repeat(80)}`);
    console.log('📎 Running Attachment Tests for all roles...');
    console.log('='.repeat(80));
    
    const roles = [1, 2, 3, 4, 5];
    for (const roleId of roles) {
      await this.runTestSuite(`Attachment QA - Role ${roleId}`, AttachmentQATest, roleId, this.environment);
    }

    // 4. Madressa Module Tests
    await this.runTestSuite('Madressa Module QA', MadressaQATest, this.environment);

    // Generate comprehensive report
    await this.generateComprehensiveReport();

    return this.results;
  }

  /**
   * Generate comprehensive markdown report
   */
  async generateComprehensiveReport() {
    const reportDir = path.join(__dirname, 'test-results');
    await fs.mkdir(reportDir, { recursive: true });

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const jsonReportFile = path.join(reportDir, `comprehensive-test-report-${timestamp}.json`);

    // Save JSON report only (no Markdown)
    await fs.writeFile(jsonReportFile, JSON.stringify(this.results, null, 2));

    console.log(`\n${'='.repeat(80)}`);
    console.log('📄 TEST REPORT SAVED');
    console.log('='.repeat(80));
    console.log(`JSON Report: ${jsonReportFile}`);
    console.log('='.repeat(80));

    return { jsonReportFile };
  }

  /**
   * Generate Markdown report
   */
  generateMarkdownReport() {
    const { summary, testSuites } = this.results;
    const successRate = summary.totalTests > 0 
      ? ((summary.passedTests / summary.totalTests) * 100).toFixed(2) 
      : 0;

    let report = `# Comprehensive Test Report\n\n`;
    report += `**Generated:** ${this.results.timestamp}\n`;
    report += `**Environment:** ${this.results.environment}\n\n`;

    report += `## Executive Summary\n\n`;
    report += `- **Total Test Suites:** ${summary.totalSuites}\n`;
    report += `- **Completed Suites:** ${summary.completedSuites}\n`;
    report += `- **Total Tests:** ${summary.totalTests}\n`;
    report += `- **Passed Tests:** ${summary.passedTests} ✅\n`;
    report += `- **Failed Tests:** ${summary.failedTests} ❌\n`;
    report += `- **Success Rate:** ${successRate}%\n\n`;

    // Test Suite Summary
    report += `## Test Suite Summary\n\n`;
    report += `| Suite Name | Status | Total Tests | Passed | Failed | Success Rate |\n`;
    report += `|------------|--------|-------------|--------|--------|--------------|\n`;

    for (const [suiteName, suiteResults] of Object.entries(testSuites)) {
      if (suiteResults.status === 'ERROR') {
        report += `| ${suiteName} | ❌ ERROR | - | - | - | - |\n`;
      } else {
        const suiteSuccessRate = suiteResults.totalTests > 0
          ? ((suiteResults.passedTests / suiteResults.totalTests) * 100).toFixed(2)
          : 0;
        const statusIcon = suiteResults.status === 'PASSED' ? '✅' : '❌';
        report += `| ${suiteName} | ${statusIcon} ${suiteResults.status} | ${suiteResults.totalTests} | ${suiteResults.passedTests} | ${suiteResults.failedTests} | ${suiteSuccessRate}% |\n`;
      }
    }

    report += `\n`;

    // Detailed Test Suite Results
    report += `## Detailed Test Suite Results\n\n`;

    for (const [suiteName, suiteResults] of Object.entries(testSuites)) {
      report += `### ${suiteName}\n\n`;
      
      if (suiteResults.status === 'ERROR') {
        report += `**Status:** ❌ ERROR\n\n`;
        report += `**Error:** ${suiteResults.error}\n\n`;
        if (suiteResults.stack) {
          report += `\`\`\`\n${suiteResults.stack}\n\`\`\`\n\n`;
        }
      } else {
        report += `**Status:** ${suiteResults.status === 'PASSED' ? '✅ PASSED' : '❌ FAILED'}\n\n`;
        report += `- **Total Tests:** ${suiteResults.totalTests}\n`;
        report += `- **Passed:** ${suiteResults.passedTests} ✅\n`;
        report += `- **Failed:** ${suiteResults.failedTests} ❌\n`;
        report += `- **Success Rate:** ${suiteResults.totalTests > 0 ? ((suiteResults.passedTests / suiteResults.totalTests) * 100).toFixed(2) : 0}%\n\n`;

        if (suiteResults.warnings.length > 0) {
          report += `#### ⚠️ Warnings\n\n`;
          suiteResults.warnings.forEach((warn, idx) => {
            report += `${idx + 1}. ${typeof warn === 'object' ? warn.warning || JSON.stringify(warn) : warn}\n`;
          });
          report += `\n`;
        }

        if (suiteResults.errors.length > 0) {
          report += `#### ❌ Errors\n\n`;
          suiteResults.errors.forEach((err, idx) => {
            report += `${idx + 1}. ${typeof err === 'object' ? err.error || JSON.stringify(err) : err}\n`;
          });
          report += `\n`;
        }
      }
    }

    // Overall Errors and Warnings
    if (summary.errors.length > 0) {
      report += `## Overall Errors\n\n`;
      summary.errors.forEach((err, idx) => {
        report += `${idx + 1}. **${err.suite}**: ${typeof err.error === 'object' ? JSON.stringify(err.error) : err.error}\n`;
      });
      report += `\n`;
    }

    if (summary.warnings.length > 0) {
      report += `## Overall Warnings\n\n`;
      summary.warnings.forEach((warn, idx) => {
        report += `${idx + 1}. **${warn.suite}**: ${typeof warn.warning === 'object' ? JSON.stringify(warn.warning) : warn.warning}\n`;
      });
      report += `\n`;
    }

    // Recommendations
    report += `## Recommendations\n\n`;

    if (summary.failedTests === 0) {
      report += `### ✅ All Tests Passed\n\n`;
      report += `All test suites have passed successfully. The application is functioning correctly across:\n`;
      report += `- ✅ All API endpoints\n`;
      report += `- ✅ All user roles (RBAC)\n`;
      report += `- ✅ Tenant isolation (center_id filtering)\n`;
      report += `- ✅ File attachments and BYTEA handling\n`;
      report += `- ✅ CRUD operations\n`;
      report += `- ✅ Data validation and error handling\n\n`;
    } else {
      report += `### ⚠️ Test Failures Detected\n\n`;
      report += `The following areas require attention:\n\n`;

      const failedSuites = Object.entries(testSuites).filter(([name, results]) => 
        results.status === 'FAILED' || results.status === 'ERROR'
      );

      if (failedSuites.length > 0) {
        report += `#### Failed Test Suites\n\n`;
        failedSuites.forEach(([name, results]) => {
          report += `- **${name}**: ${results.failedTests || 0} test(s) failed\n`;
        });
        report += `\n`;
      }

      report += `#### Action Items\n\n`;
      report += `1. Review failed test results in individual test suite reports\n`;
      report += `2. Verify backend API endpoints are correctly configured\n`;
      report += `3. Check RBAC middleware and role permissions\n`;
      report += `4. Verify tenant isolation (center_id filtering) is working correctly\n`;
      report += `5. Check file upload/download endpoints for BYTEA handling\n`;
      report += `6. Review error handling and validation logic\n\n`;
    }

    report += `---\n\n`;
    report += `**Report Generated:** ${new Date().toISOString()}\n`;
    report += `**Test Runner:** Comprehensive Test Runner v1.0\n`;

    return report;
  }
}

// Run if called directly
if (require.main === module) {
  const environment = process.argv[2] || 'staging';
  const runner = new ComprehensiveTestRunner(environment);
  
  runner.runAllTests()
    .then(results => {
      const exitCode = results.summary.failedTests > 0 ? 1 : 0;
      console.log(`\n${'='.repeat(80)}`);
      console.log('📊 FINAL SUMMARY');
      console.log('='.repeat(80));
      console.log(`Total Tests: ${results.summary.totalTests}`);
      console.log(`Passed: ${results.summary.passedTests} ✅`);
      console.log(`Failed: ${results.summary.failedTests} ❌`);
      console.log(`Success Rate: ${results.summary.totalTests > 0 ? ((results.summary.passedTests / results.summary.totalTests) * 100).toFixed(2) : 0}%`);
      console.log('='.repeat(80));
      process.exit(exitCode);
    })
    .catch(error => {
      console.error('\n❌ Fatal error:', error);
      console.error(error.stack);
      process.exit(1);
    });
}

module.exports = ComprehensiveTestRunner;

