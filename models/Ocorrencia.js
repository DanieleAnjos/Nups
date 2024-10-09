const { DataTypes, Model } = require('sequelize');
const sequelize = require('../config/database');
const Profissional = require('./Profissional'); 

class Ocorrencia extends Model {}

Ocorrencia.init({
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  data: {
    type: DataTypes.DATEONLY, 
    allowNull: false,
    defaultValue: DataTypes.NOW
  },
  relatorio: {
    type: DataTypes.TEXT,
    allowNull: false 
  },
  horarioChegada: {
    type: DataTypes.TIME,
    allowNull: false,
    validate: {
        isAfter(value) {
            const now = new Date();
            const currentHour = now.getHours().toString().padStart(2, '0');
            const currentMinute = now.getMinutes().toString().padStart(2, '0');
            const currentTime = `${currentHour}:${currentMinute}:00`; 

            if (value <= currentTime) {
                throw new Error("O horário de chegada deve ser um horário futuro.");
            }
        }
    }
},

  horarioSaida: { 
    type: DataTypes.TIME,
    allowNull: true,
    validate: {
      isAfter(value) {
        if (value && this.horarioChegada) {
          if (new Date(`1970-01-01T${value}Z`) <= new Date(`1970-01-01T${this.horarioChegada}Z`)) {
            throw new Error("O horário de saída deve ser após o horário de chegada.");
          }
        }
      }
    }
  },
  profissionalId: { 
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
  modelName: 'Ocorrencia',
  tableName: 'ocorrencias_diarias',
  timestamps: true,
  createdAt: 'dataCriacao', 
  updatedAt: 'dataAtualizacao' 
});

Ocorrencia.belongsTo(Profissional, {
  foreignKey: 'profissionalId',
  as: 'profissional' 
});

Ocorrencia.prototype.isClosed = function () {
  return this.horarioSaida !== null;
};

module.exports = Ocorrencia;
