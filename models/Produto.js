const { DataTypes } = require('sequelize');
const sequelize = require('../config/database'); // Importa a configuração do banco de dados
const Fornecedor = require('./Fornecedor'); // Importa o modelo Fornecedor

const Produto = sequelize.define('Produto', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  nome: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  observacoes: {
    type: DataTypes.STRING,
  },
  fornecedorId: {
    type: DataTypes.INTEGER,
    references: {
      model: Fornecedor, // Referência ao modelo Fornecedor
      key: 'id',
    },
    allowNull: false,
  },
});

// Relacionamento com o modelo Fornecedor
Produto.belongsTo(Fornecedor, {
  foreignKey: 'fornecedorId',
  as: 'fornecedor',
});

module.exports = Produto;
