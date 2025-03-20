const { Op, Sequelize } = require('sequelize');
const Paciente = require('../models/Paciente');
const Encaminhamento = require('../models/Encaminhamento');
const Atendimento = require('../models/Atendimento'); 
const Profissional = require('../models/Profissional'); 

const express = require('express');

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const pacientesPorPeriodo = await Paciente.findAll({
      attributes: [
        [Sequelize.fn('DATE_FORMAT', Sequelize.col('createdAt'), '%Y-%m'), 'mes_ano'], 
        [Sequelize.fn('COUNT', Sequelize.col('id')), 'quantidade']
      ],
      group: [Sequelize.fn('DATE_FORMAT', Sequelize.col('createdAt'), '%Y-%m')],
      order: [Sequelize.fn('DATE_FORMAT', Sequelize.col('createdAt'), '%Y-%m')]
    });

    const pacientesLabels = pacientesPorPeriodo.map(paciente => {
      const mesAno = paciente.get('mes_ano');
      const [ano, mes] = mesAno.split('-');
      return `${mes}/${ano}`;
    });

    const pacientesData = pacientesPorPeriodo.map(paciente => paciente.get('quantidade'));

    const totalPacientes = pacientesData.reduce((acc, val) => acc + val, 0);

    const encaminhamentosPorPeriodo = await Encaminhamento.findAll({
      attributes: [
        [Sequelize.fn('DATE_FORMAT', Sequelize.col('createdAt'), '%Y-%m'), 'mes_ano'], 
        [Sequelize.fn('COUNT', Sequelize.col('id')), 'quantidade']
      ],
      group: [Sequelize.fn('DATE_FORMAT', Sequelize.col('createdAt'), '%Y-%m')],
      order: [Sequelize.fn('DATE_FORMAT', Sequelize.col('createdAt'), '%Y-%m')]
    });

    const encaminhamentosLabels = encaminhamentosPorPeriodo.map(encaminhamento => {
      const mesAno = encaminhamento.get('mes_ano');
      const [ano, mes] = mesAno.split('-');
      return `${mes}/${ano}`;
    });

    const encaminhamentosData = encaminhamentosPorPeriodo.map(encaminhamento => encaminhamento.get('quantidade'));

    const totalEncaminhamentos = encaminhamentosData.reduce((acc, val) => acc + val, 0);

    const atendimentosPorPeriodo = await Atendimento.findAll({
      attributes: [
        [Sequelize.fn('DATE_FORMAT', Sequelize.col('dataAtendimento'), '%Y-%m'), 'mes_ano'], // Formato Ano-Mês
        [Sequelize.fn('COUNT', Sequelize.col('id')), 'quantidade']
      ],
      group: [Sequelize.fn('DATE_FORMAT', Sequelize.col('dataAtendimento'), '%Y-%m')],
      order: [Sequelize.fn('DATE_FORMAT', Sequelize.col('dataAtendimento'), '%Y-%m')]
    });

    const atendimentosLabels = atendimentosPorPeriodo.map(atendimento => {
      const mesAno = atendimento.get('mes_ano');
      const [ano, mes] = mesAno.split('-');
      return `${mes}/${ano}`;
    });

    const atendimentosData = atendimentosPorPeriodo.map(atendimento => atendimento.get('quantidade'));

    const totalAtendimentos = atendimentosData.reduce((acc, val) => acc + val, 0);

    const pacientesPorStatus = await Paciente.findAll({
      attributes: [
        'statusPaciente',
        [Sequelize.fn('COUNT', Sequelize.col('id')), 'quantidade'] 
      ],
      group: ['statusPaciente'], 
    });

    console.log('Pacientes por Status:', pacientesPorStatus);

    const statusLabels = pacientesPorStatus.map(item => item.statusPaciente);
    const statusData = pacientesPorStatus.map(item => item.get('quantidade'));

    console.log('Status Labels:', statusLabels); 
    console.log('Status Data:', statusData); 


    const atendamentosPorProfissional = await Atendimento.findAll({
      attributes: [
        [Sequelize.fn('COUNT', Sequelize.col('Atendimento.id')), 'quantidade'] // Contagem de atendimentos
      ],
      include: [
        {
          model: Profissional,
          as: 'profissional',
          attributes: ['nome'] // Incluindo o nome do profissional
        }
      ],
      group: ['profissional.id'], // Agrupando por ID do profissional
    });
    
    const profissionaisLabels = atendamentosPorProfissional.map(item => item.profissional.nome); // Acessando diretamente o nome
    const profissionaisData = atendamentosPorProfissional.map(item => item.get('quantidade')); // Acessando a contagem
    
    console.log('Pacientes Labels:', pacientesLabels);
    console.log('Pacientes Data:', pacientesData);
    console.log('Encaminhamentos Labels:', encaminhamentosLabels);
    console.log('Encaminhamentos Data:', encaminhamentosData);
    console.log('Atendimentos Labels:', atendimentosLabels);
    console.log('Atendimentos Data:', atendimentosData);
    console.log('Status Labels:', statusLabels);
    console.log('Profissionais Labels:', profissionaisLabels);
    console.log('Profissionais Data:', profissionaisData);


    res.render('graficos/index', {
      pacientesLabels: pacientesLabels,
      pacientesData: pacientesData,
      totalPacientes,
      totalEncaminhamentos,
      encaminhamentosLabels,
      encaminhamentosData,
      atendimentosLabels,
      atendimentosData,
      totalAtendimentos,
      statusLabels: statusLabels,
      statusData: statusData,
      profissionaisLabels: profissionaisLabels,
      profissionaisData: profissionaisData,
    });
    
  } catch (error) {
    console.error('Erro ao buscar dados para gráficos:', error);
    res.status(500).send('Erro ao gerar gráficos');
  }
});

module.exports = router;