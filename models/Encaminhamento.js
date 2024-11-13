const { DataTypes } = require('sequelize');
const sequelize = require('../config/database'); 
const Atendimento = require('../models/Atendimento');  

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
    type: DataTypes.ENUM('Assistente social', 'Psicólogo', 'Psiquiatra'),
    allowNull: false,
  },
  assuntoAcolhimento: {
    type: DataTypes.ENUM('Acolhimento de disparo', 'Acolhimento psicossocial', 'Exposição negativa na mídia'),
    allowNull: false,
  },
  descricao: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  statusAcolhimento: {
    type: DataTypes.ENUM('Pendente', 'Realizado'),
    allowNull: false,
    defaultValue: 'Pendente',
  },
  atendimentoId: {
    type: DataTypes.INTEGER,
    references: {
      model: 'Atendimentos',  
      key: 'id',
    },
    allowNull: false,
  },
}, {
  sequelize,
  timestamps: true,
});


module.exports = Encaminhamento;
