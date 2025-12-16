#!/bin/bash
# Authentication API Test Script
# This script tests all the authentication endpoints for the AI Trading Bot Platform

# Configuration
API_URL="http://localhost:3001/api"
OUTPUT_FILE="auth-test-results.log"

# Colors for terminal output
GREEN='\033[0;32m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Clear the output file
echo "" > $OUTPUT_FILE

# Utility function to log test results
log_test() {
  local test_name="$1"
  local status="$2"
  local details="$3"
  
  echo -e "${BLUE}[$test_name]${NC} - ${status}" | tee -a $OUTPUT_FILE
  echo "$details" >> $OUTPUT_FILE
  echo "--------------------------------------------------------" >> $OUTPUT_FILE
}

# ==================== REGISTRATION TESTS ====================

echo -e "\n${BLUE}===== TESTING USER REGISTRATION =====${NC}"

# Test 1: Successful registration
echo -e "\n${BLUE}[TEST]${NC} Registration with valid data"
REGISTER_RESPONSE=$(curl -s -X POST "$API_URL/auth/register" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "username": "testuser",
    "password": "Password123",
    "confirmPassword": "Password123",
    "firstName": "Test",
    "lastName": "User"
  }')

echo "$REGISTER_RESPONSE" > temp.json
HTTP_STATUS=$(echo "$REGISTER_RESPONSE" | grep -o '"status":"[^"]*"' | cut -d'"' -f4)

if [ "$HTTP_STATUS" == "success" ]; then
  log_test "Registration" "${GREEN}PASSED${NC}" "$REGISTER_RESPONSE"
  
  # Extract tokens for later tests
  ACCESS_TOKEN=$(echo "$REGISTER_RESPONSE" | grep -o '"accessToken":"[^"]*"' | cut -d'"' -f4)
  REFRESH_TOKEN=$(echo "$REGISTER_RESPONSE" | grep -o '"refreshToken":"[^"]*"' | cut -d'"' -f4)
  echo "ACCESS_TOKEN=$ACCESS_TOKEN" > tokens.env
  echo "REFRESH_TOKEN=$REFRESH_TOKEN" >> tokens.env
else
  log_test "Registration" "${RED}FAILED${NC}" "$REGISTER_RESPONSE"
fi

# Test 2: Registration with existing email
echo -e "\n${BLUE}[TEST]${NC} Registration with existing email"
REGISTER_DUPLICATE_EMAIL=$(curl -s -X POST "$API_URL/auth/register" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "username": "testuser2",
    "password": "Password123",
    "confirmPassword": "Password123",
    "firstName": "Test",
    "lastName": "User"
  }')

HTTP_STATUS=$(echo "$REGISTER_DUPLICATE_EMAIL" | grep -o '"status":"[^"]*"' | cut -d'"' -f4)

if [ "$HTTP_STATUS" == "error" ]; then
  log_test "Registration - Duplicate Email" "${GREEN}PASSED${NC}" "$REGISTER_DUPLICATE_EMAIL"
else
  log_test "Registration - Duplicate Email" "${RED}FAILED${NC}" "$REGISTER_DUPLICATE_EMAIL"
fi

# Test 3: Registration with existing username
echo -e "\n${BLUE}[TEST]${NC} Registration with existing username"
REGISTER_DUPLICATE_USERNAME=$(curl -s -X POST "$API_URL/auth/register" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test2@example.com",
    "username": "testuser",
    "password": "Password123",
    "confirmPassword": "Password123",
    "firstName": "Test",
    "lastName": "User"
  }')

HTTP_STATUS=$(echo "$REGISTER_DUPLICATE_USERNAME" | grep -o '"status":"[^"]*"' | cut -d'"' -f4)

if [ "$HTTP_STATUS" == "error" ]; then
  log_test "Registration - Duplicate Username" "${GREEN}PASSED${NC}" "$REGISTER_DUPLICATE_USERNAME"
else
  log_test "Registration - Duplicate Username" "${RED}FAILED${NC}" "$REGISTER_DUPLICATE_USERNAME"
fi

# Test 4: Registration with invalid data (password mismatch)
echo -e "\n${BLUE}[TEST]${NC} Registration with password mismatch"
REGISTER_INVALID=$(curl -s -X POST "$API_URL/auth/register" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test3@example.com",
    "username": "testuser3",
    "password": "Password123",
    "confirmPassword": "Password1234",
    "firstName": "Test",
    "lastName": "User"
  }')

HTTP_STATUS=$(echo "$REGISTER_INVALID" | grep -o '"status":"[^"]*"' | cut -d'"' -f4)

if [ "$HTTP_STATUS" == "error" ]; then
  log_test "Registration - Password Mismatch" "${GREEN}PASSED${NC}" "$REGISTER_INVALID"
else
  log_test "Registration - Password Mismatch" "${RED}FAILED${NC}" "$REGISTER_INVALID"
