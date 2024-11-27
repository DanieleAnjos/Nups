// config/sequelize.js
import dotenv from 'dotenv';  // Carregar as variáveis de ambiente
import { Sequelize } from 'sequelize';  // Importar o Sequelize

// Importação do tedious
import * as tedious from 'tedious'; // Usando o 'import' conforme solicitado

dotenv.config();  // Carregar variáveis do arquivo .env

// Usar variáveis de ambiente para credenciais sensíveis
const sequelizeConfig = {
  host: process.env.DB_HOST,  // Host do banco de dados na Azure
  port: process.env.DB_PORT,  // Porta do banco de dados (padrão para SQL Server é 1433)
  database: process.env.DB_NAME,
  username: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  dialect: 'mssql',  // Dialeto para SQL Server
  dialectModule: tedious,  // Usando 'tedious' como módulo de conexão
  dialectOptions: {
    options: {
      encrypt: true,  // Azure exige criptografia na conexão
      trustServerCertificate: process.env.NODE_ENV === 'production' ? false : true, // Ajuste para o ambiente de produção
    }
  }
};

// Criar a instância do Sequelize com a configuração
const sequelize = new Sequelize(sequelizeConfig.database, sequelizeConfig.username, sequelizeConfig.password, {
  host: sequelizeConfig.host,
  dialect: sequelizeConfig.dialect,
  dialectModule: sequelizeConfig.dialectModule,  // Passando o tedious aqui
  port: sequelizeConfig.port,
  dialectOptions: sequelizeConfig.dialectOptions,
  logging: process.env.NODE_ENV !== 'production',  // Habilitar logging apenas em desenvolvimento
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
export default sequelize;
