require('dotenv').config();  // Carrega as variáveis do arquivo .env
const { execSync } = require('child_process');

// Função para verificar e instalar pacotes necessários
const ensurePackageInstalled = (packageName) => {
  try {
    require.resolve(packageName);
    console.log(`${packageName} já está instalado.`);
  } catch (error) {
    console.log(`Instalando ${packageName}...`);
    execSync(`npm install ${packageName}`, { stdio: 'inherit' });
  }
};

// Garantir que o pacote `tedious` esteja instalado
ensurePackageInstalled('tedious');

const { Sequelize } = require('sequelize');

// Usar variáveis de ambiente para credenciais sensíveis
const sequelizeConfig = {
  host: process.env.DB_HOST, // Host do banco de dados na Azure
  port: process.env.DB_PORT, // Porta padrão para SQL Server
  database: process.env.DB_NAME,
  username: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  dialect: 'mssql', // Dialeto para SQL Server
  dialectOptions: {
    options: {
      encrypt: true, // Azure exige criptografia na conexão
      trustServerCertificate: process.env.NODE_ENV === 'production' ? false : true, // Ajuste conforme o ambiente
    }
  }
};

const sequelize = new Sequelize(sequelizeConfig.database, sequelizeConfig.username, sequelizeConfig.password, {
  host: sequelizeConfig.host,
  dialect: sequelizeConfig.dialect,
  port: sequelizeConfig.port,
  dialectOptions: sequelizeConfig.dialectOptions,
  logging: process.env.NODE_ENV !== 'production', // Habilita logging apenas em desenvolvimento
});

// Função de teste de conexão
const testConnection = async () => {
  try {
    await sequelize.authenticate();
    console.log('Conexão estabelecida com sucesso.');
  } catch (error) {
    console.error('Não foi possível conectar ao banco de dados:', error);
    throw error;
  }
};

testConnection();

// Exportar o Sequelize para uso em outras partes da aplicação
module.exports = sequelize;
