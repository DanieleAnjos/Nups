const sequelize = require('../config/database');

// Importação dos modelos
const Profissional = require('./Profissional');
const Encaminhamento = require('./Encaminhamento');
const Atendimento = require('./Atendimento'); 
const Documento = require('./Documento');
const Paciente = require('./Paciente');
const DiscussaoCaso = require('./DiscussaoCaso');
const AjusteEstoque = require('./AjusteEstoque'); 
const Produto = require('./Produto');
const Usuario = require('./Usuario');

// Criando um objeto para armazenar os modelos
const models = {
  Profissional,
  Encaminhamento,
  Atendimento,
  Documento, // Adicione os outros modelos aqui
  Paciente, // Adicione os outros modelos aqui
  DiscussaoCaso, // Adicione os outros modelos aqui
  AjusteEstoque, // Adicione os outros modelos aqui
  Produto, // Adicione os outros modelos aqui
  Usuario, // Adicione os outros modelos aqui
};

// Configurando as associações (evita erro caso um modelo não tenha `associate`)
Object.keys(models).forEach((modelName) => {
  if (models[modelName].associate) {
    models[modelName].associate(models);
  }
});

// Exportando os modelos junto com a conexão Sequelize
module.exports = {
  sequelize,
  ...models,
};
