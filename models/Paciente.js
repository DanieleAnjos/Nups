const { DataTypes } = require('sequelize');
const sequelize = require('../config/database'); 

const Paciente = sequelize.define('Paciente', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  dataHoraAtendimento: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW, 
  },
  matricula: {
    type: DataTypes.INTEGER,
    allowNull: false,
    unique: true,
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
        msg: "A data de nascimento não pode ser no futuro."
      },
    },
  },
  sexo: {
    type: DataTypes.ENUM('Masculino', 'Feminino', 'Outro'),
    allowNull: false
  },
  escolaridade: {
    type: DataTypes.ENUM('Ensino Fundamental', 'Ensino Médio', 'Superior'),
    allowNull: false
  },
  endereco: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  cep: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      is: {
        args: /^[0-9]{5}-?[0-9]{3}$/,
        msg: "O CEP deve ter 8 ou 9 dígitos (xxxxx-xxx)."
      },
    },
  },
  bairro: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  cidade: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  estado: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      isAlpha: true,
      len: [2, 2], 
    },
  },
  numero: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  complemento: {
    type: DataTypes.STRING,
    allowNull: true, 
  },
  cpf: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    validate: {
      is: {
        args: /^[0-9]{11}$/, 
        msg: "O CPF deve conter 11 números."
      },
    },
  },
  telefone: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      is: {
        args: /^[0-9]{10,11}$/, 
        msg: "O telefone deve conter entre 10 e 11 números."
      },
    },
  },
  tipoTelefone: {
    type: DataTypes.ENUM('Celular', 'Residencial', 'Comercial'),
    allowNull: false,
  },
  encaminhamento: {
    type: DataTypes.ENUM('Psicologia', 'Serviço Social'),
    allowNull: false,
  },
  nomeContato: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  telefoneContato: {
    type: DataTypes.STRING,
    allowNull: true,
    validate: {
      is: {
        args: /^[0-9]{10,11}$/, 
        msg: "O telefone de contato deve conter entre 10 e 11 números."
      },
    },
  },
  parentesco: {
    type: DataTypes.ENUM('Pai', 'Mãe', 'Filho', 'Cônjuge', 'Outro'),
    allowNull: false,
  },
  postoServiço: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  escala: {
    type: DataTypes.INTEGER,
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
  filhos: {
    type: DataTypes.BOOLEAN,
    allowNull: true,
  },
  quantidadeFilhos: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  idadeFilhos: {
    type: DataTypes.STRING,
    allowNull: true,
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
  observacoes: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  imagePath: {
    type: DataTypes.STRING,
    allowNull: true, 
  },
}, {
  tableName: 'paciente', 
  timestamps: true, 
});

(async () => {
  await sequelize.sync(); 
})();

module.exports = Paciente;
