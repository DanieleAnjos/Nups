const { Model, DataTypes } = require('sequelize');
const sequelize = require('../config/database');

class Evento extends Model {}

Evento.init({
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    },
    titulo: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    descricao: {
        type: DataTypes.TEXT,
        allowNull: false,
    },
    localizacao: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    dataHoraInicio: {
        type: DataTypes.DATE,
        allowNull: false,
    },
    dataHoraFim: {
        type: DataTypes.DATE,
        allowNull: false,
    },
    responsaveis: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    link: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    privacidade: {
        type: DataTypes.STRING,
        allowNull: false,
    },
}, {
    sequelize,
    modelName: 'Evento',
    timestamps: true,
});

module.exports = Evento;
