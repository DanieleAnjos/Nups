const Paciente = require('../models/Paciente');
const Atendimento = require('../models/Atendimento');
const Profissional = require('../models/Profissional');
const Documento = require('../models/Documento');
const fs = require('fs');
const path = require('path');

const { validationResult } = require('express-validator');


const { Op } = require('sequelize'); 
const Encaminhamento = require('../models/Encaminhamento');
const { upload, uploadErrorHandler } = require('../config/multer');

exports.index = async (req, res) => {
  try {
    const { nome, matricula } = req.query; 
    const where = {}; 

    // Filtragem por nome
    if (nome) {
      where.nome = { [Op.like]: `%${nome}%` }; 
    }

    // Filtragem por matrícula
    if (matricula) {
      where.matricula = matricula; 
    }

    const profissional = req.user || {}; 

    // Verifica se o profissional está definido
    const cargo = profissional.cargo ? profissional.cargo.toLowerCase() : "";

    // Verificações de permissão
    const podeEditar = ["administrador", "assistente social", "gestor servico social"].includes(cargo);
    const podeDeletar = cargo === "administrador";
    const podeCadastrar = ["administrador", "assistente social", "gestor servico social"].includes(cargo);

    // Busca os pacientes com as condições definidas
    const pacientes = await Paciente.findAll({ where });

    // Renderiza a página de pacientes
    res.render('paciente/index', { 
      pacientes, 
      query: req.query,
      profissionalId: profissional.profissionalId, 
      podeEditar,
      podeDeletar,
      podeCadastrar
    }); 
  } catch (error) {
    console.error('Erro ao listar pacientes:', error);
    req.flash('error_msg', 'Erro ao listar pacientes. Por favor, tente novamente mais tarde.');
    res.redirect('/pacientes'); 
  }
};

exports.index2 = async (req, res) => {
  try {
    const { nome, matricula } = req.query; 

    const where = {}; 

    if (nome) {
      where.nome = { [Op.like]: `%${nome}%` }; 
    }

    if (matricula) {
      where.matricula = matricula; 
    }

    const pacientes = await Paciente.findAll({ where });
    res.render('paciente/lista', { pacientes, query: req.query }); 
  } catch (error) {
    console.error('Erro ao listar servidores:', error);
    res.status(500).send('Erro ao listar servidores. Por favor, tente novamente mais tarde.');
  }
};

exports.create = async (req, res) => {
  try {
    const atendimentos = await Atendimento.findAll();
    res.render('paciente/create', {
       atendimentos,
       error_msg: req.flash('error_msg'), 
       success_msg: req.flash('success_msg') 
       });
  } catch (error) {
    console.error('Erro ao buscar os atendimentos:', error);
    res.render('paciente/create', { errorMessage: 'Erro ao buscar os encaminhamentos.' });
  }
};


