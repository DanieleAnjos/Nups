const { Op, Sequelize } = require('sequelize');
const Paciente = require('../models/Paciente');
const Encaminhamento = require('../models/Encaminhamento');
const express = require('express');

const router = express.Router();

// Rota para gráficos de pacientes e encaminhamentos
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

    const totalPacientes = await Paciente.count();

    // Gráfico de Encaminhamentos Realizados
    const encaminhamentosPorPeriodo = await Encaminhamento.findAll({
      attributes: [
        [Sequelize.fn('DATE_FORMAT', Sequelize.col('createdAt'), '%Y-%m'), 'mes_ano'], // Formato Ano-Mês
        [Sequelize.fn('COUNT', Sequelize.col('id')), 'quantidade']
      ],
      where: {
        statusAcolhimento: 'Realizado' // Apenas encaminhamentos realizados
      },
      group: [Sequelize.fn('DATE_FORMAT', Sequelize.col('createdAt'), '%Y-%m')],
      order: [Sequelize.fn('DATE_FORMAT', Sequelize.col('createdAt'), '%Y-%m')]
    });

    const encaminhamentosLabels = encaminhamentosPorPeriodo.map(encaminhamento => {
      const mesAno = encaminhamento.get('mes_ano');
      const [ano, mes] = mesAno.split('-');
      return `${mes}/${ano}`;
    });

    const encaminhamentosData = encaminhamentosPorPeriodo.map(encaminhamento => encaminhamento.get('quantidade'));

    const totalEncaminhamentos = await Encaminhamento.count();

    // Renderizar a view com os dados dos gráficos
    res.render('graficos/index', {
      pacientesLabels: JSON.stringify(pacientesLabels),
      pacientesData: JSON.stringify(pacientesData),
      totalPacientes,
      totalEncaminhamentos,
      encaminhamentosLabels: JSON.stringify(encaminhamentosLabels),
      encaminhamentosData: JSON.stringify(encaminhamentosData),
    });
  } catch (error) {
    console.error('Erro ao buscar dados para gráficos:', error);
    res.status(500).send('Erro ao gerar gráficos');
  }
});

module.exports = router;
