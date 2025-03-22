// models/Arquivo.js
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Arquivo = sequelize.define('Arquivo', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  nome: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  caminho: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  profissionalId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'profissional',
      key: 'id',
    },
  },
  descricao: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  createdAt: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
  },
  updatedAt: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
  },
});

module.exports = Arquivo;