const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const Profissional = require('./Profissional');
const Paciente = require('./Paciente');

const Atendimento2 = sequelize.define('Atendimento2', {
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
    type: DataTypes.INTEGER,
    allowNull: false,
    unique: true,
  },
  nomeProfissional: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  registroAtendimento: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  dataAtendimento: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
  },
  discussaoCaso: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  // Definindo as chaves estrangeiras para as associações
  profissionalId: {
    type: DataTypes.INTEGER,
    references: {
      model: Profissional, 
      key: 'id', 
    },
  },
  pacienteId: {
    type: DataTypes.INTEGER,
    references: {
      model: Paciente, 
      key: 'id',
    },
  },
}, {
  tableName: 'atendimento',
  timestamps: true,
});


// Relacionamento entre Atendimento2 e Paciente

Atendimento2.belongsTo(Profissional, {
  foreignKey: 'profissionalId', // O campo de chave estrangeira na tabela Atendimento2
  as: 'profissional', // O alias para a associação
});


(async () => {
  await sequelize.sync(); 
})();

module.exports = Atendimento2;
