const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Sala = sequelize.define('Sala', {
  nome: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      notEmpty: true, 
      len: [3, 100], 
    },
  },
  capacidade: {
    type: DataTypes.INTEGER,
    allowNull: false,
    validate: {
      min: 1, 
      isInt: true, 
    },
  },
  descricao: {
    type: DataTypes.STRING,
    allowNull: true,
  },
}, {
  tableName: 'salas', 
  timestamps: true, 
});

module.exports = Sala;
