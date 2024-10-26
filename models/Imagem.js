const { Model, DataTypes } = require('sequelize');
const sequelize = require('../config/database');

class Imagem extends Model {}

Imagem.init({
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    },
    eventoId: {
        type: DataTypes.INTEGER,
        allowNull: false,
    },
    path: {
        type: DataTypes.STRING,
        allowNull: false,
    },
}, {
    sequelize,
    modelName: 'Imagem',
    timestamps: true,
});

module.exports = Imagem;
