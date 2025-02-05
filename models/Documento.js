const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Documento = sequelize.define('Documento', {
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
  pacienteId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'Pacientes',
      key: 'id',
    },
  },
});

module.exports = Documento;