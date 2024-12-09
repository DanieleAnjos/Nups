module.exports = (sequelize) => {
  const { 
    Paciente,
    Atendimento,
    Evento,
    Imagem,
    Produto,
    AjusteEstoque,
    Profissional,
    Mensagem,
    Atendimento2,
    Usuario,
    Encaminhamento,
  } = sequelize.models;

  Evento.hasMany(Imagem, { foreignKey: 'eventoId', as: 'imagens' });
  Imagem.belongsTo(Evento, { foreignKey: 'eventoId' });

  Atendimento.belongsTo(Profissional, { foreignKey: 'profissionalId', as: 'profissional' });
  
  Atendimento2.belongsTo(Profissional, { as: 'profissional', foreignKey: 'profissionalId' });


  Atendimento.belongsTo(Paciente, { foreignKey: 'pacienteId', as: 'paciente' });
  Paciente.hasMany(Atendimento, { foreignKey: 'pacienteId' });

  Atendimento.belongsTo(Encaminhamento, { foreignKey: 'encaminhamentoId', as: 'encaminhamento' });





  Produto.hasMany(AjusteEstoque, { foreignKey: 'produtoId' });
  AjusteEstoque.belongsTo(Produto, { foreignKey: 'produtoId' });

};
