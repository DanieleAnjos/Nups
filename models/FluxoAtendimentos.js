const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const FluxoAtendimentos = sequelize.define('FluxoAtendimentos', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  nomePaciente: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  data: {
    type: DataTypes.DATEONLY,
    allowNull: false,
    defaultValue: () => new Date().toISOString().split('T')[0], 
  },
  matriculaPaciente: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  numeroProcesso: {
    type: DataTypes.STRING(11),
    allowNull: true,
    validate: {
      is: /^\d{6}\/\d{4}$/, // Garante que o valor armazenado esteja no formato correto
    },
    set(value) {
      if (!value) {
        this.setDataValue('numeroProcesso', null); // Permite null
        return;
      }
  
      if (typeof value !== 'string') {
        throw new Error('O número do processo deve ser uma string.');
      }
  
      const numeroLimpo = value.replace(/\D/g, ''); // Remove caracteres não numéricos
  
      if (numeroLimpo.length !== 10) {
        throw new Error('O número do processo deve estar no formato correto: XXXXXX/XXXX');
      }
  
      const numeroFormatado = `${numeroLimpo.slice(0, 6)}/${numeroLimpo.slice(6)}`;
      this.setDataValue('numeroProcesso', numeroFormatado);
    },
  },  
  telefonePaciente: {
    type: DataTypes.STRING,
    allowNull: true,
    validate: {
      is: /^[0-9]{10,11}$/,
    },
  },
  assuntoAcolhimento: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  descricao: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  visto: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  profissionalIdEnvio: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  profissionalIdRecebido: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  atendimentoId: {
    type: DataTypes.INTEGER,
    allowNull: true, 
  },
}, {
  tableName: 'fluxoAtendimentos',
  timestamps: true,
});

FluxoAtendimentos.associate = (models) => {
  FluxoAtendimentos.belongsTo(models.Profissional, {
    foreignKey: 'profissionalIdEnvio',
    as: 'profissionalEnvio',
  });

  FluxoAtendimentos.belongsTo(models.Profissional, {
    foreignKey: 'profissionalIdRecebido',
    as: 'profissionalRecebido',
  });

  FluxoAtendimentos.belongsTo(models.Atendimento, {
    foreignKey: 'atendimentoId',
    as: 'atendimento', 
    allowNull: true,
  });

  FluxoAtendimentos.hasMany(models.DiscussaoCaso, {
    foreignKey: 'fluxoAtendimentoId',
    as: 'discussoes',
  });
};

module.exports = FluxoAtendimentos; 