require('dotenv').config();
const { execSync } = require('child_process');

/**
 * Verifica se um pacote está instalado e o instala, se necessário.
 * @param {string} packageName 
 */
const ensurePackageInstalled = (packageName) => {
  try {
    require.resolve(packageName);
    console.log(`[INFO] O pacote "${packageName}" já está instalado.`);
  } catch (error) {
    console.log(`[INFO] O pacote "${packageName}" não foi encontrado. Iniciando instalação...`);
    try {
      execSync(`npm install ${packageName} --cache /tmp/npm-cache --loglevel verbose`, { stdio: 'inherit' });
      console.log(`[SUCCESS] O pacote "${packageName}" foi instalado com sucesso.`);
    } catch (installError) {
      console.error(`[ERROR] Não foi possível instalar o pacote "${packageName}":`, installError.message);
      process.exit(1); 
    }
  }
};

// Verifica e instala os pacotes necessários
const requiredPackages = ['mysql2', 'passport', 'passport-local', 'express-session'];
requiredPackages.forEach(ensurePackageInstalled);

const { Sequelize } = require('sequelize');

/**
 * Valida as variáveis de ambiente necessárias.
 */
const validateEnvVariables = () => {
  const requiredEnvVars = ['DB_HOST', 'DB_PORT', 'DB_NAME', 'DB_USER', 'DB_PASSWORD', 'NODE_ENV'];
  const missingVars = requiredEnvVars.filter((varName) => !process.env[varName]);

  if (missingVars.length > 0) {
    console.error(`Erro: As seguintes variáveis de ambiente estão ausentes: ${missingVars.join(', ')}`);
    process.exit(1); 
  }
};

// Valida as variáveis de ambiente
validateEnvVariables();

/**
 * Configuração do Sequelize.
 */
const sequelizeConfig = {
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT, 10), 
  database: process.env.DB_NAME,
  username: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  dialect: 'mysql', // Usando MySQL
  dialectModule: require('mysql2'), // Usando o driver mysql2
  logging: false, // Desabilita logs do Sequelize
  pool: {
    max: 5,
    min: 0,
    acquire: 30000,
    idle: 10000,
  },
  // Remova as opções encrypt e trustServerCertificate, pois não são suportadas pelo MySQL
};

/**
 * Valida a configuração do Sequelize.
 * @param {object} config 
 */
const validateSequelizeConfig = (config) => {
  if (!config.host) throw new Error('Host do banco de dados não está configurado.');
  if (!config.port || isNaN(config.port)) throw new Error('Porta do banco de dados inválida.');
  if (!config.database) throw new Error('Nome do banco de dados não está configurado.');
  if (!config.username) throw new Error('Usuário do banco de dados não está configurado.');
  if (!config.password) throw new Error('Senha do banco de dados não está configurada.');
};

// Valida a configuração do Sequelize
try {
  validateSequelizeConfig(sequelizeConfig);
} catch (error) {
  console.error(`Erro de configuração do Sequelize: ${error.message}`);
  process.exit(1); 
}

// Cria a instância do Sequelize
const sequelize = new Sequelize(sequelizeConfig);

/**
 * Testa a conexão com o banco de dados.
 */
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

      await new Promise(res => setTimeout(res, 5000)); // Aguarda 5 segundos antes de tentar novamente
    }
  }
};

// Testa a conexão com o banco de dados
testConnection();

module.exports = sequelize;
