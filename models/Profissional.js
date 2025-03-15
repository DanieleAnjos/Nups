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
  matricula: {
    type: DataTypes.INTEGER,
    allowNull: function () {
      return this.vinculo === 'Servidor';
    },
    unique: function () {
      return this.vinculo === 'Servidor';
    },
    validate: {
      isInt: true,
    },
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: false,
    validate: {
      isEmail: true,
    },
  },
  dataAdmissao: {
    type: DataTypes.DATEONLY,
    allowNull: false,
  },
  cargo: {
    type: DataTypes.ENUM('Gestor Servico Social', 'Gestor Psicologia','Gestor Adms', 'Gestor Psiquiatria' ,'Administrador','Adm', 'Assistente social', 'Psicólogo', 'Psiquiatra'),
    allowNull: false,
  },
  vinculo: {
    type: DataTypes.ENUM('Servidor', 'Voluntario'),
    allowNull: false,
  },
  cpf: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      is: /^\d{3}\.\d{3}\.\d{3}-\d{2}$/ 
    }
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
  cep: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      is: /^\d{5}-\d{3}$/
    }
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
  status: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: 'Ativo',
  },
}, {
  tableName: 'profissional',
  timestamps: true,
});

Profissional.associate = (models) => {
    Profissional.hasMany(models.Atendimento, {
      foreignKey: 'profissionalId',
      as: 'atendimentos',
    });

  Profissional.hasMany(models.Encaminhamento, {
    foreignKey: 'profissionalIdEnvio',
    as: 'encaminhamentosEnviados',
  });

  Profissional.hasMany(models.Encaminhamento, {
    foreignKey: 'profissionalIdRecebido',
    as: 'encaminhamentosRecebidos',
  });

  Profissional.hasMany(models.FluxoAtendimentos, {
    foreignKey: 'profissionalIdEnvio',
    as: 'fluxoAtendimentosEnviados',
  });

  Profissional.hasMany(models.FluxoAtendimentos, {
    foreignKey: 'profissionalIdRecebido',
    as: 'fluxoAtendimentosRecebidos',
  });

  Profissional.associate = (models) => {
    Profissional.hasMany(models.Aviso, { 
      foreignKey: 'profissionalId', 
      as: 'avisos' 
    });
  };


  Profissional.hasMany(models.DiscussaoCaso, {
     foreignKey: 'autor',
      as: 'discussaoCasos' });

      Profissional.hasMany(models.Usuario, {
        foreignKey: 'profissionalId',
        as: 'usuarios',
      });
      
      Profissional.hasMany(models.Aviso, {
        foreignKey: 'profissionalId',
        as: 'avisosCriados'
      });
      Profissional.belongsToMany(models.Aviso, {
        through: 'AvisoVisualizado',
        foreignKey: 'profissionalId',
        as: 'avisosVisualizados'
      });
};


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
  if (this.cep && !this.endereco && !this.bairro && !this.cidade && !this.estado) {
    try {
      const response = await axios.get(`https://viacep.com.br/ws/${this.cep}/json/`);
      const { logradouro, bairro, localidade, uf } = response.data;
      
      if (!this.endereco) this.endereco = logradouro;
      if (!this.bairro) this.bairro = bairro;
      if (!this.cidade) this.cidade = localidade;
      if (!this.estado) this.estado = uf;
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