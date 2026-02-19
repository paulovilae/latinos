module.exports = {
  apps: [
    {
      name: 'latinos-frontend',
      cwd: './frontend',
      script: 'npm',
      args: 'run dev',
      env: {
        PORT: 3101,
        NODE_ENV: 'development',
      },
    },
  ],
};
