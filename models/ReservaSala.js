const { DataTypes } = require('sequelize');
const sequelize = require('./Index');
const Sala = require('./Sala'); // Importa o modelo Sala

const ReservaSala = sequelize.define('ReservaSala', {
  salaId: { // Agora referenciamos a sala pelo ID
    type: DataTypes.INTEGER,
    references: {
      model: Sala, // Referência ao modelo Sala
      key: 'id'
    },
    allowNull: false
  },
  data: {
    type: DataTypes.DATEONLY,
    allowNull: false
  },
  horario: {
    type: DataTypes.TIME,
    allowNull: false
  },
  profissionalId: {
    type: DataTypes.INTEGER,
    references: {
      model: 'Profissionais',
      key: 'id'
    },
    allowNull: false // O profissional que faz a reserva é obrigatório
  }
}, {
  tableName: 'reservas_sala', // Nome da tabela no banco de dados
  timestamps: true // Para acompanhar a criação e atualização
});

// Relacionamentos
ReservaSala.belongsTo(Sala, {
  foreignKey: 'salaId',
  as: 'sala' // Alias para o relacionamento
});

module.exports = ReservaSala;
