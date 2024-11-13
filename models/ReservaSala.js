const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const Sala = require('./Sala'); 
const Profissional = require('./Profissional'); 

const ReservaSala = sequelize.define('ReservaSala', {
  salaId: { 
    type: DataTypes.INTEGER,
    references: {
      model: Sala, 
      key: 'id'
    },
    allowNull: false
  },
  data: {
    type: DataTypes.DATEONLY,
    allowNull: false
  },
  horarioInicial: {
    type: DataTypes.TIME,
    allowNull: false,
    validate: {
      isAfter(value) {
        if (this.horarioFinal && value >= this.horarioFinal) {
          throw new Error("O horário inicial deve ser anterior ao horário final.");
        }
      }
    }
  },
  horarioFinal: {
    type: DataTypes.TIME,
    allowNull: false,
    validate: {
      isAfter(value) {
        if (this.horarioInicial && value <= this.horarioInicial) {
          throw new Error("O horário final deve ser posterior ao horário inicial.");
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
    allowNull: false 
  }
}, {
  tableName: 'reservas_sala',
  timestamps: true 
});

ReservaSala.belongsTo(Sala, {
  foreignKey: 'salaId',
  as: 'sala' 
});
ReservaSala.belongsTo(Profissional, {
  foreignKey: 'profissionalId',
  as: 'profissional'
});

module.exports = ReservaSala;
