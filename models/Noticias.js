const { Model, DataTypes } = require('sequelize');
const sequelize = require('../config/database');

class Noticias extends Model {}

Noticias.init({
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
    autor: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    imagePath: {
        type: DataTypes.STRING,
        allowNull: true,
      },
}, {
    sequelize,
    modelName: 'Noticias',
    timestamps: true,
});


module.exports = Noticias;
