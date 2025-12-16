/**
 * Test script for CMS API with versioning and RBAC
 * 
 * This script tests the CMS features including:
 * - Role and permission management
 * - Content versioning
 * - Content publishing and restoring
 */

const axios = require('axios');
const chalk = require('chalk');
const readline = require('readline');

// Configuration
const API_URL = 'http://localhost:3001/api';
let authToken = null;
let refreshToken = null;

// Create readline interface
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// API client with authentication
const api = axios.create({
  baseURL: API_URL,
  timeout: 5000
});

// Add request interceptor to include auth token
api.interceptors.request.use(
  (config) => {
    if (authToken) {
      config.headers.Authorization = `Bearer ${authToken}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Helper functions
const prompt = (question) => new Promise((resolve) => rl.question(question, resolve));

const logSection = (title) => {
  console.log('\n' + chalk.bold.blue('===== ' + title + ' ====='));
};

const logSuccess = (message) => {
  console.log(chalk.green('✓ ' + message));
};

const logError = (message, error) => {
  console.log(chalk.red('✗ ' + message));
  if (error?.response?.data) {
    console.log(chalk.red('  Error details:'), error.response.data);
  } else if (error?.message) {
    console.log(chalk.red('  Error details:'), error.message);
  }
};

const logInfo = (message) => {
  console.log(chalk.blue('ℹ ' + message));
};

const logJson = (data) => {
  console.log(JSON.stringify(data, null, 2));
};

// Test functions
async function login(username, password) {
  try {
    const response = await api.post('/auth/login', { username, password });
    authToken = response.data.data.accessToken;
    refreshToken = response.data.data.refreshToken;
    return response.data.data.user;
  } catch (error) {
    throw error;
  }
}

async function getRoles() {
  return (await api.get('/cms/roles')).data.data.roles;
}

async function getPermissions() {
  return (await api.get('/cms/permissions/grouped/by-category')).data.data;
}

async function createRole(name, slug, description, permissionIds) {
  return (await api.post('/cms/roles', {
    name,
    slug,
    description,
    permissions: permissionIds
  })).data.data;
}

async function createContentType(name, slug, description) {
  return (await api.post('/cms/content-types', {
    name, 
    slug, 
    description,
    fields: [
      {
        name: 'Body',
        key: 'body',
        type: 'rich_text',
        required: true
      },
      {
        name: 'Summary',
        key: 'summary',
        type: 'text',
        required: false
      }
    ]
  })).data.data;
}

async function createContent(contentTypeId, title, slug, status, fields) {
  return (await api.post('/cms/content', {
    contentTypeId,
    title,
    slug,
    status,
    fields
  })).data.data;
}

async function updateContent(contentId, title, fields) {
  return (await api.put(`/cms/content/${contentId}`, {
    title,
    fields
  })).data.data;
}

async function getContentVersions(contentId) {
  return (await api.get(`/cms/content/${contentId}/versions`)).data.data;
}

async function getContentVersion(contentId, versionNumber) {
  return (await api.get(`/cms/content/${contentId}/versions/${versionNumber}`)).data.data;
}

async function publishVersion(contentId, versionNumber) {
  return (await api.post(`/cms/content/${contentId}/versions/${versionNumber}/publish`)).data.data;
}

async function restoreVersion(contentId, versionNumber) {
  return (await api.post(`/cms/content/${contentId}/versions/${versionNumber}/restore`)).data.data;
}

// Main test sequence
async function runTests() {
  try {
    logSection('CMS Testing with Versioning and RBAC');
    
    // Step 1: Login
    logSection('Authentication');
    const username = await prompt('Enter username: ');
    const password = await prompt('Enter password: ');
    
    try {
      const user = await login(username, password);
      logSuccess(`Logged in as ${user.username} (${user.role})`);
    } catch (error) {
      logError('Login failed', error);
      return;
    }
    
    // Step 2: Explore roles and permissions
    logSection('Roles and Permissions');
    try {
      // Get roles
      const roles = await getRoles();
      logSuccess(`Found ${roles.length} roles`);
      
      // Get permissions
      const permissions = await getPermissions();
      logSuccess(`Retrieved permissions by category`);
      
      // Create a custom role (if admin)
      const createCustomRole = await prompt('Create a custom role? (y/n): ');
      if (createCustomRole.toLowerCase() === 'y') {
        // Get all permission IDs
        const allPermissions = Object.values(permissions).flat();
        const permissionIds = allPermissions.map(p => p.id);
        
        // Create editor role
        const newRole = await createRole(
          'Content Manager',
          'content-manager',
          'Can create, edit, and publish content',
          permissionIds.filter(id => {
            const permission = allPermissions.find(p => p.id === id);
            return permission && permission.category === 'content';
          })
        );
        
        logSuccess(`Created new role: ${newRole.name}`);
      }
    } catch (error) {
      logError('Error working with roles and permissions', error);
    }
    
    // Step 3: Create content with versions
    logSection('Content Versioning');
    try {
      // Create content type
      let contentType;
      const createNewContentType = await prompt('Create a new content type? (y/n): ');
      
      if (createNewContentType.toLowerCase() === 'y') {
        contentType = await createContentType(
          'Test Article',
          'test-article',
          'Test content type for versioning'
        );
        logSuccess(`Created content type: ${contentType.name}`);
      } else {
        // Use existing content type
        contentType = { id: await prompt('Enter existing content type ID: ') };
      }
      
      // Create content
      const content = await createContent(
        contentType.id,
        'Test Article - Version 1',
        'test-article-1',
        'draft',
        {
          body: 'This is version 1 of the test article.',
          summary: 'Initial version'
        }
      );
      
      logSuccess(`Created content: ${content.title} (Version 1)`);
      
      // Update content to create version 2
      const updatedContent = await updateContent(
        content.id,
        'Test Article - Version 2',
        {
          body: 'This is version 2 of the test article with some changes.',
          summary: 'Updated version with changes'
        }
      );
      
      logSuccess(`Updated content: ${updatedContent.title} (Version 2)`);
      
      // Get versions
      const versions = await getContentVersions(content.id);
      logSuccess(`Content has ${versions.versions.length} versions`);
      
      // Publish latest version
      const latestVersion = versions.versions[0];
      await publishVersion(content.id, latestVersion.versionNumber);
      logSuccess(`Published version ${latestVersion.versionNumber}`);
      
      // Create another update (version 3)
      const furtherUpdatedContent = await updateContent(
        content.id,
        'Test Article - Version 3',
        {
          body: 'This is version 3 with even more updates and changes.',
          summary: 'Third version with major changes'
        }
      );
      
      logSuccess(`Updated content again: ${furtherUpdatedContent.title} (Version 3)`);
      
      // List all versions
      const allVersions = await getContentVersions(content.id);
      logSuccess(`Content now has ${allVersions.versions.length} versions`);
      
      // Restore to version 1
      await restoreVersion(content.id, 1);
      logSuccess(`Restored to version 1`);
      
      // Get updated versions list
      const finalVersions = await getContentVersions(content.id);
      logSuccess(`Content has ${finalVersions.versions.length} versions after restore`);
      
      logJson(finalVersions);
    } catch (error) {
      logError('Error with content versioning', error);
    }
    
    logSection('Test Complete');
    logSuccess('CMS testing with versioning and RBAC completed');
    
  } catch (error) {
    logError('Test failed', error);
  } finally {
    rl.close();
  }
}

// Run the tests
runTests();