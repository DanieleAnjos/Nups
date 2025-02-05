// models/Produto.js
const { DataTypes, Model, Sequelize } = require('sequelize');  
const sequelize = require('../config/database');  // Assuming you have the sequelize instance configured
const AjusteEstoque = require('./AjusteEstoque'); // Importando o modelo AjusteEstoque


class Produto extends Model {}

Produto.init({
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
  quantidade_inicial: {
    type: DataTypes.INTEGER,
    allowNull: false,
    validate: {
      min: 0,
      isInt: true,
    },
  },
}, {
  sequelize,
  modelName: 'Produto',  
  tableName: 'Produto', // Define o nome da tabela como exatamente 'Produto'
  timestamps: true,  
});

Produto.associate = (models) => {
  Produto.hasMany(AjusteEstoque, {
    foreignKey: 'produtoId',
    as: 'ajustesEstoque',
  });
};



module.exports = Produto;  // Export the Produto modela