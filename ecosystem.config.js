module.exports = {
  apps: [
    {
      name: "nups-prod",
      script: "app.js",
      env: {
        NODE_ENV: "production",  // Definindo como produção
        DOMAIN: "https://nupsweb.org",  // Defina o domínio correto
        PORT: 4000,  // Defina a porta para produção, se necessário
      },
      env_development: {
        NODE_ENV: "development",  // Definindo como desenvolvimento
        DOMAIN: "http://dev.nupsweb.org",  // Domínio de desenvolvimento
        PORT: 3000,  // Defina a porta para desenvolvimento, se necessário
      },
    },
  ],
};
