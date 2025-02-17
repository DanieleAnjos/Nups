const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const Atendimento = require('../models/Atendimento');
const Profissional = require('../models/Profissional');
const Documento = require('../models/Documento');
const axios = require('axios');

const Paciente = sequelize.define('Paciente', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  matricula: {
    type: DataTypes.INTEGER,
    allowNull: false,
    validate: {
      isInt: true,
    },
  },
  nome: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      len: [3, 255],
    },
  },
  dataNascimento: {
    type: DataTypes.DATE,
    allowNull: false,
    validate: {
      isDate: true,
      isBefore: {
        args: new Date().toISOString().slice(0, 10),
        msg: "A data de nascimento não pode ser no futuro.",
      },
    },
  },
  sexo: {
    type: DataTypes.ENUM('Masculino', 'Feminino', 'Outro'),
    allowNull: false,
  },
  escolaridade: {
    type: DataTypes.ENUM('Ensino Fundamental', 'Ensino Médio', 'Superior'),
    allowNull: true,
  },
  endereco: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  cep: {
    type: DataTypes.STRING,
    allowNull: true,
    validate: {
      isValid(value) {
        if (value && !/^[0-9]{5}-?[0-9]{3}$/.test(value)) {
          throw new Error("O CEP deve ter 8 ou 9 dígitos (xxxxx-xxx).");
        }
      },
    },
  },
  bairro: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  cidade: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  estado: {
    type: DataTypes.STRING,
    allowNull: true,
    validate: {
      is: {
        args: /^[A-Z]{2}$/,
        msg: "O estado deve ter exatamente 2 caracteres alfabéticos maiúsculos.",
      },
    },
  },
  numero: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  complemento: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  cpf: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      is: {
        args: /^[0-9]{11}$/,
        msg: "O CPF deve conter 11 números.",
      },
    },
  },
  rg: {
    type: DataTypes.STRING,
    allowNull: true,
    validate: {
      is: {
        args: /^[0-9]{9}$/,
        msg: "O RG deve conter 9 números.",
      },
    },
  },
  telefone: {
    type: DataTypes.STRING,
    allowNull: true,
    validate: {
      isEmptyOrValid(value) {
        if (value && !/^[0-9]{10,11}$/.test(value)) {
          throw new Error("O telefone deve conter entre 10 e 11 números.");
        }
      },
    },
  },
  tipoTelefone: {
    type: DataTypes.ENUM('Celular', 'Residencial', 'Comercial'),
    allowNull: true,
  },
  nomeContato: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  telefoneContato: {
    type: DataTypes.STRING,
    allowNull: true,
    validate: {
      isEmptyOrValid(value) {
        if (value && !/^[0-9]{10,11}$/.test(value)) {
          throw new Error("O telefone de contato deve conter entre 10 e 11 números.");
        }
      },
    },
  },
  parentesco: {
    type: DataTypes.ENUM('Pai', 'Mãe', 'Filho', 'Cônjuge', 'Outro'),
    allowNull: true,
  },
  postoServiço: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  escala: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  tempoServiço: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  periodoEscala: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  porteArma: {
    type: DataTypes.BOOLEAN,
    allowNull: true,
  },
  trabalhoArmado: {
    type: DataTypes.BOOLEAN,
    allowNull: true,
  },
  armaPessoal: {
    type: DataTypes.BOOLEAN,
    allowNull: true,
  },
  planoSaude: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  cartaoSus: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  alergia: {
    type: DataTypes.BOOLEAN,
    allowNull: true,
  },
  alergiaMedicamento: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  doenca: {
    type: DataTypes.BOOLEAN,
    allowNull: true,
  },
  descricaoDoenca: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  medicamentos: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  tipoMedicamento: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  seguroVida: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  comoConheceuEmpresa: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  terapia: {
    type: DataTypes.BOOLEAN,
    allowNull: true,
  },
  terapiaPeriodo: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  terapiaMotivo: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  possuiFilhos: {
    type: DataTypes.BOOLEAN,
    allowNull: true,
  },
  quantidadeFilhos: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  filhos: {
    type: DataTypes.TEXT, 
    allowNull: true,
    get() {
      const rawValue = this.getDataValue('filhos');
      return rawValue ? JSON.parse(rawValue) : [];
    },
    set(value) {
      this.setDataValue('filhos', JSON.stringify(value));
    }
  },
  moradia: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  familiaDeficiencias: {
    type: DataTypes.BOOLEAN,
    allowNull: true,
  },
  deficiencia: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  atividadeFisica: {
    type: DataTypes.BOOLEAN,
    allowNull: true,
  },
  tipoAtividadeFisica: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  relacaoSupervisor: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  observacoes: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  relatorio: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  imagePath: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  status: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: 'Ativo',
  },
  statusPaciente: {
    type: DataTypes.ENUM('Em Atendimento', 'Abandono de Tratamento', 'Alta'),
    allowNull: true,
    defaultValue: 'Em Atendimento',
  },
});

Paciente.fillAddressFromCep = async function (cep) {
  try {
    const response = await axios.get(`https://viacep.com.br/ws/${cep}/json/`);
    const { logradouro, bairro, localidade, uf } = response.data;
    return { logradouro, bairro, cidade: localidade, estado: uf };
  } catch (error) {
    throw new Error('Erro ao buscar o endereço');
  }
};

Paciente.fillFromAtendimento = async function (atendimentoId) {
  const atendimento = await Atendimento.findByPk(atendimentoId);
  if (atendimento) {
    return {
      nome: atendimento.nomePaciente,
      numeroProcesso: atendimento.numeroProcesso,
    };
  }
  return null;
};

Paciente.hasMany(Documento, { foreignKey: 'pacienteId', as: 'documentos' });

Paciente.associate = (models) => {
  Paciente.hasMany(models.Atendimento, {
    foreignKey: 'pacienteId',
    as: 'atendimentos',
  });
};


module.exports = Paciente;
