const Profissional = require('./Profissional');
const Paciente = require('./Paciente'); 
const { DataTypes, Model } = require('sequelize');
const sequelize = require('../config/database');

class Atendimento extends Model {}

Atendimento.init({
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  matriculaPaciente: {
    type: DataTypes.INTEGER, 
    allowNull: false,
    references: {
      model: Paciente, 
      key: 'matricula' 
    }
  },
  nomePaciente: {
    type: DataTypes.STRING,
    allowNull: false
  },
  numeroProcesso: {
    type: DataTypes.STRING,
    allowNull: false
  },
  assunto: {
    type: DataTypes.ENUM('Acolhimento de disparo', 'Acolhimento psicossocial', 'Exposição negativa na mídia'),
    allowNull: false
  },
  registroAtendimento: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  acolhidoEm: {
    type: DataTypes.DATEONLY,
    allowNull: false
  },
  profissionalId: {
    type: DataTypes.INTEGER,
    references: {
      model: Profissional,
      key: 'id'
    },
    allowNull: false
  },
  especialidade: {
    type: DataTypes.ENUM('Assistente Social', 'Psicólogo', 'Psiquiatra'),
    allowNull: false 
  },
  profissionalAtendimento: {
    type: DataTypes.STRING, 
    allowNull: false
  },
}, { 
  sequelize, 
  modelName: 'Atendimento' 
});


Atendimento.belongsTo(Profissional, {
  foreignKey: 'profissionalId',
  as: 'profissional'
});


Atendimento.belongsTo(Paciente, {
  foreignKey: 'matriculaPaciente', 
  targetKey: 'matricula', 
  as: 'paciente' 
});

module.exports = Atendimento;
