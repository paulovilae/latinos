#!/bin/bash
# Bot Microservice API Test Script
# This script tests all the bot microservice endpoints for the AI Trading Bot Platform

# Configuration
API_URL="http://localhost:3001/api"
OUTPUT_FILE="bot-test-results.log"

# Colors for terminal output
GREEN='\033[0;32m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Clear the output file
echo "" > $OUTPUT_FILE

# Check if node is installed
if ! command -v node &> /dev/null; then
    echo -e "${RED}Error: Node.js is not installed.${NC}"
    exit 1
fi

# Check if the test file exists
if [ ! -f "test-bot.js" ]; then
    echo -e "${RED}Error: test-bot.js file not found.${NC}"
    exit 1
fi

# Check if required packages are installed
if [ ! -f "node_modules/axios/package.json" ] || [ ! -f "node_modules/chalk/package.json" ]; then
    echo -e "${BLUE}Installing required packages...${NC}"
    npm install --no-save axios chalk
fi

# Run the test script
echo -e "${BLUE}Starting Bot Microservice API tests...${NC}"
node test-bot.js | tee -a $OUTPUT_FILE

echo -e "\n${BLUE}Test completed. Results are saved in ${OUTPUT_FILE}${NC}"