const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');


const AvisoVisualizado = sequelize.define('AvisoVisualizado', {
      avisoId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: 'Avisos',
          key: 'id'
        }
      },
      profissionalId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: 'Profissionais',
          key: 'id'
        }
      },
      vistoEm: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW
      }
    }, {
      tableName: 'AvisoVisualizados',
      timestamps: false
    });
  

module.exports = AvisoVisualizado;
