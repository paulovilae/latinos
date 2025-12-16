/**
 * Test script for CMS Media API
 * 
 * This script tests the media features including:
 * - File uploads with different types
 * - Media listing and retrieval
 * - Image processing
 * - Media deletion
 */

const axios = require('axios');
const fs = require('fs');
const path = require('path');
const FormData = require('form-data');
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

async function uploadFile(filePath, title, description, altText, tags = []) {
  try {
    // Create FormData object
    const formData = new FormData();
    formData.append('file', fs.createReadStream(filePath));
    formData.append('title', title || path.basename(filePath));
    
    if (description) {
      formData.append('description', description);
    }
    
    if (altText) {
      formData.append('altText', altText);
    }
    
    if (tags.length > 0) {
      formData.append('tags', JSON.stringify(tags));
    }
    
    // Submit the form data to the API
    const response = await api.post('/cms/media', formData, {
      headers: {
        ...formData.getHeaders(),
      }
    });
    
    return response.data.data;
  } catch (error) {
    throw error;
  }
}

async function getMediaList(page = 1, limit = 10, type, search) {
  try {
    let url = `/cms/media?page=${page}&limit=${limit}`;
    
    if (type) {
      url += `&type=${type}`;
    }
    
    if (search) {
      url += `&search=${encodeURIComponent(search)}`;
    }
    
    const response = await api.get(url);
    return response.data.data;
  } catch (error) {
    throw error;
  }
}

async function getMediaById(id) {
  try {
    const response = await api.get(`/cms/media/${id}`);
    return response.data.data;
  } catch (error) {
    throw error;
  }
}

async function updateMediaMetadata(id, updates) {
  try {
    const response = await api.put(`/cms/media/${id}`, updates);
    return response.data.data;
  } catch (error) {
    throw error;
  }
}

async function deleteMedia(id) {
  try {
    const response = await api.delete(`/cms/media/${id}`);
    return response.data;
  } catch (error) {
    throw error;
  }
}

async function getUserMedia(userId, page = 1, limit = 10) {
  try {
    const response = await api.get(`/cms/media/user/${userId}?page=${page}&limit=${limit}`);
    return response.data.data;
  } catch (error) {
    throw error;
  }
}

// Create a sample test image if needed
async function createTestImage(filename = 'test-image.jpg', width = 800, height = 600) {
  try {
    // Check if the test directory exists, create if not
    const testDir = path.join(__dirname, 'test-files');
    if (!fs.existsSync(testDir)) {
      fs.mkdirSync(testDir, { recursive: true });
    }
    
    const filePath = path.join(testDir, filename);
    
    // Check if file already exists
    if (fs.existsSync(filePath)) {
      return filePath;
    }
    
    logInfo(`Creating test image: ${filename}`);
    
    // For this example, we'll just copy a placeholder image
    // In a real test, you might generate an image dynamically
    const sampleImagePath = path.join(__dirname, 'sample-image.jpg');
    
    if (fs.existsSync(sampleImagePath)) {
      fs.copyFileSync(sampleImagePath, filePath);
    } else {
      // Create a very simple HTML file instead if no sample image
      const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>Test HTML File</title>
        </head>
        <body>
          <h1>Test HTML File for Media Upload</h1>
          <p>This is a test file created for testing the media upload functionality.</p>
        </body>
        </html>
      `;
      fs.writeFileSync(filePath.replace('.jpg', '.html'), htmlContent);
      filePath = filePath.replace('.jpg', '.html');
    }
    
    return filePath;
  } catch (error) {
    logError('Error creating test image', error);
    throw error;
  }
}

// Main test sequence
async function runTests() {
  try {
    logSection('CMS Media API Testing');
    
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
    
    // Step 2: Upload a test file
    logSection('Media Upload');
    
    // Create or get test image
    let testFilePath = await createTestImage();
    logInfo(`Using test file: ${testFilePath}`);
    
    try {
      const mediaAsset = await uploadFile(
        testFilePath,
        'Test Image',
        'This is a test image for the media API',
        'Test image alt text',
        ['test', 'sample', 'media']
      );
      
      logSuccess(`Uploaded media: ${mediaAsset.filename}`);
      logInfo('Media details:');
      logJson(mediaAsset);
      
      // Save the media ID for later steps
      const mediaId = mediaAsset.id;
      
      // Step 3: List media assets
      logSection('List Media Assets');
      try {
        const mediaList = await getMediaList();
        logSuccess(`Found ${mediaList.mediaAssets.length} media assets`);
        logInfo(`Pagination: ${mediaList.pagination.total} total items, page ${mediaList.pagination.page} of ${mediaList.pagination.pages}`);
      } catch (error) {
        logError('Error listing media assets', error);
      }
      
      // Step 4: Get media by ID
      logSection('Get Media by ID');
      try {
        const media = await getMediaById(mediaId);
        logSuccess(`Retrieved media: ${media.filename}`);
        
        // If it's an image, check for processed versions
        if (media.mimeType.startsWith('image/')) {
          logInfo('Image has been processed:');
          if (media.metadata?.processedVersions) {
            logJson(media.metadata.processedVersions);
          }
        }
      } catch (error) {
        logError('Error getting media by ID', error);
      }
      
      // Step 5: Update media metadata
      logSection('Update Media Metadata');
      try {
        const updatedMedia = await updateMediaMetadata(mediaId, {
          title: 'Updated Test Image',
          description: 'This is an updated description',
          tags: JSON.stringify(['updated', 'test', 'media'])
        });
        
        logSuccess(`Updated media: ${updatedMedia.title}`);
      } catch (error) {
        logError('Error updating media metadata', error);
      }
      
      // Step 6: Get user media
      logSection('Get User Media');
      try {
        const userMedia = await getUserMedia(user.id);
        logSuccess(`Found ${userMedia.mediaAssets.length} media assets for user`);
      } catch (error) {
        logError('Error getting user media', error);
      }
      
      // Step 7: Delete media
      logSection('Delete Media');
      const shouldDelete = await prompt('Delete the test media? (y/n): ');
      
      if (shouldDelete.toLowerCase() === 'y') {
        try {
          const deleteResult = await deleteMedia(mediaId);
          logSuccess('Media deleted successfully');
        } catch (error) {
          logError('Error deleting media', error);
        }
      } else {
        logInfo('Skipping media deletion');
      }
      
    } catch (error) {
      logError('Error during media upload test', error);
    }
    
    logSection('Test Complete');
    logSuccess('CMS media API testing completed');
    
  } catch (error) {
    logError('Test failed', error);
  } finally {
    rl.close();
  }
}

// Run the tests
runTests();