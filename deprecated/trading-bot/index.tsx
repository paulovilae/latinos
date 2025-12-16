import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { AuthProvider } from './hooks/useAuth';
import { ThemeProvider } from './contexts/ThemeContext';
import { LanguageProvider } from './contexts/LanguageContext';

// Add debugging
console.log('Starting application...');

// Add error handling for the entire app
window.onerror = function(message, source, lineno, colno, error: any) {
  console.error('Global error caught:', message, 'at', source, ':', lineno, ':', colno);
  console.error('Error details:', error);
  
  // Display error on page for debugging
  const rootDiv = document.getElementById('root');
  if (rootDiv) {
    rootDiv.innerHTML = `
      <div style="padding: 20px; font-family: sans-serif; color: #d32f2f; background: #ffebee; border-radius: 4px;">
        <h1>Application Error</h1>
        <p><strong>Error:</strong> ${message}</p>
        <p><strong>Location:</strong> ${source}:${lineno}:${colno}</p>
        <pre style="background: #fff; padding: 10px; border-radius: 4px; overflow: auto;">${error?.stack || 'No stack trace available'}</pre>
      </div>
    `;
  }
  
  return false; // Let the error propagate
};

try {
  console.log('Looking for root element...');
  const rootElement = document.getElementById('root');
  if (!rootElement) {
    throw new Error("Could not find root element to mount to");
  }
  
  console.log('Creating React root...');
  const root = ReactDOM.createRoot(rootElement);
  
  console.log('Rendering application...');
  root.render(
    <React.StrictMode>
      <ThemeProvider>
        <LanguageProvider>
          <AuthProvider>
            <App />
          </AuthProvider>
        </LanguageProvider>
      </ThemeProvider>
    </React.StrictMode>
  );
  console.log('Render call completed');
} catch (error: any) {
  console.error('Failed to start application:', error);
  
  // Display error on page
  const rootDiv = document.getElementById('root');
  if (rootDiv) {
    rootDiv.innerHTML = `
      <div style="padding: 20px; font-family: sans-serif; color: #d32f2f; background: #ffebee; border-radius: 4px;">
        <h1>Application Failed to Start</h1>
        <p>${error?.message || 'Unknown error'}</p>
        <pre style="background: #fff; padding: 10px; border-radius: 4px; overflow: auto;">${error?.stack || 'No stack trace available'}</pre>
      </div>
    `;
  }
}