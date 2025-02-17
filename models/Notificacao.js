// models/Notificacao.js
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const Profissional = require('./Profissional'); 


const Notificacao = sequelize.define('Notificacao', {
  mensagem: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  dataEnvio: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
  },
  profissionalId: {
    type: DataTypes.INTEGER,
    references: {
      model: Profissional, 
      key: 'id'
    },
  },
  lida: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
});

Notificacao.associate = function(models) {
  Notificacao.belongsTo(models.Profissional, { foreignKey: 'profissionalId' });
};

module.exports = Notificacao; 
