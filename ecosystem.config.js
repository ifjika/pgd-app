module.exports = {
  apps: [
    {
      name: "pgd-backend",
      cwd: "./backend",
      script: "npm",
      args: "run start:prod",
      env: {
        NODE_ENV: "production",
      },
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: "1G",
      log_date_format: "YYYY-MM-DD HH:mm Z",
      error_file: "../logs/backend-error.log",
      out_file: "../logs/backend-out.log"
    },
    {
      name: "pgd-frontend",
      cwd: "./frontend",
      script: "npm",
      args: "start",
      env: {
        NODE_ENV: "production",
      },
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: "1G",
      log_date_format: "YYYY-MM-DD HH:mm Z",
      error_file: "../logs/frontend-error.log",
      out_file: "../logs/frontend-out.log"
    }
  ]
};
