import React from 'react';
import ReactDOM from 'react-dom/client';
import MinimalApp from './MinimalApp';

// Add debugging
console.log('Starting minimal test application...');

try {
  console.log('Looking for root element...');
  const rootElement = document.getElementById('root');
  if (!rootElement) {
    throw new Error("Could not find root element to mount to");
  }
  
  console.log('Creating React root...');
  const root = ReactDOM.createRoot(rootElement);
  
  console.log('Rendering minimal application...');
  root.render(
    <React.StrictMode>
      <MinimalApp />
    </React.StrictMode>
  );
  console.log('Render call completed');
} catch (error: any) {
  console.error('Failed to start minimal application:', error);
  
  // Display error on page
  const rootDiv = document.getElementById('root');
  if (rootDiv) {
    rootDiv.innerHTML = `
      <div style="padding: 20px; font-family: sans-serif; color: #d32f2f; background: #ffebee; border-radius: 4px;">
        <h1>Minimal Application Failed to Start</h1>
        <p>${error?.message || 'Unknown error'}</p>
        <pre style="background: #fff; padding: 10px; border-radius: 4px; overflow: auto;">${error?.stack || 'No stack trace available'}</pre>
      </div>
    `;
  }
}