exports.store = [
  upload.single('imagem'),
  uploadErrorHandler,
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        const errorMessages = errors.array().map((err) => err.msg);
        req.flash('error_msg', errorMessages.join('. '));
        return res.render('paciente/create', {
          error_msg: req.flash('error_msg'),
          success_msg: req.flash('success_msg'),
        });
      }

      const { 
        nome, 
        matricula, 
        dataNascimento, 
        sexo, 
        rg, 
        telefone, 
        filhos, 
        telefoneContato, 
        tipoTelefone,
        nomeContato,
        parentesco,
        postoServiço,
        escala,
        escolaridade,
        tempoServiço,
        periodoEscala,
        porteArma,
        trabalhoArmado,
        armaPessoal,
        planoSaude,
        cartaoSus,
        alergia,
        alergiaMedicamento,
        doenca,
        descricaoDoenca,
        medicamentos,
        tipoMedicamento,
        seguroVida,
        comoConheceuEmpresa,
        terapia,
        terapiaPeriodo,
        terapiaMotivo,
        moradia,
        familiaDeficiencias,
        deficiencia,
        atividadeFisica,
        tipoAtividadeFisica,
        relacaoSupervisor,
        observacoes,
        status,
        statusPaciente,
        ...dadosBasicos } = req.body;

      if (!nome || !matricula || !dataNascimento || !sexo  || !rg) {
        req.flash('error_msg', 'Os campos nome, matrícula, data de nascimento, sexo, CPF e RG são obrigatórios.');
        return res.render('paciente/create', {
          error_msg: req.flash('error_msg'),
          success_msg: req.flash('success_msg'),
        });
      }

      const pacienteExistente = await Paciente.findOne({
        where: {
          [Op.or]: [ { rg }, { matricula }],
        },
      });

      if (pacienteExistente) {
        req.flash('error_msg', 'Já existe um paciente com esse  RG ou matrícula.');
        return res.render('paciente/create', {
          error_msg: req.flash('error_msg'),
          success_msg: req.flash('success_msg'),
        });
      }

      const telefoneLimpo = telefone ? telefone.replace(/\D/g, '') : null;
      const telefoneContatoLimpo = telefoneContato ? telefoneContato.replace(/\D/g, '') : null;
      const rgLimpo = rg.replace(/\D/g, '');


      if (rgLimpo.length < 5) {
        req.flash('error_msg', 'O RG deve ter pelo menos 5 dígitos.');
        return res.render('paciente/create', {
          error_msg: req.flash('error_msg'),
          success_msg: req.flash('success_msg'),
        });
      }

      if (telefoneLimpo && (telefoneLimpo.length < 10 || telefoneLimpo.length > 11)) {
        req.flash('error_msg', 'O telefone deve ter entre 10 e 11 dígitos.');
        return res.render('paciente/create', {
          error_msg: req.flash('error_msg'),
          success_msg: req.flash('success_msg'),
        });
      }

      if (telefoneContatoLimpo && (telefoneContatoLimpo.length < 10 || telefoneContatoLimpo.length > 11)) {
        req.flash('error_msg', 'O telefone de contato deve ter entre 10 e 11 dígitos.');
        return res.render('paciente/create', {
          error_msg: req.flash('error_msg'),
          success_msg: req.flash('success_msg'),
        });
      }

      let imagePath = null;
      if (req.file) {
        if (!req.file.mimetype.startsWith('image/')) {
          req.flash('error_msg', 'Por favor, carregue apenas arquivos de imagem.');
          return res.render('paciente/create', {
            error_msg: req.flash('error_msg'),
            success_msg: req.flash('success_msg'),
          });
        }
        imagePath = req.file.filename;
      }

      await Paciente.create({
        nome,
        matricula,
        dataNascimento,
        sexo,
        rg: rgLimpo,
        telefone: telefoneLimpo,
        telefoneContato: telefoneContatoLimpo,
        filhos: filhos ? (typeof filhos === 'string' ? JSON.parse(filhos).filter(f => f && f.nome) : filhos.filter(f => f && f.nome)) : [],
        escolaridade,
        imagePath,
        tipoTelefone,
        nomeContato,
        parentesco,
        postoServiço,
        escala,
        tempoServiço,
        periodoEscala,
        porteArma,
        trabalhoArmado,
        armaPessoal,
        planoSaude,
        cartaoSus,
        alergia,
        alergiaMedicamento,
        doenca,
        descricaoDoenca,
        medicamentos,
        tipoMedicamento,
        seguroVida,
        comoConheceuEmpresa,
        terapia,
        terapiaPeriodo,
        terapiaMotivo,
        moradia,
        familiaDeficiencias,
        deficiencia,
        atividadeFisica,
        tipoAtividadeFisica,
        relacaoSupervisor,
        observacoes,
        status,
        statusPaciente,
        ...dadosBasicos,
        cadastroCompleto: false,
      });

      req.flash('success_msg', 'Paciente cadastrado com sucesso!');
      res.redirect('/pacientes');
    } catch (error) {
      console.error('Erro ao cadastrar paciente:', error);

      if (error.name === 'SequelizeValidationError') {
        const validationErrors = error.errors.map((err) => err.message);
        req.flash('error_msg', `Erro de validação: ${validationErrors.join('. ')}`);
      } else if (error.name === 'SequelizeUniqueConstraintError') {
        req.flash('error_msg', 'RG ou matrícula já cadastrados.');
      } else {
        req.flash('error_msg', 'Erro ao criar o paciente.');
      }

      return res.render('paciente/create', {
        error_msg: req.flash('error_msg'),
        success_msg: req.flash('success_msg')// Mantém os dados do formulário
      });
    }
  },
];


