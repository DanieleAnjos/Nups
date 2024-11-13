const sequelize = require('../config/database');
const Paciente = require('./Paciente');
const Atendimento = require('./Atendimento');
const Evento = require('./Evento');
const Imagem = require('./Imagem');
const Produto = require('./Produto');
const AjusteEstoque = require('./AjusteEstoque');

Evento.hasMany(Imagem, { foreignKey: 'eventoId', as: 'imagens' });
Imagem.belongsTo(Evento, { foreignKey: 'eventoId' });
Paciente.belongsTo(Atendimento, { foreignKey: 'matricula' }); 
Atendimento.hasMany(Paciente, { foreignKey: 'matricula' });

Produto.hasMany(AjusteEstoque, {
    foreignKey: 'produtoId',
    as: 'ajustesEstoque',  
  });
  
  AjusteEstoque.belongsTo(Produto, {
    foreignKey: 'produtoId',
    targetKey: 'id',
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
    as: 'produto'  
  });
  
  

module.exports = {
    sequelize,
    Paciente,
    Atendimento,
    Evento,
    Imagem,
    Produto,
    AjusteEstoque,
};
