const Mensagem = require('../models/Mensagem');
const Profissional = require('../models/Profissional');
const moment = require('moment');

module.exports = {
  
  exibirFormularioEnvio: async (req, res) => {
    try {
      const profissionalId = req.user?.profissionalId;
      if (!profissionalId) {
        req.flash('error_msg', 'Profissional não encontrado.');
        return res.redirect('/');
      }

      const profissionais = await Profissional.findAll({
        attributes: ['id', 'nome', 'cargo'],
      });

      res.render('mensagens/enviar', { 
        profissionais,
        user: req.user,
        formatDate: (date) => moment(date).format('DD/MM/YYYY HH:mm') 
      });
    } catch (error) {
      console.error(error);
      req.flash('error_msg', 'Erro ao carregar a página de envio de mensagens.');
      return res.redirect('/');
    }
  },

  enviarMensagem: async (req, res) => {
    try {
      const { destinatarioCargo, destinatarioId, assunto, corpo } = req.body;
      const remetenteId = req.user?.profissionalId;
      const arquivo = req.file ? `/arquivos/${req.file.filename}` : null;
      
      
      if (!remetenteId || !assunto || !corpo) {
        req.flash('error_msg', 'Preencha todos os campos obrigatórios.');
        return res.redirect('/mensagens/enviar');
      }
  
      const cargo = destinatarioCargo || null;
  
      if (cargo) {
        const profissionais = await Profissional.findAll({
          where: { cargo },
          attributes: ['id'],
        });
  
        if (profissionais.length === 0) {
          req.flash('error_msg', 'Nenhum profissional encontrado para o cargo especificado.');
          return res.redirect('/mensagens/enviar');
        }
  
        const mensagens = profissionais.map((profissional) => ({
          remetenteId,
          destinatarioId: profissional.id,
          destinatarioCargo: cargo, 
          assunto,
          corpo,
          arquivo,  
        }));
  
        await Mensagem.bulkCreate(mensagens);
      } else if (destinatarioId) {

        await Mensagem.create({
          remetenteId,
          destinatarioId,
          destinatarioCargo: cargo, 
          assunto,
          corpo,
          arquivo,  
        });
      } else {
        req.flash('error_msg', 'Especifique um destinatário ou um cargo.');
        return res.redirect('/mensagens/enviar');
      }
  
      req.flash('success_msg', 'Mensagem enviada com sucesso!');
      return res.redirect('/mensagens');
    } catch (error) {
      console.error(error);
      req.flash('error_msg', 'Erro ao enviar mensagem.');
      return res.redirect('/mensagens/enviar');
    }
  },
  

  listarMensagensRecebidas: async (req, res) => {
    try {
      const destinatarioId = req.user?.profissionalId; 
      if (!destinatarioId) {
        req.flash('error_msg', 'Usuário não autenticado.');
        return res.redirect('/login');  
      }

      const mensagensNaoArquivadas = await Mensagem.findAll({
        where: { destinatarioId, arquivada: false },
        include: [
          {
            model: Profissional,
            as: 'remetente',
            attributes: ['nome', 'cargo'],
            required: true,  
          }
        ],
        order: [['createdAt', 'DESC']],  
      });

      const mensagensArquivadas = await Mensagem.findAll({
        where: { destinatarioId, arquivada: true },
        include: [
          {
            model: Profissional,
            as: 'remetente',
            attributes: ['nome', 'cargo'],
            required: true,  
          }
        ],
        order: [['createdAt', 'DESC']], 
      });

      const mensagensEnviadas = await Mensagem.findAll({
        where: { remetenteId: destinatarioId },  
        include: [
          {
            model: Profissional,
            as: 'destinatario',
            attributes: ['nome'],
            required: true,  
          }
        ],
        order: [['createdAt', 'DESC']],  
      });

      res.render('mensagens/index', { 
        mensagensNaoArquivadas, 
        mensagensArquivadas, 
        mensagensEnviadas
      });
    } catch (error) {
      console.error(error);
      req.flash('error_msg', 'Erro ao carregar a caixa de entrada.');
      return res.redirect('/'); 
    }
  },

  detalhesMensagemEnviada: async (req, res) => {
    try {
      const mensagemId = req.params.id;
      const profissionalId = req.user?.profissionalId; 
  
      const mensagem = await Mensagem.findOne({
        where: { id: mensagemId, remetenteId: profissionalId },
        include: [
          {
            model: Profissional,
            as: 'destinatario',
            attributes: ['nome', 'cargo'],
          },
        ],
      });
  
      if (!mensagem) {
        req.flash('error_msg', 'Mensagem não encontrada ou você não tem permissão para visualizá-la.');
        return res.redirect('/mensagens');
      }
  
      res.render('mensagens/enviada', { 
        mensagem, 
        user: req.user 
      });
    } catch (error) {
      console.error(error);
      req.flash('error_msg', 'Erro ao carregar a mensagem.');
      return res.redirect('/mensagens');
    }
  },
  

  visualizarMensagem: async (req, res) => {
    try {
      const mensagemId = req.params.id;
      const profissionalId = req.user?.profissionalId; 

      const mensagem = await Mensagem.findOne({
        where: { id: mensagemId, destinatarioId: profissionalId },
        include: [
          {
            model: Profissional,
            as: 'remetente',
            attributes: ['nome', 'cargo'],
            required: true
          }
        ],
      });

      if (!mensagem) {
        req.flash('error_msg', 'Mensagem não encontrada ou você não tem permissão para visualizá-la.');
        return res.redirect('/mensagens');
      }

      mensagem.visualizada = true;
      await mensagem.save();

      res.render('mensagens/detalhes', { 
        mensagem, 
        user: req.user 
      });
    } catch (error) {
      console.error(error);
      req.flash('error_msg', 'Erro ao carregar a mensagem.');
      return res.redirect('/mensagens');
    }
  },

  responderMensagem: async (req, res) => {
    try {
      const mensagemId = req.params.id;
      const profissionalId = req.user?.profissionalId;

      const mensagem = await Mensagem.findOne({
        where: { id: mensagemId },
        include: [{ model: Profissional, as: 'remetente' }],
      });

      if (!mensagem) {
        req.flash('error_msg', 'Mensagem não encontrada.');
        return res.redirect('/mensagens');
      }

      res.render('mensagens/responder', { 
        mensagem, 
        user: req.user 
      });
    } catch (error) {
      console.error(error);
      req.flash('error_msg', 'Erro ao carregar a página de resposta.');
      return res.redirect('/mensagens');
    }
  },

  enviarResposta: async (req, res) => {
    try {
      const { corpo } = req.body;
      const mensagemId = req.params.id;
      const profissionalId = req.user?.profissionalId;
      const arquivo = req.file ? `/arquivos/${req.file.filename}` : null; 

      if (!corpo || corpo.trim() === '') {
        req.flash('error_msg', 'O corpo da mensagem não pode estar vazio.');
        return res.redirect(`/mensagens/${mensagemId}/responder`);
      }

      const mensagem = await Mensagem.findOne({
        where: { id: mensagemId },
        include: [{ model: Profissional, as: 'remetente' }],
      });

      if (!mensagem) {
        req.flash('error_msg', 'Mensagem não encontrada.');
        return res.redirect('/mensagens');
      }

      await Mensagem.create({
        remetenteId: profissionalId,
        destinatarioId: mensagem.remetenteId,
        destinatarioCargo: mensagem.remetente.cargo,
        assunto: 'Re: ' + mensagem.assunto,
        corpo,
        arquivo,
        visualizada: false,
        respondida: true,
      });

      req.flash('success_msg', 'Resposta enviada com sucesso.');
      return res.redirect('/mensagens');
    } catch (error) {
      console.error(error);
      req.flash('error_msg', 'Erro ao enviar a resposta.');
      return res.redirect(`/mensagens/${req.params.id}/responder`);
    }
  },

  arquivarMensagem: async (req, res) => {
    try {
      const { id } = req.params;
      const mensagem = await Mensagem.findByPk(id);

      if (!mensagem) {
        req.flash('error_msg', 'Mensagem não encontrada.');
        return res.redirect('/mensagens');
      }

      mensagem.arquivada = true;
      await mensagem.save();

      req.flash('success_msg', 'Mensagem arquivada com sucesso.');
      return res.redirect('/mensagens');
    } catch (error) {
      console.error(error);
      req.flash('error_msg', 'Erro ao arquivar a mensagem.');
      return res.redirect('/mensagens');
    }
  },

  desarquivarMensagem: async (req, res) => {
    try {
      const { id } = req.params;
      const mensagem = await Mensagem.findByPk(id);

      if (!mensagem) {
        req.flash('error_msg', 'Mensagem não encontrada.');
        return res.redirect('/mensagens');
      }

      mensagem.arquivada = false;
      await mensagem.save();

      req.flash('success_msg', 'Mensagem desarquivada com sucesso.');
      return res.redirect('/mensagens');
    } catch (error) {
      console.error(error);
      req.flash('error_msg', 'Erro ao desarquivar a mensagem.');
      return res.redirect('/mensagens');
    }
  },

  contarMensagensNaoLidas: async (req, res) => {
    try {
      const profissionalId = req.user?.profissionalId;

      if (!profissionalId) {
        return res.status(401).json({ error: 'Usuário não autenticado ou não possui ID de profissional.' });
      }

      const mensagensNaoLidas = await Mensagem.count({
        where: { destinatarioId: profissionalId, visualizada: false },
      });

      return res.json({ mensagensNaoLidas });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: 'Erro ao contar mensagens não lidas.' });
    }
  },



  deletarMensagem: async (req, res) => {
    try {
      const mensagemId = req.params.id;
      const profissionalId = req.user?.profissionalId; 
  
      const mensagem = await Mensagem.findOne({
        where: { id: mensagemId },
      });
  
      if (!mensagem) {
        req.flash('error_msg', 'Mensagem não encontrada.');
        return res.redirect('/mensagens');
      }
  
      if (mensagem.remetenteId !== profissionalId) {
        req.flash('error_msg', 'Você não tem permissão para excluir esta mensagem.');
        return res.redirect('/mensagens');
      }
  
      if (mensagem.visualizada) {
        req.flash('error_msg', 'Não é possível excluir uma mensagem que já foi visualizada.');
        return res.redirect('/mensagens');
      }
  
      await mensagem.destroy();
  
      req.flash('success_msg', 'Mensagem deletada com sucesso.');
      return res.redirect('/mensagens');
    } catch (error) {
      console.error(error);
      req.flash('error_msg', 'Erro ao deletar mensagem.');
      return res.redirect('/mensagens');
    }
  },
  
};