exports.edit = async (req, res) => {
  try {
    const pacienteId = parseInt(req.params.id, 10);
    if (isNaN(pacienteId)) {
      req.flash('error_msg', 'ID inválido.');
      return res.redirect('/pacientes');
    }

    const paciente = await Paciente.findByPk(pacienteId);
    if (!paciente) {
      req.flash('error_msg', 'Paciente não encontrado.');
      return res.redirect('/pacientes');
    }

    let filhos = paciente.filhos; 

    if (!Array.isArray(filhos) || filhos.length === 0) {
      filhos = [{ nome: '', idade: '' }]; 
    }

    console.log("Filhos:", filhos); 

    res.render('paciente/edit', { paciente, filhos });
  } catch (error) {
    console.error('Erro ao editar paciente:', error);
    req.flash('error_msg', 'Erro ao carregar formulário de edição.');
    res.redirect('/pacientes');
  }
};


exports.update = [
  upload.single('imagem'), 
  uploadErrorHandler,
  async (req, res) => {
    try {
      console.log('Dados recebidos para atualização:', req.body);

      const paciente = await Paciente.findByPk(req.params.id);
      if (!paciente) {
        req.flash('error_msg', 'Paciente não encontrado.');
        return res.redirect('/pacientes');
      }

      const { 
        nome, 
        matricula, 
        dataNascimento, 
        sexo, 
        rg, 
        telefone, 
        filhos, 
        telefoneContato, 
        tipoTelefone,
        nomeContato,
        parentesco,
        postoServiço,
        escala,
        tempoServiço,
        periodoEscala,
        porteArma,
        trabalhoArmado,
        armaPessoal,
        planoSaude,
        cartaoSus,
        alergia,
        alergiaMedicamento,
        doenca,
        descricaoDoenca,
        medicamentos,
        tipoMedicamento,
        seguroVida,
        comoConheceuEmpresa,
        terapia,
        terapiaPeriodo,
        terapiaMotivo,
        moradia,
        familiaDeficiencias,
        deficiencia,
        atividadeFisica,
        tipoAtividadeFisica,
        relacaoSupervisor,
        observacoes,
        status,
        statusPaciente,
        ...dadosBasicos } = req.body;

      if (!nome || !matricula || !dataNascimento || !sexo || !rg) {
        req.flash('error_msg', 'Os campos nome, matrícula, data de nascimento, sexo, CPF e RG são obrigatórios.');
        return res.redirect(`/pacientes/${req.params.id}/edit`);
      }

      const telefoneLimpo = telefone ? telefone.replace(/\D/g, '') : null;
      const telefoneContatoLimpo = telefoneContato ? telefoneContato.replace(/\D/g, '') : null;
      const rgLimpo = rg.replace(/\D/g, '');


      if (rgLimpo.length < 5) {
        req.flash('error_msg', 'O RG deve ter pelo menos 5 dígitos.');
        return res.redirect(`/pacientes/${req.params.id}/edit`);
      }

      if (telefoneLimpo && (telefoneLimpo.length < 10 || telefoneLimpo.length > 11)) {
        req.flash('error_msg', 'O telefone deve ter entre 10 e 11 dígitos.');
        return res.redirect(`/pacientes/${req.params.id}/edit`);
      }

      if (telefoneContatoLimpo && (telefoneContatoLimpo.length < 10 || telefoneContatoLimpo.length > 11)) {
        req.flash('error_msg', 'O telefone de contato deve ter entre 10 e 11 dígitos.');
        return res.redirect(`/pacientes/${req.params.id}/edit`);
      }

      const pacienteExistente = await Paciente.findOne({
        where: {
          [Op.or]: [ { rg: rgLimpo }, { matricula }],
          id: { [Op.ne]: req.params.id }, 
        },
      });

      if (pacienteExistente) {
        req.flash('error_msg', 'Já existe um paciente com esse RG ou matrícula.');
        return res.redirect(`/pacientes/${req.params.id}/edit`);
      }

      let imagePath = paciente.imagePath;
      if (req.file) {
        if (!req.file.mimetype.startsWith('image/')) {
          req.flash('error_msg', 'Por favor, carregue apenas arquivos de imagem.');
          return res.redirect(`/pacientes/${req.params.id}/edit`);
        }
        imagePath = req.file.filename;
      }
      
      let filhosArray = [];

      if (Array.isArray(filhos)) {
        filhosArray = filhos.filter((filho) => {
          return (
            typeof filho === 'object' &&
            filho !== null &&
            !Array.isArray(filho) &&
            filho.nome && 
            filho.idade
          );
        });
      } else if (typeof filhos === 'string') {
        try {
          filhosArray = JSON.parse(filhos).filter((filho) => {
            return (
              typeof filho === 'object' &&
              filho !== null &&
              !Array.isArray(filho) &&
              filho.nome && 
              filho.idade
            );
          });
        } catch (error) {
          console.error('Erro ao parsear filhos:', error);
          req.flash('error_msg', 'Formato inválido para os dados dos filhos.');
          return res.redirect(`/pacientes/${req.params.id}/edit`);
        }
      }
      
      // Se nenhum filho for enviado, mantém os filhos existentes
      if (filhosArray.length === 0 && paciente.filhos) {
        filhosArray = paciente.filhos;
      }

      console.log('Filhos normalizados:', filhosArray);

      await paciente.update({
        nome,
        matricula,
        dataNascimento,
        sexo,
        rg: rgLimpo,
        telefone: telefoneLimpo,
        telefoneContato: telefoneContatoLimpo,
        filhos: filhosArray, 
        tipoTelefone,
        nomeContato,
        parentesco,
        postoServiço,
        escala,
        tempoServiço,
        periodoEscala,
        porteArma,
        trabalhoArmado,
        armaPessoal,
        planoSaude,
        cartaoSus,
        alergia,
        alergiaMedicamento,
        doenca,
        descricaoDoenca,
        medicamentos,
        tipoMedicamento,
        seguroVida,
        comoConheceuEmpresa,
        terapia,
        terapiaPeriodo,
        terapiaMotivo,
        moradia,
        familiaDeficiencias,
        deficiencia,
        atividadeFisica,
        tipoAtividadeFisica,
        relacaoSupervisor,
        observacoes,
        status,
        statusPaciente,
        imagePath,
        ...dadosBasicos,
      });

      req.flash('success_msg', 'Paciente atualizado com sucesso.');
      res.redirect('/pacientes');
    } catch (error) {
      console.error('Erro ao atualizar paciente:', error);

      if (error.name === 'SequelizeValidationError') {
        const validationErrors = error.errors.map((err) => err.message);
        req.flash('error_msg', `Erro de validação: ${validationErrors.join('. ')}`);
      } else if (error.name === 'SequelizeUniqueConstraintError') {
        req.flash('error_msg', 'RG ou matrícula já cadastrados.');
      } else {
        req.flash('error_msg', 'Erro ao atualizar o paciente.');
      }

      res.redirect(`/pacientes/${req.params.id}/edit`);
    }
  },
];

