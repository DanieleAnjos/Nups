const { DataTypes, Model, Sequelize } = require('sequelize');  
const sequelize = require('../config/database');
const Produto = require('./Produto');  

class AjusteEstoque extends Model {}

AjusteEstoque.init({
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  produtoId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'Produto', // This should match the model name
      key: 'id',
    },
  },
  data: {
    type: DataTypes.DATE,
    allowNull: false,
  },
  quantidade: {
    type: DataTypes.INTEGER,
    allowNull: false,
    validate: {
      min: 1,
      isInt: true,
    },
  },
  tipo: {
    type: DataTypes.ENUM('entrada', 'saida'),
    allowNull: false,
  },
  motivo: {
    type: DataTypes.STRING,
    allowNull: true,
  },

}, {
  sequelize,
  modelName: 'AjusteEstoque',  
  tableName: 'AjusteEstoques', // Nome correto da tabela
  timestamps: false,  
});

AjusteEstoque.associate = (models) => {
  AjusteEstoque.belongsTo(models.Produto, { foreignKey: 'produtoId', as: 'Produto' });

};


module.exports = AjusteEstoque;