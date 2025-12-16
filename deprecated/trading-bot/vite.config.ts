import path from 'path';
import { defineConfig, loadEnv } from 'vite';

export default defineConfig(({ mode }) => {
    // Load environment variables
    const env = loadEnv(mode, '.', '');
    
    // Create define object with all environment variables prefixed with VITE_
    const envDefine: Record<string, string> = {};
    
    // Add all VITE_ prefixed env variables
    Object.keys(env).forEach(key => {
      if (key.startsWith('VITE_')) {
        envDefine[`process.env.${key}`] = JSON.stringify(env[key]);
      }
    });
    
    // Manually add specific non-VITE_ prefixed variables that need to be exposed
    envDefine['process.env.API_KEY'] = JSON.stringify(env.GEMINI_API_KEY || '');
    envDefine['process.env.GEMINI_API_KEY'] = JSON.stringify(env.GEMINI_API_KEY || '');
    
    return {
      define: envDefine,
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      }
    };
});
