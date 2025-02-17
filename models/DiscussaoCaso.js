const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const Atendimento = require('../models/Atendimento');
const Profissional = require('../models/Profissional'); 

const DiscussaoCaso = sequelize.define('DiscussaoCaso', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  atendimentoId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: Atendimento, 
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
    defaultValue: DataTypes.NOW, 
  },
}, {
  tableName: 'discussao_casos',
  timestamps: true, 
});

DiscussaoCaso.belongsTo(Atendimento, { foreignKey: 'atendimentoId', as: 'atendimento' });
DiscussaoCaso.belongsTo(Profissional, { foreignKey: 'autor', as: 'profissional' });

module.exports = DiscussaoCaso;