fi

# ==================== LOGIN TESTS ====================

echo -e "\n${BLUE}===== TESTING USER LOGIN =====${NC}"

# Test 5: Login with email
echo -e "\n${BLUE}[TEST]${NC} Login with email"
LOGIN_EMAIL=$(curl -s -X POST "$API_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Password123"
  }')

HTTP_STATUS=$(echo "$LOGIN_EMAIL" | grep -o '"status":"[^"]*"' | cut -d'"' -f4)

if [ "$HTTP_STATUS" == "success" ]; then
  log_test "Login with Email" "${GREEN}PASSED${NC}" "$LOGIN_EMAIL"
  
  # Update tokens
  ACCESS_TOKEN=$(echo "$LOGIN_EMAIL" | grep -o '"accessToken":"[^"]*"' | cut -d'"' -f4)
  REFRESH_TOKEN=$(echo "$LOGIN_EMAIL" | grep -o '"refreshToken":"[^"]*"' | cut -d'"' -f4)
  echo "ACCESS_TOKEN=$ACCESS_TOKEN" > tokens.env
  echo "REFRESH_TOKEN=$REFRESH_TOKEN" >> tokens.env
else
  log_test "Login with Email" "${RED}FAILED${NC}" "$LOGIN_EMAIL"
fi

# Test 6: Login with username
echo -e "\n${BLUE}[TEST]${NC} Login with username"
LOGIN_USERNAME=$(curl -s -X POST "$API_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "password": "Password123"
  }')

HTTP_STATUS=$(echo "$LOGIN_USERNAME" | grep -o '"status":"[^"]*"' | cut -d'"' -f4)

if [ "$HTTP_STATUS" == "success" ]; then
  log_test "Login with Username" "${GREEN}PASSED${NC}" "$LOGIN_USERNAME"
  
  # Update tokens
  ACCESS_TOKEN=$(echo "$LOGIN_USERNAME" | grep -o '"accessToken":"[^"]*"' | cut -d'"' -f4)
  REFRESH_TOKEN=$(echo "$LOGIN_USERNAME" | grep -o '"refreshToken":"[^"]*"' | cut -d'"' -f4)
  echo "ACCESS_TOKEN=$ACCESS_TOKEN" > tokens.env
  echo "REFRESH_TOKEN=$REFRESH_TOKEN" >> tokens.env
else
  log_test "Login with Username" "${RED}FAILED${NC}" "$LOGIN_USERNAME"
fi

# Test 7: Login with invalid credentials
echo -e "\n${BLUE}[TEST]${NC} Login with invalid credentials"
LOGIN_INVALID=$(curl -s -X POST "$API_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "WrongPassword123"
  }')

HTTP_STATUS=$(echo "$LOGIN_INVALID" | grep -o '"status":"[^"]*"' | cut -d'"' -f4)

if [ "$HTTP_STATUS" == "error" ]; then
  log_test "Login - Invalid Credentials" "${GREEN}PASSED${NC}" "$LOGIN_INVALID"
else
  log_test "Login - Invalid Credentials" "${RED}FAILED${NC}" "$LOGIN_INVALID"
fi

# ==================== PROTECTED ROUTE TESTS ====================

echo -e "\n${BLUE}===== TESTING PROTECTED ROUTES =====${NC}"

# Load tokens
if [ -f tokens.env ]; then
  source tokens.env
fi

# Test 8: Access protected route with valid token
echo -e "\n${BLUE}[TEST]${NC} Access protected route with valid token"
PROTECTED_VALID=$(curl -s -X GET "$API_URL/auth/me" \
  -H "Authorization: Bearer $ACCESS_TOKEN")

HTTP_STATUS=$(echo "$PROTECTED_VALID" | grep -o '"status":"[^"]*"' | cut -d'"' -f4)

if [ "$HTTP_STATUS" == "success" ]; then
  log_test "Protected Route - Valid Token" "${GREEN}PASSED${NC}" "$PROTECTED_VALID"
else
  log_test "Protected Route - Valid Token" "${RED}FAILED${NC}" "$PROTECTED_VALID"
fi

# Test 9: Access protected route with invalid token
echo -e "\n${BLUE}[TEST]${NC} Access protected route with invalid token"
PROTECTED_INVALID=$(curl -s -X GET "$API_URL/auth/me" \
  -H "Authorization: Bearer invalid_token")

HTTP_STATUS=$(echo "$PROTECTED_INVALID" | grep -o '"status":"[^"]*"' | cut -d'"' -f4)

if [ "$HTTP_STATUS" == "error" ]; then
  log_test "Protected Route - Invalid Token" "${GREEN}PASSED${NC}" "$PROTECTED_INVALID"
else
  log_test "Protected Route - Invalid Token" "${RED}FAILED${NC}" "$PROTECTED_INVALID"
fi

