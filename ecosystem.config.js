module.exports = {
  apps: [
    {
      name: "nups-prod",
      script: "app.js",
      env: {
        NODE_ENV: "production",
        DOMAIN: "nupsweb.org"
      }
    },
    {
      name: "nups-dev",
      script: "app.js",
      env: {
        NODE_ENV: "development",
        DOMAIN: "dev.nupsweb.org"
      }
    }
  ]
};
