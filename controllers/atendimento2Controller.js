const Atendimento2 = require('../models/Atendimento2');
const Profissional = require('../models/Profissional');
const Paciente = require('../models/Paciente');
const { Op } = require('sequelize'); 


const AtendimentoController = {


    exibirFormularioCriacao: async (req, res) => {
        try {

          const profissionais = await Profissional.findAll();
          const pacientes = await Paciente.findAll();
          
          res.render('atendimentos2/create', { profissionais, pacientes });
        } catch (error) {
          console.error('Erro ao carregar o formulário de criação:', error);
          res.status(500).json({ mensagem: 'Erro ao carregar o formulário de criação.' });
        }
      },


  criarAtendimento: async (req, res) => {
    const { matriculaPaciente, nomeProfissional, registroAtendimento, discussaoCaso } = req.body;

    try {

      const paciente = await Paciente.findOne({ where: { matricula: matriculaPaciente } });
      const profissional = await Profissional.findOne({ where: { nome: nomeProfissional } });

      if (!paciente) {
        return res.status(404).json({ mensagem: 'Paciente não encontrado.' });
      }

      if (!profissional) {
        return res.status(404).json({ mensagem: 'Profissional não encontrado.' });
      }

      const novoAtendimento = await Atendimento2.create({
        nomePaciente: paciente.nome,
        matriculaPaciente: paciente.matricula,
        nomeProfissional: profissional.nome,
        registroAtendimento,
        dataAtendimento: new Date(),
        discussaoCaso,
        pacienteId: paciente.id,
        profissionalId: profissional.id,
      });
      
      res.render('atendimentos2/index');
      res.status(201).json({ mensagem: 'Atendimento criado com sucesso!', novoAtendimento });
    } catch (error) {
      console.error('Erro ao criar atendimento:', error);
      res.status(500).json({ mensagem: 'Erro ao criar atendimento.' });
    }
  },

  listarAtendimentos: async (req, res) => {
    try {
        const atendimentos = await Atendimento2.findAll({
            include: [
              { model: Profissional },  
              { model: Paciente }       
            ],
            order: [['dataAtendimento', 'DESC']],
          });
          

      res.render('atendimentos2/index', { atendimentos });
    } catch (error) {
      console.error('Erro ao listar atendimentos:', error);
      res.status(500).json({ mensagem: 'Erro ao listar atendimentos.' });
    }
  },

  buscarPaciente: async (req, res) => {
    const { nome, matricula } = req.query;
    
    try {
      let paciente;
      if (nome) {
        paciente = await Paciente.findOne({
          where: {
            nome: {
              [Op.like]: `%${nome}%`  
            }
          }
        });
      } 
      else if (matricula) {
        paciente = await Paciente.findOne({
          where: {
            matricula: matricula  
          }
        });
      }

      if (paciente) {
        res.json(paciente);  
      } else {
        res.status(404).json({ mensagem: 'Paciente não encontrado.' });
      }
    } catch (error) {
      console.error('Erro ao buscar paciente:', error);
      res.status(500).json({ mensagem: 'Erro ao buscar paciente.' });
    }
  },

  visualizarAtendimento: async (req, res) => {
    const { id } = req.params;  
  
    try {

      const atendimento = await Atendimento2.findOne({
        where: { id },  
        include: [
          { model: Profissional },  
          { model: Paciente }      
        ]
      });
  
      if (!atendimento) {
        return res.status(404).json({ mensagem: 'Atendimento não encontrado.' });
      }
  
      res.render('atendimentos2/detalhes', { atendimento });
    } catch (error) {
      console.error('Erro ao visualizar atendimento:', error);
      res.status(500).json({ mensagem: 'Erro ao visualizar atendimento.' });
    }
  },
  
};

module.exports = AtendimentoController;