# Test 10: Access protected route without token
echo -e "\n${BLUE}[TEST]${NC} Access protected route without token"
PROTECTED_NO_TOKEN=$(curl -s -X GET "$API_URL/auth/me")

HTTP_STATUS=$(echo "$PROTECTED_NO_TOKEN" | grep -o '"status":"[^"]*"' | cut -d'"' -f4)

if [ "$HTTP_STATUS" == "error" ]; then
  log_test "Protected Route - No Token" "${GREEN}PASSED${NC}" "$PROTECTED_NO_TOKEN"
else
  log_test "Protected Route - No Token" "${RED}FAILED${NC}" "$PROTECTED_NO_TOKEN"
fi

# ==================== REFRESH TOKEN TESTS ====================

echo -e "\n${BLUE}===== TESTING TOKEN REFRESH =====${NC}"

# Test 11: Refresh token with valid token
echo -e "\n${BLUE}[TEST]${NC} Refresh token with valid refresh token"
REFRESH_VALID=$(curl -s -X POST "$API_URL/auth/refresh-token" \
  -H "Content-Type: application/json" \
  -d "{
    \"refreshToken\": \"$REFRESH_TOKEN\"
  }")

HTTP_STATUS=$(echo "$REFRESH_VALID" | grep -o '"status":"[^"]*"' | cut -d'"' -f4)

if [ "$HTTP_STATUS" == "success" ]; then
  log_test "Refresh Token - Valid" "${GREEN}PASSED${NC}" "$REFRESH_VALID"
  
  # Update access token
  NEW_ACCESS_TOKEN=$(echo "$REFRESH_VALID" | grep -o '"accessToken":"[^"]*"' | cut -d'"' -f4)
  echo "ACCESS_TOKEN=$NEW_ACCESS_TOKEN" > tokens.env
  echo "REFRESH_TOKEN=$REFRESH_TOKEN" >> tokens.env
else
  log_test "Refresh Token - Valid" "${RED}FAILED${NC}" "$REFRESH_VALID"
fi

# Test 12: Refresh token with invalid token
echo -e "\n${BLUE}[TEST]${NC} Refresh token with invalid refresh token"
REFRESH_INVALID=$(curl -s -X POST "$API_URL/auth/refresh-token" \
  -H "Content-Type: application/json" \
  -d '{
    "refreshToken": "invalid_refresh_token"
  }')

HTTP_STATUS=$(echo "$REFRESH_INVALID" | grep -o '"status":"[^"]*"' | cut -d'"' -f4)

if [ "$HTTP_STATUS" == "error" ]; then
  log_test "Refresh Token - Invalid" "${GREEN}PASSED${NC}" "$REFRESH_INVALID"
else
  log_test "Refresh Token - Invalid" "${RED}FAILED${NC}" "$REFRESH_INVALID"
fi

# ==================== LOGOUT TESTS ====================

echo -e "\n${BLUE}===== TESTING LOGOUT =====${NC}"

# Load tokens
if [ -f tokens.env ]; then
  source tokens.env
fi

# Test 13: Logout with valid refresh token
echo -e "\n${BLUE}[TEST]${NC} Logout with valid refresh token"
LOGOUT_VALID=$(curl -s -X POST "$API_URL/auth/logout" \
  -H "Content-Type: application/json" \
  -d "{
    \"refreshToken\": \"$REFRESH_TOKEN\"
  }")

HTTP_STATUS=$(echo "$LOGOUT_VALID" | grep -o '"status":"[^"]*"' | cut -d'"' -f4)

if [ "$HTTP_STATUS" == "success" ]; then
  log_test "Logout - Valid Token" "${GREEN}PASSED${NC}" "$LOGOUT_VALID"
else
  log_test "Logout - Valid Token" "${RED}FAILED${NC}" "$LOGOUT_VALID"
fi

# Test 14: Try to use refresh token after logout
echo -e "\n${BLUE}[TEST]${NC} Try to use refresh token after logout"
REFRESH_AFTER_LOGOUT=$(curl -s -X POST "$API_URL/auth/refresh-token" \
  -H "Content-Type: application/json" \
  -d "{
    \"refreshToken\": \"$REFRESH_TOKEN\"
  }")

HTTP_STATUS=$(echo "$REFRESH_AFTER_LOGOUT" | grep -o '"status":"[^"]*"' | cut -d'"' -f4)

if [ "$HTTP_STATUS" == "error" ]; then
  log_test "Refresh After Logout" "${GREEN}PASSED${NC}" "$REFRESH_AFTER_LOGOUT"
else
  log_test "Refresh After Logout" "${RED}FAILED${NC}" "$REFRESH_AFTER_LOGOUT"
fi

# Clean up
rm -f temp.json tokens.env

echo -e "\n${BLUE}===== TEST SUMMARY =====${NC}"
echo -e "All test results are saved in ${BLUE}$OUTPUT_FILE${NC}"
echo -e "Done testing the authentication API endpoints!"