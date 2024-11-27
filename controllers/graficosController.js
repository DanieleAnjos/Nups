const { Op, Sequelize } = require('sequelize');  // Certifique-se de importar o Sequelize corretamente
const Paciente = require('../models/Paciente');
const express = require('express');

const router = express.Router();
router.get('/', async (req, res) => {
  try {

    const pacientesPorPeriodo = await Paciente.findAll({
      attributes: [
        [Sequelize.fn('DATE_FORMAT', Sequelize.col('createdAt'), '%Y-%m'), 'mes_ano'], // Formato Ano-Mês
        [Sequelize.fn('COUNT', Sequelize.col('id')), 'quantidade']
      ],
      group: [
        Sequelize.fn('DATE_FORMAT', Sequelize.col('createdAt'), '%Y-%m') 
      ],
      order: [
        Sequelize.fn('DATE_FORMAT', Sequelize.col('createdAt'), '%Y-%m') 
      ]
    });

    const labels = pacientesPorPeriodo.map(paciente => {
      const mesAno = paciente.get('mes_ano'); 
      const [ano, mes] = mesAno.split('-'); 
      return `${mes}/${ano}`; 
    });

    const data = pacientesPorPeriodo.map(paciente => paciente.get('quantidade'));

    const totalPacientes = await Paciente.count();

    console.log('Labels:', labels);
    console.log('Data:', data);

    

    res.render('graficos/index', {
      labels: JSON.stringify(labels), 
      data: JSON.stringify(data), 
      totalPacientes
    });
      } catch (error) {
    console.error('Erro ao buscar dados para gráficos:', error);
    res.status(500).send('Erro ao gerar gráficos');
  }
});





module.exports = router;
