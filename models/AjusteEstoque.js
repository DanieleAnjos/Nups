const { DataTypes, Model } = require('sequelize');
const sequelize = require('../config/database');
const Produto = require('./Produto'); 

class AjusteEstoque extends Model {}

AjusteEstoque.init({
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  produtoId: {
    type: DataTypes.INTEGER,
    references: {
      model: Produto, 
      key: 'id',
    },
    allowNull: false,
    onDelete: 'CASCADE' 
  },
  data: {
    type: DataTypes.DATE, 
    allowNull: false,
    defaultValue: DataTypes.NOW,
  },
  quantidade: {
    type: DataTypes.INTEGER,
    allowNull: false,
    validate: {
      min: 0 
    }
  },
  tipo: {
    type: DataTypes.ENUM('adição', 'ajuste'),
    allowNull: false,
  },
}, {
  sequelize,
  modelName: 'AjusteEstoque',
  tableName: 'ajustes_estoque', 
  timestamps: true, 
  createdAt: 'dataCriacao', 
  updatedAt: 'dataAtualizacao' 
});

AjusteEstoque.belongsTo(Produto, {
  foreignKey: 'produtoId',
  as: 'produto' 
});

module.exports = AjusteEstoque;
