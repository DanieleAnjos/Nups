module.exports = {
  apps: [
    {
      name: "nups-prod",               // Nome do processo para produção
      script: "npm",                   // Rodar o npm como script
      args: "run start",               // Executar o script 'start' do package.json
      env: {                           // Variáveis de ambiente para o ambiente de desenvolvimento
        NODE_ENV: "production",       // Definir o ambiente como produção
        DOMAIN: "nupsweb.org",        // Domínio para o ambiente de produção
        PORT: 4000                    // Porta para o ambiente de produção
      }
    },
    {
      name: "nups-dev",                // Nome do processo para desenvolvimento
      script: "npm",                   // Rodar o npm como script
      args: "run dev",                 // Executar o script 'dev' do package.json
      env: {
        NODE_ENV: "development",      // Definir o ambiente como desenvolvimento
        DOMAIN: "dev.nupsweb.org",    // Domínio do ambiente de desenvolvimento
        PORT: 3000                     // Porta para o ambiente de desenvolvimento
      }
    }
  ]
};
