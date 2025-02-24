const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const AjusteEstoque = sequelize.define('AjusteEstoque', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  produtoId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'Produto', // Nome da tabela referenciada
      key: 'id', // Nome da coluna referenciada
    },
    onDelete: 'CASCADE', // Exclui automaticamente os registros relacionados
  },
  data: {
    type: DataTypes.DATE,
    allowNull: false,
  },
  quantidade: {
    type: DataTypes.INTEGER,
    allowNull: false,
    validate: {
      min: 1,
      isInt: true,
    },
  },
  tipo: {
    type: DataTypes.ENUM('entrada', 'saida'),
    allowNull: false,
  },
  motivo: {
    type: DataTypes.STRING,
    allowNull: true,
  },
}, {
  tableName: 'AjusteEstoques',
  timestamps: true,
});

// Defina as associações
AjusteEstoque.associate = (models) => {
  AjusteEstoque.belongsTo(models.Produto, {
    foreignKey: 'produtoId',
    as: 'produto', // Alias para a associação
  });
};

module.exports = AjusteEstoque;