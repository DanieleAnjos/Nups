const { Sequelize } = require('sequelize');

const sequelizeConfig = {
  database: 'nups_db', 
  username: 'root',           
  password: '1234',           
  host: 'localhost',          
  dialect: 'mysql',           
};

const sequelize = new Sequelize(sequelizeConfig.database, sequelizeConfig.username, sequelizeConfig.password, {
  host: sequelizeConfig.host,
  dialect: sequelizeConfig.dialect,
});

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

module.exports = sequelize; 
