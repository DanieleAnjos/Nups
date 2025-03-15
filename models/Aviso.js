const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Aviso = sequelize.define('Aviso', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  assunto: {
    type: DataTypes.STRING,
    allowNull: false
  },
  mensagem: {
    type: DataTypes.STRING,
    allowNull: false
  },
  data: {
    type: DataTypes.DATEONLY,
    allowNull: false
  },
  tipo: {
    type: DataTypes.ENUM('lembrete', 'alerta', 'administrativo'),
    allowNull: false,
    defaultValue: 'lembrete',
  },
  cargoAlvo: {
    type: DataTypes.STRING
  }, 
  profissionalId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'profissional', 
      key: 'id',
    },
    timestamps: true, 
  }
});

Aviso.associate = (models) => {
  Aviso.belongsTo(models.Profissional, { 
    foreignKey: 'profissionalId', 
    as: 'profissional' 
  });
};

module.exports = Aviso;
