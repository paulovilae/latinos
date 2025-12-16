# Debug Tests

This directory contains temporary or exploratory tests used during debugging. These tests are not part of the regular test suite and are not intended to be committed to the repository.

## Directory Structure

- `/components/` - Debug tests for React components
- `/services/` - Debug tests for service modules
- `/backend/` - Debug tests for backend API functionality
- `/bot/` - Debug tests for bot microservice functionality
- `/logs/` - Test logs and output files
- `/startup-logs/` - Logs from startup system testing

## Purpose

Debug tests serve several purposes:
- Temporary tests used to investigate specific issues
- Exploratory tests to understand component behavior
- Performance test scripts
- One-off verification scripts
- Tests that aren't intended to be part of the CI/CD pipeline

## Usage

Unlike project-level tests in the `/tests` directory, these debug tests are:
- Not regularly run as part of the testing pipeline
- May have external dependencies or side effects
- May not follow strict test conventions
- Often created for a specific debugging purpose and then discarded

## Test Outputs

Store test output files, logs, or reports in the `/logs` directory to keep them organized and separate from the test code itself.