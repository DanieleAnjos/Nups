require('dotenv').config(); // Carrega as variáveis do arquivo .env
const { execSync } = require('child_process');

// Função para verificar e instalar pacotes necessários
const ensurePackageInstalled = (packageName) => {
  try {
    require.resolve(packageName);
    console.log(`${packageName} já está instalado.`);
  } catch (error) {
    console.log(`Instalando ${packageName}...`);
    try {
      execSync(`npm install ${packageName}`, { stdio: 'inherit' });
      console.log(`${packageName} instalado com sucesso.`);
    } catch (installError) {
      console.error(`Erro ao instalar o pacote ${packageName}:`, installError.message);
      process.exit(1); // Encerra a aplicação em caso de erro
    }
  }
};

// Garantir que o pacote `tedious` esteja instalado
ensurePackageInstalled('tedious');

const { Sequelize } = require('sequelize');

// Função para validar variáveis de ambiente obrigatórias
const validateEnvVariables = () => {
  const requiredEnvVars = ['DB_HOST', 'DB_PORT', 'DB_NAME', 'DB_USER', 'DB_PASSWORD', 'NODE_ENV'];
  const missingVars = requiredEnvVars.filter((varName) => !process.env[varName]);

  if (missingVars.length > 0) {
    console.error(`Erro: As seguintes variáveis de ambiente estão ausentes: ${missingVars.join(', ')}`);
    process.exit(1); // Encerra a aplicação
  }
};

// Validar as variáveis de ambiente antes de prosseguir
validateEnvVariables();

// Usar variáveis de ambiente para credenciais sensíveis
const sequelizeConfig = {
  host: process.env.DB_HOST, // Host do banco de dados na Azure
  port: parseInt(process.env.DB_PORT, 10), // Porta padrão para SQL Server
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

// Validar a configuração do Sequelize
const validateSequelizeConfig = (config) => {
  if (!config.host) throw new Error('Host do banco de dados não está configurado.');
  if (!config.port || isNaN(config.port)) throw new Error('Porta do banco de dados inválida.');
  if (!config.database) throw new Error('Nome do banco de dados não está configurado.');
  if (!config.username) throw new Error('Usuário do banco de dados não está configurado.');
  if (!config.password) throw new Error('Senha do banco de dados não está configurada.');
};

try {
  validateSequelizeConfig(sequelizeConfig);
} catch (error) {
  console.error(`Erro de configuração do Sequelize: ${error.message}`);
  process.exit(1); // Encerra a aplicação
}

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
    console.error('Não foi possível conectar ao banco de dados:', error.message);
    process.exit(1); // Encerra a aplicação em caso de falha na conexão
  }
};

// Testar conexão
testConnection();

// Exportar o Sequelize para uso em outras partes da aplicação
module.exports = sequelize;
