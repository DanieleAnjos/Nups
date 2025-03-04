module.exports = {
  apps: [
    {
      name: "nups-prod",
      script: "node",
      args: "app.js", // ou qualquer outro script de inicialização
      env: {
        NODE_ENV: "production",
        DOMAIN: "nupsweb.org",
        PORT: 4000
      }
    },
    {
      name: "nups-dev",
      script: "nodemon",
      args: "app.js",
      env: {
        NODE_ENV: "development",
        DOMAIN: "dev.nupsweb.org",
        PORT: 3000
      }
    }
  ]
};
