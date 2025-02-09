const { Op, Sequelize } = require('sequelize');
const Paciente = require('../models/Paciente');
const Encaminhamento = require('../models/Encaminhamento');
const Atendimento = require('../models/Atendimento'); // Importe o modelo de Atendimento
const express = require('express');

const router = express.Router();

// Rota para gráficos de pacientes, encaminhamentos e atendimentos
router.get('/', async (req, res) => {
  try {
    // Gráfico de Pacientes por Período
    const pacientesPorPeriodo = await Paciente.findAll({
      attributes: [
        [Sequelize.fn('DATE_FORMAT', Sequelize.col('createdAt'), '%Y-%m'), 'mes_ano'], // Formato Ano-Mês
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

    // Calcular total de pacientes a partir dos dados recuperados
    const totalPacientes = pacientesData.reduce((acc, val) => acc + val, 0);

    // Gráfico de Encaminhamentos Realizados (sem filtro de status)
    const encaminhamentosPorPeriodo = await Encaminhamento.findAll({
      attributes: [
        [Sequelize.fn('DATE_FORMAT', Sequelize.col('createdAt'), '%Y-%m'), 'mes_ano'], // Formato Ano-Mês
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

    // Calcular total de encaminhamentos a partir dos dados recuperados
    const totalEncaminhamentos = encaminhamentosData.reduce((acc, val) => acc + val, 0);

    // Gráfico de Atendimentos por Período
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

    // Calcular total de atendimentos a partir dos dados recuperados
    const totalAtendimentos = atendimentosData.reduce((acc, val) => acc + val, 0);

    console.log('Pacientes Labels:', pacientesLabels);
    console.log('Pacientes Data:', pacientesData);
    console.log('Encaminhamentos Labels:', encaminhamentosLabels);
    console.log('Encaminhamentos Data:', encaminhamentosData);
    console.log('Atendimentos Labels:', atendimentosLabels);
    console.log('Atendimentos Data:', atendimentosData);

    // Renderizar a view com os dados dos gráficos
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
    });
    
  } catch (error) {
    console.error('Erro ao buscar dados para gráficos:', error);
    res.status(500).send('Erro ao gerar gráficos');
  }
});

module.exports = router;