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
    defaultValue: () => new Date().toISOString().split('T')[0], // Data atual
  },
  relatorio: {
    type: DataTypes.TEXT,
    allowNull: false 
  },
  horarioChegada: {
    type: DataTypes.TIME,
    allowNull: false
  },
  horarioSaida: { 
    type: DataTypes.TIME,
    allowNull: true,
    validate: {
      isAfter(value) {
        if (value && this.horarioChegada) {
          const chegada = new Date(`1970-01-01T${this.horarioChegada}Z`);
          const saida = new Date(`1970-01-01T${value}Z`);

          if (saida <= chegada) {
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
