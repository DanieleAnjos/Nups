const Profissional = require('../models/Profissional');
const Notificacao = require('../models/Notificacao');

const { ValidationError } = require('sequelize');
const { Op } = require('sequelize');
const puppeteer = require('puppeteer');
const path = require('path');
const { upload, uploadErrorHandler } = require('../config/multer'); 
const Encaminhamento = require('../models/Encaminhamento');
const Atendimento2 = require('../models/Atendimento2');
const Ocorrencia = require('../models/Ocorrencia');



exports.index = async (req, res) => {
  const { nome, email, cargo } = req.query; 
  const where = {}; 

  if (nome) {
    where.nome = { [Op.like]: `%${nome}%` }; 
  }
  if (email) {
    where.email = { [Op.like]: `%${email}%` }; 
  }
  if (cargo) {
    where.cargo = { [Op.like]: `%${cargo}%` }; 
  }

  try {
    const profissionais = await Profissional.findAll({ where });
    const profissionaisData = profissionais.map(prof => prof.get({ plain: true }));

    res.render('profissional/index', { 
      profissionais: profissionaisData,
      query: req.query 
    });
  } catch (error) {
    console.error('Erro ao listar profissionais:', error);
    req.flash('error_msg', 'Erro ao listar profissionais.');
    res.redirect('/profissionais');
  }
};

exports.generateReport = async (req, res) => {
  try {
    const { nome, email, cargo } = req.query;

    const where = {};

    if (nome) {
      where.nome = nome; 
    }

    if (email) {
      where.email = email; 
    }

    if (cargo) {
      where.cargo = cargo; 
    }

    const profissionais = await Profissional.findAll({
      where,
    });

    if (profissionais.length === 0) {
      return res.status(404).send('Nenhum profissional encontrado para os filtros aplicados.');
    }

    let htmlContent = '<h1>Relatório de Profissionais</h1><table border="1" cellpadding="5" cellspacing="0"><thead><tr><th>Nome</th><th>Email</th><th>Cargo</th></tr></thead><tbody>';
    
    profissionais.forEach(profissional => {
      htmlContent += `<tr><td>${profissional.nome}</td><td>${profissional.email}</td><td>${profissional.cargo}</td></tr>`;
    });

    htmlContent += '</tbody></table>';

    const browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();

    await page.setContent(htmlContent);

    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,  
    });

    await browser.close();

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename=relatorio_profissionais.pdf');
    res.end(pdfBuffer); 

  } catch (error) {
    console.error('Erro ao gerar o relatório em PDF:', error);
    res.status(500).send('Erro ao gerar o relatório. Tente novamente mais tarde.');
  }
};

exports.create = (req, res) => {
  res.render('profissional/create', { error_msg: req.flash('error_msg') });
};

exports.store = async (req, res) => {
  upload.single('imagem')(req, res, async (err) => {
    if (err) {
      req.flash('error_msg', `Erro ao fazer upload da imagem: ${err.message}`);
      return res.redirect('/profissionais/create');
    }

    try {
      const { nome, email, cpf } = req.body;

      // Validação de campos obrigatórios
      if (!nome || !email || !cpf || nome.trim() === "" || email.trim() === "" || cpf.trim() === "") {
        req.flash('error_msg', 'Por favor, preencha todos os campos obrigatórios.');
        return res.redirect('/profissionais/create');
      }

      const imagePath = req.file ? req.file.path : null;

      // Criação do profissional
      await Profissional.create({
        ...req.body,
        imagePath,
      });

      req.flash('success_msg', 'Profissional criado com sucesso!');
      return res.redirect('/profissionais'); // Redireciona para a lista de profissionais
    } catch (error) {
      console.error('Erro ao criar profissional:', error);

      // Verificação de erros de validação
      if (error.name === 'SequelizeValidationError') {
        const validationErrors = error.errors.map((err) => err.message);
        req.flash('error_msg', `Erro de validação: ${validationErrors.join('. ')}`);
      } else {
        req.flash('error_msg', 'Erro ao criar o profissional.');
      }

      return res.redirect('/profissionais/create'); // Redireciona para a página de criação em caso de erro
    }
  });
};


