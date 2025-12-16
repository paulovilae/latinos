#!/bin/bash

echo "Running AI Trading Bot Platform Startup System Tests..."
echo "======================================================="

# Make script executable
chmod +x start-platform.sh stop-platform.sh 2>/dev/null

echo
echo "1. Running main startup system tests..."
node test-startup-system.js
if [ $? -ne 0 ]; then
  echo "Main startup system tests failed with exit code $?"
  exit 1
fi

echo
echo "2. Running failure handling tests..."
node test-startup-failures.js
if [ $? -ne 0 ]; then
  echo "Failure handling tests failed with exit code $?"
  exit 1
fi

echo
echo "All tests completed successfully!"
echo "See test-logs directory and failure-handling-test-report.md for detailed results."