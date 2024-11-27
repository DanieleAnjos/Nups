const { DataTypes } = require('sequelize');
const sequelize = require('../config/database'); 
const Atendimento = require('../models/Atendimento'); 
 // Adjust path as necessary

const Encaminhamento = sequelize.define('Encaminhamento', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  nomePaciente: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  matriculaPaciente: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  nomeProfissional: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  profissaoProfissional: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  assuntoAcolhimento: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  descricao: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  statusAcolhimento: {
    type: DataTypes.ENUM('Pendente', 'Realizado'),
    defaultValue: 'Pendente',
  },
  atendimentoId: {
    type: DataTypes.INTEGER,
    references: {
      model: 'Atendimentos', // The table name (it should match the one in the DB)
      key: 'id',
    },
    allowNull: false,
  },
});

module.exports = Encaminhamento;
