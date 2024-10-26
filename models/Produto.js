const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Produto = sequelize.define('Produto', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  nome: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      notEmpty: true,
      len: [3, 255], 
    },
  },
  descricao: {
    type: DataTypes.TEXT, 
    allowNull: false,
    validate: {
      notEmpty: true,
      len: [10, 500], 
    },
  },
  categoria: {
    type: DataTypes.ENUM(
      'Papelaria', 
      'Higiene', 
      'Alimentos', 
      'Eletrônicos', 
      'Limpeza',
      'Outros'
    ),
    allowNull: false,
  },
  fornecimento: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      notEmpty: true, 
    },
  },
}, 
);

module.exports = Produto;
