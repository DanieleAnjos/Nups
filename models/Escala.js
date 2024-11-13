const { DataTypes, Model } = require('sequelize');
const sequelize = require('../config/database'); 
const Profissional = require('../models/Profissional'); 

class Escala extends Model {}

Escala.init({
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  data: {
    type: DataTypes.DATEONLY, 
    allowNull: false
  },
  horarioInicio: {
    type: DataTypes.TIME,
    allowNull: false
  },
  horarioFim: {
    type: DataTypes.TIME,
    allowNull: false,
    validate: {
      isAfter(value) {
        if (value <= this.horarioInicio) {
          throw new Error("O horário de fim deve ser após o horário de início.");
        }
      }
    }
  },
  adminId: {
    type: DataTypes.INTEGER,
    references: {
      model: Profissional, 
      key: 'id'
    },
    allowNull: false,
    onDelete: 'CASCADE' 
  }
}, {
  sequelize,
  modelName: 'Escala',
  tableName: 'escalas', 
  timestamps: true, 
  createdAt: 'dataCriacao', 
  updatedAt: 'dataAtualizacao' 
});

Escala.belongsTo(Profissional, {
  foreignKey: 'adminId',
  as: 'admin' 
});

module.exports = Escala;
