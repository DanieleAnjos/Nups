// config/sequelize.js
import dotenv from 'dotenv';  // Carregar as variáveis de ambiente
import { Sequelize } from 'sequelize';  // Importar o Sequelize

// Importação do tedious
import * as tedious from 'tedious'; // Usando o 'import' conforme solicitado

dotenv.config();  // Carregar variáveis do arquivo .env

// Configuração do Sequelize
const sequelize = new Sequelize({
  dialect: 'mssql',
  dialectModule: tedious,  // Passando o tedious como módulo de dialeto
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  username: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  dialectOptions: {
    options: {
      encrypt: true,  // Exige criptografia
      trustServerCertificate: process.env.NODE_ENV === 'production' ? false : true, // Para ambiente de produção ou desenvolvimento
    },
  },
});

// Função de teste de conexão
const testConnection = async () => {
  try {
    await sequelize.authenticate();  // Tenta autenticar a conexão
    console.log('Conexão estabelecida com sucesso.');
  } catch (error) {
    console.error('Não foi possível conectar ao banco de dados:', error);
    throw error;
  }
};

testConnection();

// Exportar a instância do Sequelize
export default sequelize;
