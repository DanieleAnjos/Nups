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
    unique: true,
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
    references: {
      model: Profissional,
      key: 'id',
    },
    onDelete: 'CASCADE',
  },
}, {
  tableName: 'usuarios',
  timestamps: true,
});

Usuario.belongsTo(Profissional, { foreignKey: 'profissionalId', onDelete: 'CASCADE' });

module.exports = Usuario;
