const { DataTypes, Model, Sequelize } = require('sequelize');  
const sequelize = require('../config/database');
const Produto = require('../models/Produto');  

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
  },
  data: {
    type: DataTypes.DATE,
    allowNull: false,
  },
  quantidade: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  tipo: {
    type: DataTypes.ENUM('entrada', 'saida'),
    allowNull: false,
  },
  dataCriacao: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: Sequelize.NOW,  
  },
  dataAtualizacao: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: Sequelize.NOW,  
  },
}, {
  sequelize,
  modelName: 'AjusteEstoque',  
  timestamps: false,  
});

module.exports = AjusteEstoque;
