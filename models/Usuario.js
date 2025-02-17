const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const Profissional = require('./Profissional'); 

const Usuario = sequelize.define('Usuario', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  usuario: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  senha: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  resetToken: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  resetTokenExpires: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  profissionalId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'profissional', 
      key: 'id', 
    },
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
  },
}, {
  tableName: 'usuarios',
  timestamps: true,
});

Usuario.belongsTo(Profissional, {
  foreignKey: 'profissionalId',
  onDelete: 'CASCADE',
  onUpdate: 'CASCADE',
  as: 'profissional', 
});

module.exports = Usuario;
