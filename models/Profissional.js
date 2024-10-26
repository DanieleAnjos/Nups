const argon2 = require('argon2');
const axios = require('axios');
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Profissional = sequelize.define('Profissional', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  nome: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    validate: {
      isEmail: true,
    },
  },
  matricula: {
    type: DataTypes.INTEGER,
    allowNull: false,
    unique: true,
  },
  dataAdmissao: {
    type: DataTypes.DATEONLY,
    allowNull: false,
  },
  cargo: {
    type: DataTypes.ENUM('Assistente social', 'Administrador', 'Psicólogo', 'Psiquiatra'),
    allowNull: false,
  },
  vinculo: {
    type: DataTypes.ENUM('Servidor', 'Voluntario'),
    allowNull: false,
  },
  cpf: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    validate: {
      is: /^[0-9]{11}$/, 
    },
  },
  dataNascimento: {
    type: DataTypes.DATEONLY,
    allowNull: false,
  },
  sexo: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  estadoCivil: {
    type: DataTypes.ENUM('Casado', 'Solteiro', 'Divorciado'),
    allowNull: true,
  },
  nomeBanco: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  agencia: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  contaBanco: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  cep: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      is: /^[0-9]{8}$/, 
    },
  },
  endereco: {
    type: DataTypes.STRING,
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
    type: DataTypes.ENUM('AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN', 'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'),
    allowNull: false,
  },
  numero: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  complemento: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  telefone: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      is: /^[0-9]{10,11}$/, 
    },
  },
  tipoTelefone: {
    type: DataTypes.ENUM('Celular', 'Residencial', 'Comercial'),
    allowNull: false,
  },
  imagePath: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  contatoEmergenciaNome: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  telefoneContatoEmergencia: {
    type: DataTypes.STRING,
    allowNull: true,
  },
}, {
  tableName: 'profissional',
  timestamps: true,
});


Profissional.prototype.isVolunteerTermExpired = function () {
  if (this.vinculo === 'Voluntario') {
    const today = new Date();
    const nextTermDate = new Date(this.dataAdmissao);
    nextTermDate.setFullYear(nextTermDate.getFullYear() + 1);
    return today >= nextTermDate;
  }
  return false;
};

Profissional.prototype.fillAddressFromCep = async function () {
  if (this.cep) {
    try {
      const response = await axios.get(`https://viacep.com.br/ws/${this.cep}/json/`);
      const { logradouro, bairro, localidade, uf } = response.data;
      
      this.endereco = logradouro;
      this.bairro = bairro;
      this.cidade = localidade;
      this.estado = uf;
    } catch (error) {
      throw new Error('Não foi possível buscar o endereço pelo CEP.');
    }
  }
};

Profissional.beforeCreate(async (profissional) => {
  await profissional.fillAddressFromCep();
});

Profissional.beforeUpdate(async (profissional) => {
  if (profissional.changed('cep')) {
    await profissional.fillAddressFromCep();
  }
});

(async () => {
  await sequelize.sync(); 
})();

module.exports = Profissional;
