const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const Profissional = require('./Profissional');

const Mensagem = sequelize.define('Mensagem', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  remetenteId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'profissional', 
      key: 'id',
    },
  },
  destinatarioId: {
    type: DataTypes.INTEGER,
    allowNull: true, 
    references: {
      model: 'profissional',
      key: 'id',
    },
  },
  destinatarioCargo: {
    type: DataTypes.ENUM('Assistente social', 'Administrador', 'Psicólogo', 'Psiquiatra'),
    allowNull: true,
  },
  assunto: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  corpo: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  visualizada: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  respondida: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  arquivada: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,  
  },
}, {
  tableName: 'mensagem',
  timestamps: true,
});

Mensagem.belongsTo(Profissional, { foreignKey: 'remetenteId', as: 'remetente' });
Mensagem.belongsTo(Profissional, { foreignKey: 'destinatarioId', as: 'destinatario' })

module.exports = Mensagem;