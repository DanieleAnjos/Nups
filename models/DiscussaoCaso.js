const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const Atendimento = require('../models/Atendimento');
const Profissional = require('../models/Profissional'); // Importe o modelo Profissional corretamente

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
      model: Atendimento, // Referência ao modelo Atendimento
      key: 'id',
    },
    onDelete: 'CASCADE', // Remove a discussão se o atendimento for deletado
  },
  conteudo: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  autor: {
    type: DataTypes.INTEGER.UNSIGNED,  // Assegure que o tipo seja o mesmo
    allowNull: false,
    references: {
      model: Profissional,  // Referência ao modelo Profissional
      key: 'id',
    },
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
  },
  dataHora: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW, // Define a data/hora atual como padrão
  },
}, {
  tableName: 'discussao_casos',
  timestamps: true, // Adiciona createdAt e updatedAt automaticamente
});

// Definindo os relacionamentos
DiscussaoCaso.belongsTo(Atendimento, { foreignKey: 'atendimentoId', as: 'atendimento' });
DiscussaoCaso.belongsTo(Profissional, { foreignKey: 'autor', as: 'profissional' });

module.exports = DiscussaoCaso;