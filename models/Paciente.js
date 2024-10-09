const { DataTypes } = require('sequelize');
const sequelize = require('../config/database'); // Importa a configuração do banco de dados

const Paciente = sequelize.define('Paciente', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  matricula: {
    type: DataTypes.INTEGER,
    allowNull: false,
    unique: true,
    validate: {
      isInt: true, // Deve ser um número inteiro
    },
  },
  nome: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      len: [3, 255], // Deve ter entre 3 e 255 caracteres
    },
  },
  dataNascimento: {
    type: DataTypes.DATE,
    allowNull: false,
    validate: {
      isDate: true, // Deve ser uma data válida
      isBefore: {
        args: new Date().toISOString().slice(0, 10), // Data não pode ser futura
        msg: "A data de nascimento não pode ser no futuro."
      },
    },
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
        args: /^[0-9]{5}-?[0-9]{3}$/, // Validação para o formato de CEP (xxxxx-xxx)
        msg: "O CEP deve ter 8 ou 9 dígitos (xxxxx-xxx)."
      },
    },
  },
  cpf: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    validate: {
      is: {
        args: /^[0-9]{11}$/, // Validação para 11 dígitos numéricos
        msg: "O CPF deve conter 11 números."
      },
    },
  },
  sexo: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      isIn: [['Masculino', 'Feminino', 'Outro']], // Adicione suas opções aqui
    },
  },
  telefone: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      is: {
        args: /^[0-9]{10,11}$/, // Validação para 10 ou 11 dígitos numéricos
        msg: "O telefone deve conter entre 10 e 11 números."
      },
    },
  },
  tipoTelefone: {
    type: DataTypes.ENUM('Celular', 'Residencial', 'Comercial'),
    allowNull: false,
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
      isAlpha: true, // Deve conter apenas letras
      len: [2, 2], // Deve ter exatamente 2 caracteres
    },
  },
  numero: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  complemento: {
    type: DataTypes.STRING,
    allowNull: true, // Opcional
  },
  historicoMedico: {
    type: DataTypes.STRING,
    allowNull: true, // Opcional
  },
  status: {
    type: DataTypes.ENUM('Em Atendimento', 'Abandono de Tratamento', 'Alta'),
    allowNull: false,
  },
  encaminhamento: {
    type: DataTypes.ENUM('Psicologia', 'Serviço Social'),
    allowNull: false,
  },
  imagePath: {
    type: DataTypes.STRING,
    allowNull: true, // Opcional
  },
}, {
  tableName: 'paciente', // Define o nome da tabela
  timestamps: true, // Adiciona campos de createdAt e updatedAt
});

(async () => {
    await sequelize.sync(); // Certifique-se de sincronizar seus modelos
})();

// Exporta o modelo para uso em outras partes da aplicação
module.exports = Paciente;
