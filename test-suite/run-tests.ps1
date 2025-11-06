# Comprehensive Test Runner Script
# Handles directory navigation and runs all tests

$ErrorActionPreference = "Stop"

# Get the script directory
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$projectRoot = Split-Path -Parent $scriptDir

# Change to project root to ensure correct paths
Set-Location $projectRoot

Write-Host "============================================================"
Write-Host "Running Comprehensive Test Suite"
Write-Host "============================================================"
Write-Host "Project Root: $projectRoot"
Write-Host "Test Suite Directory: $scriptDir"
Write-Host ""

# Check if test-suite directory exists
if (-not (Test-Path "$projectRoot\test-suite")) {
    Write-Host "❌ Error: test-suite directory not found at $projectRoot\test-suite"
    exit 1
}

# Check if comprehensive-test-runner.js exists
if (-not (Test-Path "$projectRoot\test-suite\comprehensive-test-runner.js")) {
    Write-Host "❌ Error: comprehensive-test-runner.js not found"
    exit 1
}

# Get environment from argument or default to staging
$env = if ($args.Count -gt 0) { $args[0] } else { "staging" }

Write-Host "Environment: $env"
Write-Host ""

# Run the comprehensive test runner
try {
    node "$projectRoot\test-suite\comprehensive-test-runner.js" $env
    $exitCode = $LASTEXITCODE
} catch {
    Write-Host "❌ Error running tests: $_"
    exit 1
}

Write-Host ""
Write-Host "============================================================"
Write-Host "Test execution completed"
Write-Host "============================================================"

exit $exitCode