exports.delete = async (req, res) => {
  try {
    const paciente = await Paciente.findByPk(req.params.id);

    if (!paciente) {
      return res.status(404).send('Paciente não encontrado.');
    }

    const imagePath = paciente.imagePath ? path.join(__dirname, '../uploads/images/', paciente.imagePath) : null;
    const documentPath = paciente.documentPath ? path.join(__dirname, '../uploads/documents/', paciente.documentPath) : null;

    if (imagePath && fs.existsSync(imagePath)) {
      fs.unlinkSync(imagePath);
      console.log(`Imagem deletada: ${imagePath}`);
    }

    if (documentPath && fs.existsSync(documentPath)) {
      fs.unlinkSync(documentPath);
      console.log(`Documento deletado: ${documentPath}`);
    }

    await Paciente.destroy({ where: { id: req.params.id } });

    req.flash('success_msg', 'Paciente deletado com sucesso.');
    res.redirect('/pacientes');

  } catch (error) {
    req.flash('error_msg', 'Erro ao deletar paciente.');
    console.error('Erro ao deletar paciente:', error);
    res.status(500).send('Erro ao deletar paciente. Tente novamente mais tarde.');
  }
};


exports.perfil = async (req, res) => {
  const { id } = req.params;

  try {
    const paciente = await Paciente.findByPk(id, {
      include: [
        {
          model: Atendimento,
          as: 'atendimentos',
          include: [
            {
              model: Profissional,
              as: 'profissional',
            },
          ],
        },
        {
          model: Documento,
          as: 'documentos',
        },
      ],
    });

    if (!paciente) {
      return res.status(404).send('Paciente não encontrado.');
    }

    console.log("Usuário logado (req.user):", req.user);

    const profissional = req.user?.profissional || {};
    const cargo = profissional.cargo ? profissional.cargo.trim().toLowerCase() : "";

    console.log("Cargo do profissional:", cargo);

    const gestorCargosMap = {
      'gestor servico social': ['assistente social'],
      'gestor psicologia': ['psicólogo'],
      'gestor psiquiatria': ['psiquiatra']
    };

    const isGestor = Object.keys(gestorCargosMap).includes(cargo);

    const atendimentosFiltrados = paciente.atendimentos.filter(atendimento => {
      const atendimentoCargo = atendimento.profissional.cargo.toLowerCase();

      // Administrador pode ver tudo
      if (cargo === "administrador") return true;

      // Profissional pode ver seus próprios atendimentos
      if (atendimento.profissionalId === profissional.id) return true;

      // Gestor pode ver atendimentos dos profissionais sob sua gestão
      if (isGestor && gestorCargosMap[cargo].includes(atendimentoCargo)) return true;

      // Profissionais podem ver atendimentos de seus gestores
      if (['assistente social', 'psicólogo', 'psiquiatra'].includes(atendimentoCargo) && 
          Object.keys(gestorCargosMap).includes(cargo)) {
        return true;
      }

      // Caso contrário, não pode ver o atendimento
      return false;
    });

    const podeEditar = cargo === "administrador" || 
                       cargo === "assistente social" || 
                       cargo === "gestor servico social" || 
                       (isGestor && paciente.atendimentos.some(a => gestorCargosMap[cargo].includes(a.profissional.cargo.toLowerCase())));

    const podeDeletar = cargo === "administrador";
    const podeCadastrar = podeEditar; // Simplificação, pois a lógica é a mesma

    const imagePath = paciente.imagePath ? `/uploads/images/${paciente.imagePath}` : null;

    return res.render('paciente/perfil', {
      paciente: {
        ...paciente.get({ plain: true }),
        atendimentos: atendimentosFiltrados, 
      },
      profissional,
      imagePath,
      podeEditar,
      podeDeletar,
      podeCadastrar,
      query: req.query,
    });

  } catch (error) {
    console.error('Erro ao buscar perfil do paciente:', error);
    return res.status(500).send(`Erro ao buscar perfil do paciente: ${error.message}`);
  }
};

