require('dotenv').config(); // Carrega as variáveis do arquivo .env
const { execSync } = require('child_process');

/**
 * Função para verificar e instalar pacotes necessários
 * @param {string} packageName - Nome do pacote a ser verificado/instalado.
 */
const ensurePackageInstalled = (packageName) => {
  try {
    // Verifica se o pacote já está instalado
    require.resolve(packageName);
    console.log(`[INFO] O pacote "${packageName}" já está instalado.`);
  } catch (error) {
    console.log(`[INFO] O pacote "${packageName}" não foi encontrado. Iniciando instalação...`);
    try {
      // Instala o pacote se não estiver presente
      execSync(`npm install ${packageName} --cache /tmp/npm-cache --loglevel verbose`, { stdio: 'inherit' });
      console.log(`[SUCCESS] O pacote "${packageName}" foi instalado com sucesso.`);
    } catch (installError) {
      console.error(`[ERROR] Não foi possível instalar o pacote "${packageName}":`, installError.message);
      process.exit(1); // Encerra o processo em caso de falha
    }
  }
};

// Garante que os pacotes necessários estejam instalados
const requiredPackages = ['tedious', 'passport', 'passport-local', 'express-session'];
requiredPackages.forEach(ensurePackageInstalled);

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
  let attempts = 0;
  const maxAttempts = 5;

  while (attempts < maxAttempts) {
    try {
      await sequelize.authenticate();
      console.log('Conexão estabelecida com sucesso.');
      break;
    } catch (error) {
      attempts++;
      console.error(`Falha ao conectar ao banco de dados (tentativa ${attempts}/${maxAttempts}):`, error.message);
      if (attempts >= maxAttempts) {
        console.error('Número máximo de tentativas alcançado. A aplicação será encerrada.');
        process.exit(1);
      }
      // Aguarda 5 segundos antes de tentar novamente
      await new Promise(res => setTimeout(res, 5000));
    }
  }
};

// Testar conexão
testConnection();

// Exportar o Sequelize para uso em outras partes da aplicação
module.exports = sequelize;