exports.edit = async (req, res) => {
  try {
    const profissional = await Profissional.findByPk(req.params.id);

    if (!profissional) {
      req.flash('error_msg', 'Profissional não encontrado.');
      return res.redirect('/profissionais');
    }

    res.render('profissional/edit', {
      profissional: profissional.get({ plain: true }),
      error_msg: req.flash('error_msg'),
      success_msg: req.flash('success_msg'),
    });
  } catch (error) {
    console.error('Erro ao buscar profissional:', error);
    req.flash('error_msg', 'Erro ao buscar o profissional.');
    res.redirect('/profissionais');
  }
};

exports.update = async (req, res) => {
  upload.single('imagem')(req, res, async (err) => {
    if (err) {
      req.flash('error_msg', `Erro ao fazer upload da imagem: ${err.message}`);
      return res.redirect(`/profissionais/edit/${req.params.id}`);
    }

    try {
      const profissional = await Profissional.findByPk(req.params.id);

      if (!profissional) {
        req.flash('error_msg', 'Profissional não encontrado.');
        return res.redirect('/profissionais');
      }

      // Extração dos dados enviados pelo formulário
      const {
        nome,
        email,
        rg,
        cpf,
        dataNascimento,
        sexo,
        estadoCivil,
        matricula,
        dataAdmissao,
        cargo,
        vinculo,
        contatoEmergenciaNome,
        telefoneContatoEmergencia,
      } = req.body;

      console.log(req.body);  // Para verificar os dados recebidos

      // Verificar campos obrigatórios
      if (!nome || !email || !cpf || nome.trim() === "" || email.trim() === "" || cpf.trim() === "") {
        const errorMessage = 'Campos obrigatórios não preenchidos.';
        console.error(errorMessage, { nome, email, cpf });
        req.flash('error_msg', errorMessage);
        return res.redirect(`/profissionais/edit/${req.params.id}`);
      }

      // Atualização dos dados
      const imagePath = req.file ? req.file.path : profissional.imagePath; // Mantém a imagem antiga se não houver nova
      await profissional.update({
        nome,
        email,
        rg,
        cpf,
        dataNascimento,
        sexo,
        estadoCivil,
        matricula,
        dataAdmissao,
        cargo,
        vinculo,
        contatoEmergenciaNome,
        telefoneContatoEmergencia,
        imagePath, // Atualiza o caminho da imagem se uma nova for enviada
      });

      req.flash('success_msg', 'Profissional atualizado com sucesso!');
      res.redirect('/profissionais');
    } catch (error) {
      console.error('Erro ao atualizar profissional:', error);

      if (error instanceof ValidationError) {
        // Capturando erros de validação do Sequelize
        const validationErrors = error.errors.map(err => err.message);
        console.error('Erros de validação do Sequelize:', validationErrors);
        req.flash('error_msg', `Erro de validação: ${validationErrors.join('. ')}`);
      } else {
        console.error('Erro inesperado ao atualizar profissional:', error);
        req.flash('error_msg', 'Erro ao atualizar o profissional.');
      }

      res.redirect(`/profissionais/edit/${req.params.id}`);
    }
  });
};



exports.generateProfissionalReport = async (req, res) => {
  try {
    const profissionais = await Profissional.findAll();

    if (profissionais.length === 0) {
      return res.status(404).send('Nenhum profissional cadastrado para gerar o relatório.');
    }

    let htmlContent = '<h1>Relatório de Profissionais Cadastrados</h1><table border="1" cellpadding="5" cellspacing="0"><thead><tr><th>ID</th><th>Nome</th><th>Data de Admissão</th><th>Cargo</th><th>Telefone</th><th>Email</th></tr></thead><tbody>';

    profissionais.forEach(profissional => {
      htmlContent += `<tr>
                        <td>${profissional.id}</td>
                        <td>${profissional.nome}</td>
                        <td>${new Date(profissional.dataAdmissao).toLocaleDateString()}</td>
                        <td>${profissional.cargo}</td>
                        <td>${profissional.telefone}</td>
                        <td>${profissional.email}</td>
                      </tr>`;
    });

    htmlContent += '</tbody></table>';

    const browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();
    await page.setContent(htmlContent);
    const pdfBuffer = await page.pdf({ format: 'A4', printBackground: true });

    await browser.close();

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename=relatorio_profissionais.pdf');
    res.end(pdfBuffer);
  } catch (error) {
    console.error('Erro ao gerar o relatório de profissionais:', error);
    res.status(500).send('Erro ao gerar o relatório. Tente novamente mais tarde.');
  }
};

