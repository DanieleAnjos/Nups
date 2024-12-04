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

  // Relacionamento entre Evento e Imagem
  Evento.hasMany(Imagem, { foreignKey: 'eventoId', as: 'imagens' });
  Imagem.belongsTo(Evento, { foreignKey: 'eventoId' });

  // Relacionamento entre Atendimento e Profissional
  Atendimento.belongsTo(Profissional, { foreignKey: 'profissionalId', as: 'profissional' });

  // Relacionamento entre Atendimento e Paciente
  Atendimento.belongsTo(Paciente, { foreignKey: 'pacienteId', as: 'paciente' });
  Paciente.hasMany(Atendimento, { foreignKey: 'pacienteId' });

  // Relacionamento entre Atendimento e Encaminhamento
  Atendimento.belongsTo(Encaminhamento, { foreignKey: 'encaminhamentoId', as: 'encaminhamento' });

  Produto.belongsTo(AjusteEstoque);


  Produto.hasMany(AjusteEstoque, { foreignKey: 'produtoId' });
  AjusteEstoque.belongsTo(Produto, { foreignKey: 'produtoId' });

};
