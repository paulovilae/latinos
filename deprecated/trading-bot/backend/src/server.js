// Import central configuration
const path = require('path');
const config = require('./config/config');
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');
const { sequelize } = require('./models');

// Import routes
const authRoutes = require('./routes/auth.routes');
const cmsRoutes = require('./modules/cms/routes');
const botRoutes = require('./modules/bot/routes');
const { performanceMiddleware, errorMiddleware } = require('./modules/bot/services/monitoring.service');

// Import Swagger configuration
const { setupSwagger } = require('./config/swagger');

// Initialize Express app
const app = express();
const PORT = config.port;

// Request logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} | ${req.method} ${req.url} | Host: ${req.headers.host} | Origin: ${req.headers.origin || 'none'}`);
  next();
});

// Middleware
app.use(helmet({
  contentSecurityPolicy: false, // Disable CSP for the documentation page
  xFrameOptions: false // Allow iframe embedding
})); // Security headers

app.use(cors({
  origin: config.corsOrigin,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Host']
}));

// Trust Cloudflare proxy
app.set('trust proxy', true);

app.use(express.json()); // Parse JSON bodies
app.use(express.urlencoded({ extended: true })); // Parse URL-encoded bodies
app.use(cookieParser(config.cookieSecret)); // Parse cookies

// Serve static files from the public directory
app.use(express.static(path.join(__dirname, 'public')));

// API Documentation at root path
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'api-docs.html'));
});

// Simple text response for Cloudflare tunnel testing
app.get('/cloudflare-test', (req, res) => {
  console.log('Cloudflare test request received');
  console.log('Headers:', JSON.stringify(req.headers, null, 2));
  res.set('Content-Type', 'text/plain');
  res.send('Cloudflare tunnel test successful - Backend server is responding');
});

// Setup Swagger documentation
setupSwagger(app);

// Monitoring middleware for performance tracking
app.use(performanceMiddleware);

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/cms', cmsRoutes);
app.use('/api/bot', botRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'OK', message: 'Server is running' });
});

// Debug endpoint for Cloudflare tunnel troubleshooting
app.get('/api/debug', (req, res) => {
  const debugInfo = {
    timestamp: new Date().toISOString(),
    headers: req.headers,
    ip: req.ip,
    ips: req.ips,
    protocol: req.protocol,
    host: req.get('host'),
    path: req.path,
    originalUrl: req.originalUrl,
    cloudflare: {
      cf_connecting_ip: req.headers['cf-connecting-ip'],
      cf_ipcountry: req.headers['cf-ipcountry'],
      cf_ray: req.headers['cf-ray']
    }
  };
  
  console.log('Debug request received:', JSON.stringify(debugInfo, null, 2));
  
  res.status(200).json({
    status: 'OK',
    message: 'Debug information received',
    debugInfo
  });
});

// Bot error tracking middleware
app.use(errorMiddleware);

// Global error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.statusCode || 500).json({
    status: 'error',
    message: err.message || 'Internal Server Error'
  });
});

// Function to find an available port
const findAvailablePort = (startPort) => {
  return new Promise((resolve, reject) => {
    const server = require('net').createServer();
    server.unref();
    
    server.on('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        // Port is in use, try the next port
        resolve(findAvailablePort(startPort + 1));
      } else {
        reject(err);
      }
    });
    
    server.listen(startPort, () => {
      const { port } = server.address();
      server.close(() => {
        resolve(port);
      });
    });
  });
};

// Start server with error handling for port conflicts
const startServer = async () => {
  try {
    // Find an available port starting with the default PORT
    const availablePort = await findAvailablePort(PORT);
    const server = app.listen(availablePort, '0.0.0.0', async () => {
      console.log(`Server running on port ${availablePort}${availablePort !== PORT ? ` (default port ${PORT} was in use)` : ''}`);
      console.log('Server is listening on all network interfaces (0.0.0.0)');
      
      
      try {
        // Test database connection
        await sequelize.authenticate();
        console.log('Database connection established successfully');
      } catch (error) {
        console.error('Unable to connect to the database:', error);
      }
    });
    
    // Handle server errors
    server.on('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        console.error(`Port ${PORT} is already in use. Trying another port...`);
        server.close();
      } else {
        console.error('Server error:', err);
      }
    });
    
  } catch (err) {
    console.error('Failed to start server:', err);
    process.exit(1);
  }
};

startServer();

module.exports = app; // For testing purposes