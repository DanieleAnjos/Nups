const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

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
  data: {
    type: DataTypes.DATEONLY,
    allowNull: false,
    defaultValue: () => new Date().toISOString().split('T')[0], 
  },
  matriculaPaciente: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  telefonePaciente: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      is: /^[0-9]{10,11}$/,
    },
  },
  assuntoAcolhimento: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  descricao: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  visto: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  profissionalIdEnvio: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  profissionalIdRecebido: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  atendimentoId: {
    type: DataTypes.INTEGER,
    allowNull: true, // Encaminhamento pode ou não estar associado a um atendimento
  },
}, {
  tableName: 'encaminhamento',
  timestamps: true,
});

// Defina as associações
Encaminhamento.associate = (models) => {
  Encaminhamento.belongsTo(models.Profissional, {
    foreignKey: 'profissionalIdEnvio',
    as: 'profissionalEnvio',
  });

  Encaminhamento.belongsTo(models.Profissional, {
    foreignKey: 'profissionalIdRecebido',
    as: 'profissionalRecebido',
  });

  Encaminhamento.belongsTo(models.Atendimento, {
    foreignKey: 'atendimentoId',
    as: 'atendimento', // Alias utilizado na associação
    allowNull: true,
  });
};

module.exports = Encaminhamento; // Exporte o modelo corretamente