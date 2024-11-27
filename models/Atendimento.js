const { DataTypes } = require('sequelize');
const sequelize = require('../config/database'); // Ajuste o caminho conforme necessário
const Profissional = require('../models/Profissional'); // Modelo Profissional
const Paciente = require('../models/Paciente');
const Encaminhamento = require('../models/Encaminhamento'); // Modelo Encaminhamento

const Atendimento = sequelize.define('Atendimento', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  matricula: {
    type: DataTypes.INTEGER,
    allowNull: false,
    unique: true,
  },
  nomePaciente: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  numeroProcesso: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  telefone: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  assunto: {
    type: DataTypes.ENUM('Acolhimento de disparo', 'Acolhimento psicossocial', 'Exposição negativa na mídia'),
    allowNull: false,
  },
  registroAtendimento: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  encaminhamento: {
    type: DataTypes.ENUM('Assistente social', 'Psicólogo', 'Psiquiatra'),
    allowNull: true,
  },
  profissionalId: {
    type: DataTypes.INTEGER,
    references: {
      model: Profissional,
      key: 'id',
    },
    allowNull: false,
  },
  status: {
    type: DataTypes.ENUM('Pendente', 'Realizado'),
    allowNull: false,
    defaultValue: 'Pendente',
  },
}, {
  timestamps: true,
  hooks: {
    async afterCreate(atendimento, options) {
      try {
        // Buscando o profissional responsável pelo atendimento
        const profissional = await Profissional.findByPk(atendimento.profissionalId);

        // Criando o encaminhamento relacionado ao atendimento
        await Encaminhamento.create({
          nomePaciente: atendimento.nomePaciente,
          matriculaPaciente: atendimento.matricula.toString(),
          nomeProfissional: profissional ? profissional.nome : null,
          profissaoProfissional: atendimento.encaminhamento,
          assuntoAcolhimento: atendimento.assunto,
          descricao: atendimento.registroAtendimento,
          statusAcolhimento: 'Pendente', // Status inicial do encaminhamento
          atendimentoId: atendimento.id, // Relacionando o encaminhamento ao atendimento
        });
      } catch (error) {
        console.error('Erro ao criar o encaminhamento:', error);
      }
    },
  },
});

Atendimento.belongsTo(Profissional, {
  foreignKey: 'profissionalId',
  as: 'profissional' // Definindo um alias explícito
});



// Definindo a associação entre Atendimento e Profissional
Atendimento.belongsTo(Profissional, { foreignKey: 'profissionalId' });
// Definindo a associação entre Atendimento e Encaminhamento
Atendimento.hasMany(Encaminhamento, { foreignKey: 'atendimentoId' });

module.exports = Atendimento;
