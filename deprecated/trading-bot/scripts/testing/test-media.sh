#!/bin/bash

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}=====================================${NC}"
echo -e "${BLUE}    Testing CMS Media API            ${NC}"
echo -e "${BLUE}=====================================${NC}"

# Install form-data if needed
npm list form-data || npm install form-data

# Run the test script
node test-media.js

echo -e "${BLUE}=====================================${NC}"
echo -e "${BLUE}          Test Completed             ${NC}"
echo -e "${BLUE}=====================================${NC}"