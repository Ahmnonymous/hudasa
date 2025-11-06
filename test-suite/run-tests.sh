#!/bin/bash
# Comprehensive Test Runner Script (Bash version for Unix/Linux/Mac)
# Handles directory navigation and runs all tests

set -e

# Get the script directory
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_ROOT="$( cd "$SCRIPT_DIR/.." && pwd )"

# Change to project root to ensure correct paths
cd "$PROJECT_ROOT"

echo "============================================================"
echo "Running Comprehensive Test Suite"
echo "============================================================"
echo "Project Root: $PROJECT_ROOT"
echo "Test Suite Directory: $SCRIPT_DIR"
echo ""

# Check if test-suite directory exists
if [ ! -d "$PROJECT_ROOT/test-suite" ]; then
    echo "❌ Error: test-suite directory not found at $PROJECT_ROOT/test-suite"
    exit 1
fi

# Check if comprehensive-test-runner.js exists
if [ ! -f "$PROJECT_ROOT/test-suite/comprehensive-test-runner.js" ]; then
    echo "❌ Error: comprehensive-test-runner.js not found"
    exit 1
fi

# Get environment from argument or default to staging
ENV=${1:-staging}

echo "Environment: $ENV"
echo ""

# Run the comprehensive test runner
node "$PROJECT_ROOT/test-suite/comprehensive-test-runner.js" "$ENV"
EXIT_CODE=$?

echo ""
echo "============================================================"
echo "Test execution completed"
echo "============================================================"

exit $EXIT_CODE

