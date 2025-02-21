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
const FluxoAtendimentos = require('./FluxoAtendimentos');
const Notificacao = require('./Notificacao');
const Aviso = require('./Aviso');

const models = {
  Profissional,
  Encaminhamento,
  Atendimento,
  Documento, 
  Paciente, 
  DiscussaoCaso, 
  AjusteEstoque, 
  Produto, 
  Usuario, 
  FluxoAtendimentos, 
  Notificacao, 
  Aviso,  

};

Object.keys(models).forEach((modelName) => {
  if (models[modelName].associate) {
    models[modelName].associate(models);
  }
});

module.exports = {
  sequelize,
  ...models,
};
