import React from 'react';

const MinimalApp: React.FC = () => {
  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <h1>AI Trading Bot Platform</h1>
      <p>Minimal test version</p>
      
      <div style={{ marginTop: '20px', padding: '15px', border: '1px solid #ccc', borderRadius: '5px' }}>
        <h2>Debug Information</h2>
        <ul>
          <li>React version: {React.version}</li>
          <li>Current time: {new Date().toLocaleTimeString()}</li>
          <li>Environment: {process.env.NODE_ENV || 'development'}</li>
        </ul>
      </div>
    </div>
  );
};

export default MinimalApp;