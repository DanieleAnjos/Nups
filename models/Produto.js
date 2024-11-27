const { DataTypes, Model } = require('sequelize');
const sequelize = require('../config/database');  // Supondo que você tenha a instância do sequelize configurada
const AjusteEstoque = require('../models/AjusteEstoque');  // Importe o modelo AjusteEstoque aqui

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
  timestamps: true,  
});

// Agora que o modelo foi criado, defina a associação
Produto.hasMany(AjusteEstoque, {
  foreignKey: 'produtoId',
  as: 'ajustesEstoque'
});


module.exports = Produto;  // Exporte o modelo Produto depois das associações
