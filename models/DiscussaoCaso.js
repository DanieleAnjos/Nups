const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const Atendimento = require('../models/Atendimento');
const Profissional = require('../models/Profissional'); 
const FluxoAtendimentos = require('../models/FluxoAtendimentos');

const DiscussaoCaso = sequelize.define('DiscussaoCaso', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  atendimentoId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: Atendimento, 
      key: 'id',
    },
    onDelete: 'CASCADE', 
  },
  fluxoAtendimentoId: {
    type: DataTypes.INTEGER,
    allowNull: true, // Permite ser nulo, pois pode estar associado a Atendimento
    references: {
      model: FluxoAtendimentos,
      key: 'id',
    },
    onDelete: 'CASCADE',
  },
  conteudo: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  autor: {
    type: DataTypes.INTEGER, 
    allowNull: false,
    references: {
      model: Profissional,  
      key: 'id',
    },
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
  },
  dataHora: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: () => new Date(), // Data e hora atuais
  }
}, {
  tableName: 'discussao_casos',
  timestamps: true, 
});

DiscussaoCaso.belongsTo(Atendimento, { foreignKey: 'atendimentoId', as: 'atendimento' });
DiscussaoCaso.belongsTo(FluxoAtendimentos, { foreignKey: 'fluxoAtendimentoId', as: 'fluxoAtendimento' });
DiscussaoCaso.belongsTo(Profissional, { foreignKey: 'autor', as: 'profissional' });


module.exports = DiscussaoCaso;