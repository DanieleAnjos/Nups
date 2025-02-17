const { Model, DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const Profissional = require('../models/Profissional');

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
    subTitulo: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    etiqueta: {
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
    autor: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    link: {
        type: DataTypes.TEXT,
        allowNull: true,
        validate: {
            isUrl: true,
        },
    },
    privacidade: {
        type: DataTypes.ENUM('público', 'privado', 'restrito'),
        allowNull: false,
        defaultValue: 'público',
    },
    status: {
        type: DataTypes.ENUM('ativo', 'cancelado', 'concluído'),
        allowNull: false,
        defaultValue: 'ativo',
    },
    destaque: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
    },
    capacidadeMaxima: {
        type: DataTypes.INTEGER,
        allowNull: true,
        validate: {
            min: 1,
        },
    },
    imagePath: {
        type: DataTypes.STRING,
        allowNull: true,
      },
}, {
    sequelize,
    modelName: 'Evento',
    timestamps: true,
});


module.exports = Evento;
