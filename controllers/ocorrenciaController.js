const Ocorrencia = require('../models/Ocorrencia'); 
const Profissional = require('../models/Profissional'); 


const ocorrenciaController = {
  index: async (req, res) => {
    try {
      const ocorrencias = await Ocorrencia.findAll(); 
      res.render('ocorrencias/index', { ocorrencias }); 
    } catch (error) {
      console.error(error); 
      res.status(500).send("Erro ao buscar ocorrências");
    }
  },

  create: async (req, res) => {
    try {
      const profissionais = await Profissional.findAll(); 
      res.render('ocorrencias/create', { profissionais }); 
    } catch (error) {
      console.error(error); 
      res.status(500).send("Erro ao buscar profissionais");
    }
  },

  store: async (req, res) => {
    try {
        const { data, relatorio, horarioChegada, horarioSaida, profissionalId } = req.body;

        if (!data || !relatorio || !horarioChegada || !profissionalId) {
            return res.status(400).send("Todos os campos são obrigatórios.");
        }

        const now = new Date();
        const chegada = new Date(`${data}T${horarioChegada}`); // Converte para um objeto Date

        if (chegada <= now) {
            return res.status(400).send("O horário de chegada deve ser um horário futuro.");
        }

        await Ocorrencia.create({ data, relatorio, horarioChegada, horarioSaida, profissionalId }); 
        res.redirect('/ocorrencias'); 
    } catch (error) {
        console.error("Erro ao criar ocorrência:", error); 
        res.status(500).send("Erro ao criar ocorrência");
    }
},



  edit: async (req, res) => {
    try {
      const ocorrencia = await Ocorrencia.findByPk(req.params.id); 

      if (!ocorrencia) {
        return res.status(404).send("Ocorrência não encontrada."); 
      }

      res.render('ocorrencias/edit', { ocorrencia }); 
    } catch (error) {
      console.error(error); 
      res.status(500).send("Erro ao buscar ocorrência para edição");
    }
  },

  update: async (req, res) => {
    try {
      const ocorrencia = await Ocorrencia.findByPk(req.params.id); 

      if (!ocorrencia) {
        return res.status(404).send("Ocorrência não encontrada."); 
      }

      const { data, relatorio, horarioChegada, horarioSaida, profissionalId } = req.body;
      if (!data || !relatorio || !horarioChegada || !profissionalId) {
        return res.status(400).send("Todos os campos são obrigatórios.");
      }

      await Ocorrencia.update(req.body, { where: { id: req.params.id } }); 
      res.redirect('/ocorrencias');
    } catch (error) {
      console.error(error);
      res.status(500).send("Erro ao atualizar ocorrência");
    }
  },

  destroy: async (req, res) => {
    try {
      const ocorrencia = await Ocorrencia.findByPk(req.params.id); 

      if (!ocorrencia) {
        return res.status(404).send("Ocorrência não encontrada."); 
      }

      await Ocorrencia.destroy({ where: { id: req.params.id } }); 
      res.redirect('/ocorrencias'); 
    } catch (error) {
      console.error(error); 
      res.status(500).send("Erro ao excluir ocorrência");
    }
  }
};

module.exports = ocorrenciaController;