exports.delete = async (req, res) => {
  try {
    const profissional = await Profissional.findByPk(req.params.id);
    if (!profissional) {
      req.flash('error_msg', 'Profissional não encontrado.');
    } else {
      await profissional.destroy();
      req.flash('success_msg', 'Profissional deletado com sucesso!');
    }
    res.redirect('/profissionais');
  } catch (error) {
    console.error('Erro ao deletar profissional:', error);
    req.flash('error_msg', 'Erro ao deletar o profissional.');
    res.redirect('/profissionais');
  }
};

  exports.viewProfissionaisReport = async (req, res) => {
    try {
      const profissionais = await Profissional.findAll();
  
      if (profissionais.length === 0) {
        return res.status(404).send('Nenhum profissional cadastrado.');
      }
  
      res.render('relatorios/viewProfissionaisReport', { profissionais, layout: false });
    } catch (error) {
      console.error('Erro ao exibir o relatório de profissionais:', error);
      res.status(500).send('Erro ao exibir o relatório. Tente novamente mais tarde.');
    }
  } ; 
  exports.show = async (req, res) => {
    try {
      const profissional = await Profissional.findByPk(req.params.id);
  
      if (!profissional) {
        req.flash('error_msg', 'Profissional não encontrado.');
        return res.redirect('/profissionais');
      }
  
      const encaminhamentos = await Encaminhamento.findAll({
        where: {
          nomeProfissional: profissional.nome, 
        },
        order: [['createdAt', 'DESC']], 
      });
  
      const atendimentos = await Atendimento2.findAll({
        where: {
          profissionalId: profissional.id, 
        },
        order: [['dataAtendimento', 'DESC']], 
      });

      const ocorrencias = await Ocorrencia.findAll({
        where: { profissionalId: profissional.id },
        order: [['data', 'DESC']],
      });
  
      res.render('profissional/perfil', {
        profissional: profissional.get({ plain: true }),
        encaminhamentos: encaminhamentos.map(e => e.get({ plain: true })),
        atendimentos: atendimentos.map(a => a.get({ plain: true })),
        ocorrencias: ocorrencias.map(o => o.get({ plain: true })),

      });
    } catch (error) {
      console.error('Erro ao buscar detalhes do profissional:', error);
      req.flash('error_msg', 'Erro ao buscar detalhes do profissional.');
      res.redirect('/profissionais');
    }
  };
  

  exports.showPerfil = async (req, res) => {
    try {
      const profissionalLogado = req.user; 
  
      const profissional = await Profissional.findByPk(req.params.id);
  
      if (!profissional) {
        req.flash('error_msg', 'Profissional não encontrado.');
        return res.redirect('/profissionais');
      }
  
      if (profissional.id !== profissionalLogado.id) {
        req.flash('error_msg', 'Você não tem permissão para visualizar este perfil.');
        return res.redirect('/profissionais');
      }
  
      const encaminhamentos = await Encaminhamento.findAll({
        where: {
          nomeProfissional: profissional.nome, 
        },
        order: [['createdAt', 'DESC']], 
      });
  
      const atendimentos = await Atendimento2.findAll({
        where: {
          profissionalId: profissional.id, 
        },
        order: [['dataAtendimento', 'DESC']], 
      });

      const ocorrencias = await Ocorrencia.findAll({
        where: { profissionalId: profissional.id },
        order: [['data', 'DESC']],
      });
  
      res.render('profissional/meu_perfil', {
        profissional: profissional.get({ plain: true }),
        encaminhamentos: encaminhamentos.map(e => e.get({ plain: true })),
        atendimentos: atendimentos.map(a => a.get({ plain: true })),
        ocorrencias: ocorrencias.map(o => o.get({ plain: true })),

      });
    } catch (error) {
      console.error('Erro ao buscar detalhes do profissional:', error);
      req.flash('error_msg', 'Erro ao buscar detalhes do profissional.');
      res.redirect('/profissionais');
    }
  };
  