exports.relatorioDetalhes = async (req, res) => {
  const { id } = req.params;

  if (!id || isNaN(id)) {
    return res.status(400).send('ID do paciente inválido.');
  }

  try {

    const paciente = await Paciente.findByPk(id, {
      include: [
        {
          model: Atendimento,
          as: 'atendimentos', 
          include: [
            {
              model: Profissional,
              as: 'profissional', 
            },
          ],
        },
        {
          model: Documento,
          as: 'documentos', 
        },
      ],
    });

    if (!paciente) {
      return res.status(404).send('Paciente não encontrado.');
    }

    return res.render('paciente/relatorioDetalhes', {
      paciente: paciente.toJSON(), 
    });
  } catch (error) {
    console.error('Erro ao buscar relatório:', error);
    return res.status(500).send('Erro interno ao buscar relatório.');
  }
};

exports.ficha = async (req, res) => {
  try {
    const paciente = await Paciente.findByPk(req.params.id);

    if (!paciente) {
      req.flash('error_msg', 'Paciente não encontrado.');
      return res.redirect('/pacientes');
    }

    const imagePath = paciente.imagePath ? `/uploads/images/${paciente.imagePath}` : null;


    res.render('paciente/ficha', { paciente, imagePath });
  } catch (error) {
    console.error('Erro ao buscar o paciente:', error);
    req.flash('error_msg', 'Erro ao carregar os detalhes do paciente.');
    res.redirect('/pacientes');
  }
};

