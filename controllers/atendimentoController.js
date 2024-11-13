const Paciente = require('../models/Paciente');
const Profissional = require('../models/Profissional');
const Encaminhamento = require('../models/Encaminhamento');
const Atendimento = require('../models/Atendimento');
const { Op } = require('sequelize'); 


exports.index = async (req, res) => {
  try {
    const searchTerm = req.query.search || ''; 
    
    const atendimentos = await Atendimento.findAll({
      where: {
        [Op.or]: [
          {
            nomePaciente: {
              [Op.like]: `%${searchTerm}%` 
            }
          },
          {
            '$profissional.nome$': {
              [Op.like]: `%${searchTerm}%` 
            }
          }
        ]
      },
      include: [{
        model: Profissional,
        as: 'profissional',
        attributes: ['id', 'nome']
      }]
    });

    return res.status(200).render('atendimentos/index', { atendimentos, searchTerm });
  } catch (error) {
    console.error('Erro ao buscar atendimentos:', error);
    return res.status(500).json({ message: 'Erro ao buscar atendimentos.' });
  }
};

exports.create = async (req, res) => {
  try {
    let profissionais = [];
    const encaminhamentoSelecionado = req.query.encaminhamento;

    if (encaminhamentoSelecionado) {

      const cargoMap = {
        'Psicologia': 'Psicólogo',
        'Serviço Social': 'Assistente Social',
        'Psiquiatria': 'Psiquiatra'
      };

      const cargoFiltrado = cargoMap[encaminhamentoSelecionado];
      
      profissionais = await Profissional.findAll({
        where: {
          cargo: cargoFiltrado 
        }
      });
    } else {
      profissionais = await Profissional.findAll();
    }

    console.log('Profissionais encontrados:', profissionais); 
    return res.render('atendimentos/create', { profissionais });
  } catch (error) {
    console.error('Erro ao buscar profissionais:', error);
    return res.status(500).json({ message: 'Erro ao buscar profissionais.' });
  }
};
exports.store = async (req, res) => {
  try {
    const atendimento = await Atendimento.create(req.body);
    return res.redirect('/atendimentos');
  } catch (error) {
    console.error('Erro ao criar atendimento:', error);
    return res.status(500).json({ message: 'Erro ao criar atendimento.' });
  }
};

exports.edit = async (req, res) => {
  try {
    const atendimento = await Atendimento.findByPk(req.params.id);
    if (!atendimento) {
      return res.status(404).json({ message: 'Atendimento não encontrado.' });
    }
    return res.status(200).render('atendimentos/edit', { atendimento });
  } catch (error) {
    console.error('Erro ao buscar atendimento para edição:', error);
    return res.status(500).json({ message: 'Erro ao buscar atendimento.' });
  }
};

exports.update = async (req, res) => {
  try {
    const [updated] = await Atendimento.update(req.body, {
      where: { id: req.params.id }
    });
    if (!updated) {
      return res.status(404).json({ message: 'Atendimento não encontrado.' });
    }
    return res.redirect('/atendimentos'); 
  } catch (error) {
    console.error('Erro ao atualizar atendimento:', error);
    return res.status(500).json({ message: 'Erro ao atualizar atendimento.' });
  }
};

exports.destroy = async (req, res) => {
  try {
    const deleted = await Atendimento.destroy({
      where: { id: req.params.id }
    });
    if (!deleted) {
      return res.status(404).json({ message: 'Atendimento não encontrado.' });
    }
    return res.redirect('/atendimentos'); 
  } catch (error) {
    console.error('Erro ao deletar atendimento:', error);
    return res.status(500).json({ message: 'Erro ao deletar atendimento.' });
  }
};
