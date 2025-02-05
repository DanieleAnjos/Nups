const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const Profissional = require('./Profissional'); // Corrigir o caminho, se necessário

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
      model: 'profissional', // Name of the parent table
      key: 'id', // Key in the parent table
    },
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
  },
}, {
  tableName: 'usuarios',
  timestamps: true,
});

Usuario.belongsTo(Profissional, { foreignKey: 'profissionalId', onDelete: 'CASCADE' });

module.exports = Usuario;
