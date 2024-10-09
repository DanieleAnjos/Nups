const { DataTypes } = require('sequelize');
const sequelize = require('./Index');

const Sala = sequelize.define('Sala', {
  nome: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true // Garantir que não haja duas salas com o mesmo nome
  },
  capacidade: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  // Outras propriedades relevantes para a sala, como equipamentos disponíveis, etc.
}, {
  tableName: 'salas', // Nome da tabela no banco de dados
  timestamps: true // Para acompanhar a criação e atualização
});

module.exports = Sala;
