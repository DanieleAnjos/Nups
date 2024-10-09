const { DataTypes, Model } = require('sequelize');
const sequelize = require('../config/database'); 
const Profissional = require('./Profissional'); 

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
      model: Profissional, // Referência ao modelo Profissional
      key: 'id'
    },
    allowNull: false,
    onDelete: 'CASCADE' // Comportamento de exclusão em cascata
  }
}, {
  sequelize,
  modelName: 'Escala',
  tableName: 'escalas', // Nome da tabela
  timestamps: true, // Se precisar de timestamps
  createdAt: 'dataCriacao', // Nome da coluna para data de criação
  updatedAt: 'dataAtualizacao' // Nome da coluna para data de atualização
});

// Definindo o relacionamento
Escala.belongsTo(Profissional, {
  foreignKey: 'adminId',
  as: 'admin' // Alias para o relacionamento
});

module.exports = Escala;
