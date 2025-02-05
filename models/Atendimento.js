const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Atendimento = sequelize.define('Atendimento', {
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
    validate: {
      isInt: true,
      min: 1,
    },
  },
  assuntoAtendimento: {
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
  pacienteId: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  profissionalId: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
}, {
  tableName: 'atendimento',
});

Atendimento.associate = (models) => {
  Atendimento.belongsTo(models.Profissional, {
    foreignKey: 'profissionalId',
    as: 'profissional',
  });

  Atendimento.belongsTo(models.Paciente, {
    foreignKey: 'pacienteId',
    as: 'paciente',
  });

  Atendimento.hasMany(models.DiscussaoCaso, {
     foreignKey: 'atendimentoId', 
     as: 'discussaoCasos' });

};



module.exports = Atendimento;
