module.exports = {
  apps: [
    {
      name: "sejanxyz",
      script: "npm",
      args: "run start",
      cwd: ".",
      env: {
        NODE_ENV: "production",
        PORT: "3000",
      },
    },
  ],
};
