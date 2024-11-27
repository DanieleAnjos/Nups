const Mensagem = require('../models/Mensagem');
const Profissional = require('../models/Profissional');

module.exports = {

  exibirFormularioEnvio: async (req, res) => {
    try {
      console.log('Usuário autenticado:', req.user); 
  
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
      res.status(500).send('Erro ao carregar a página de envio de mensagens.');
    }
  },

  enviarMensagem: async (req, res) => {
    console.log('Dados recebidos no envio de mensagem:', req.body);
  
    const { destinatarioCargo, destinatarioId, assunto, corpo } = req.body;
  
    const remetenteId = req.user.profissionalId;
  
    if (!remetenteId || !assunto || !corpo) {
      return res.status(400).send('Preencha todos os campos obrigatórios.');
    }
  
    const cargo = destinatarioCargo || null;
  
    try {
      if (cargo) {

        const profissionais = await Profissional.findAll({
          where: { cargo },
          attributes: ['id'],
        });
  
        if (profissionais.length === 0) {
          return res.status(404).send('Nenhum profissional encontrado para o cargo especificado.');
        }
  
        const mensagens = profissionais.map((profissional) => ({
          remetenteId,
          destinatarioId: profissional.id,
          destinatarioCargo: cargo, 
          assunto,
          corpo,
        }));
  
        await Mensagem.bulkCreate(mensagens);
      } else if (destinatarioId) {

        await Mensagem.create({
          remetenteId,
          destinatarioId,
          destinatarioCargo: cargo, 
          assunto,
          corpo,
        });
      } else {
        return res.status(400).send('Especifique um destinatário ou um cargo.');
      }
  
      res.redirect('/mensagens/index');
    } catch (error) {
      console.error(error);
      res.status(500).send('Erro ao enviar mensagem.');
    }
  },
  listarMensagensRecebidas: async (req, res) => {
    const destinatarioId = req.user?.profissionalId; 
  
    if (!destinatarioId) {
      return res.redirect('/login');  
    }
  
    try {

      const mensagensNaoArquivadas = await Mensagem.findAll({
        where: { destinatarioId: destinatarioId, arquivada: false },
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
        where: { destinatarioId: destinatarioId, arquivada: true },
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
      res.redirect('/'); 
    }
  },
  
  visualizarMensagem: async (req, res) => {
    try {
      const mensagemId = req.params.id;
      const profissionalId = req.user?.profissionalId; 

      const mensagem = await Mensagem.findOne({
        where: {
          id: mensagemId,
          destinatarioId: profissionalId,
        },
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
      res.status(500).send('Erro ao carregar a mensagem.');
    }
  },

  responderMensagem: async (req, res) => {
    try {
      const mensagemId = req.params.id;
      const profissionalId = req.user?.profissionalId; 

      // Verificar se a mensagem existe
      const mensagem = await Mensagem.findOne({
        where: { id: mensagemId },
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
        req.flash('error_msg', 'Mensagem não encontrada.');
        return res.redirect('/mensagens');
      }

      res.render('mensagens/responder', { 
        mensagem, 
        user: req.user 
      });
    } catch (error) {
      console.error(error);
      res.status(500).send('Erro ao carregar a página de resposta.');
    }
  },

  enviarResposta: async (req, res) => {
    try {
      const { corpo } = req.body;
      const mensagemId = req.params.id;
      const profissionalId = req.user?.profissionalId;

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
        visualizada: false,
        respondida: true,
      });

      req.flash('success_msg', 'Resposta enviada com sucesso.');
      res.redirect('/mensagens');
    } catch (error) {
      console.error(error);
      res.status(500).send('Erro ao enviar a resposta.');
    }
  },

  arquivarMensagem: async (req, res) => {
    const { id } = req.params; 

    try {
      const mensagem = await Mensagem.findByPk(id);  

      if (!mensagem) {
        req.flash('error_msg', 'Mensagem não encontrada.');
        return res.redirect('/mensagens');
      }

      mensagem.arquivada = true;
      await mensagem.save();  

      req.flash('success_msg', 'Mensagem arquivada com sucesso.');
      res.redirect('/mensagens');
    } catch (error) {
      console.error(error);
      req.flash('error_msg', 'Erro ao arquivar a mensagem.');
      res.redirect('/mensagens');
    }
  },


  desarquivarMensagem: async (req, res) => {
    const { id } = req.params;

    try {
      const mensagem = await Mensagem.findByPk(id);

      if (!mensagem) {
        req.flash('error_msg', 'Mensagem não encontrada.');
        return res.redirect('/mensagens');
      }

      mensagem.arquivada = false;
      await mensagem.save();

      req.flash('success_msg', 'Mensagem desarquivada com sucesso.');
      res.redirect('/mensagens');
    } catch (error) {
      console.error(error);
      req.flash('error_msg', 'Erro ao desarquivar a mensagem.');
      res.redirect('/mensagens');
    }
  },

  
  
};
  
  
