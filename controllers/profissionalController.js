const Profissional = require('../models/Profissional');
const Notificacao = require('../models/Notificacao');
const FluxoAtendimentos = require('../models/FluxoAtendimentos');

const { ValidationError } = require('sequelize');
const { Op } = require('sequelize');
const puppeteer = require('puppeteer');
const path = require('path');
const { upload, uploadErrorHandler } = require('../config/multer'); 
const Encaminhamento = require('../models/Encaminhamento');
const Atendimento = require('../models/Atendimento');
const Ocorrencia = require('../models/Ocorrencia');
const Paciente = require('../models/Paciente');
const Usuario = require('../models/Usuario');
const { validationResult } = require('express-validator');
const { Parser } = require('json2csv');



exports.index = async (req, res) => {
  const { nome, email, cargo, sort = 'nome', order = 'ASC' } = req.query; // Adiciona sort e order
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

  // Lista de colunas permitidas para ordenação
  const allowedSortFields = ['matricula', 'nome', 'email', 'cargo', 'status'];
  const sortField = allowedSortFields.includes(sort) ? sort : 'nome';
  const sortOrder = order.toUpperCase() === 'DESC' ? 'DESC' : 'ASC';

  try {
    const profissionais = await Profissional.findAll({
      where,
      order: [[sortField, sortOrder]] // Ordenação dinâmica
    });

    const profissionaisData = profissionais.map(prof => prof.get({ plain: true }));

    res.render('profissional/index', {
      profissionais: profissionaisData,
      query: req.query,
      sort: sortField,
      order: sortOrder
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
  res.render('profissional/create', {
    error_msg: req.flash('error_msg'), 
    success_msg: req.flash('success_msg'),
    formData: req.body, // Mantém os dados do formulário
  });
};

exports.store = async (req, res) => {
  upload.single('imagem')(req, res, async (err) => {
    if (err) {
      req.flash('error_msg', `Erro ao fazer upload da imagem: ${err.message}`);
      return res.render('profissional/create', {
        error_msg: req.flash('error_msg'),
        success_msg: req.flash('success_msg'),
        formData: req.body, // Mantém os dados do formulário
      });
    }

    try {
      const {
        nome,
        email,
        dataNascimento,
        cpf,
        matricula,
        telefone,
        dataAdmissao,
        cargo,
        vinculo,
        sexo,
        cep,
        endereco,
        bairro,
        cidade,
        estado,
        numero,
        complemento,
        tipoTelefone,
        contatoEmergenciaNome,
        telefoneContatoEmergencia,
      } = req.body;

      const camposObrigatorios = {
        nome,
        email,
        dataNascimento,
        cpf,
        matricula,
        telefone,
        dataAdmissao,
        cargo,
        vinculo,
        sexo,
        cep,
        endereco,
        bairro,
        cidade,
        estado,
        numero,
        tipoTelefone,
      };

      for (const [campo, valor] of Object.entries(camposObrigatorios)) {
        if (!valor) {
          req.flash('error_msg', `O campo ${campo} é obrigatório.`);
          return res.render('profissional/create', {
            error_msg: req.flash('error_msg'),
            success_msg: req.flash('success_msg'),
            formData: req.body, // Mantém os dados do formulário
          });
        }
      }

      const existingCpf = await Profissional.findOne({ where: { cpf } });
      if (existingCpf) {
        req.flash('error_msg', 'Já existe um profissional cadastrado com este CPF.');
        return res.render('profissional/create', {
          error_msg: req.flash('error_msg'),
          success_msg: req.flash('success_msg'),
          formData: req.body, // Mantém os dados do formulário
        });
      }

      const existingMatricula = await Profissional.findOne({ where: { matricula } });
      if (existingMatricula) {
        req.flash('error_msg', 'Já existe um profissional cadastrado com esta matrícula.');
        return res.render('profissional/create', {
          error_msg: req.flash('error_msg'),
          success_msg: req.flash('success_msg'),
          formData: req.body, // Mantém os dados do formulário
        });
      }

      let imagePath = null;
      if (req.file) {
        if (!req.file.mimetype.startsWith('image/')) {
          req.flash('error_msg', 'Por favor, carregue apenas arquivos de imagem.');
          return res.render('profissional/create', {
            error_msg: req.flash('error_msg'),
            success_msg: req.flash('success_msg'),
            formData: req.body, // Mantém os dados do formulário
          });
        }
        imagePath = req.file.filename;
      }

      await Profissional.create({
        nome,
        email,
        dataNascimento,
        cpf,
        matricula,
        telefone,
        dataAdmissao,
        cargo,
        vinculo,
        sexo,
        cep,
        endereco,
        bairro,
        cidade,
        estado,
        numero,
        complemento,
        tipoTelefone,
        contatoEmergenciaNome,
        telefoneContatoEmergencia,
        imagePath,
      });

      req.flash('success_msg', 'Profissional criado com sucesso!');
      return res.redirect('/profissionais'); 
    } catch (error) {
      console.error('Erro ao criar profissional:', error);

      if (error.name === 'SequelizeValidationError') {
        const validationErrors = error.errors.map((err) => err.message);
        req.flash('error_msg', `Erro de validação: ${validationErrors.join('. ')}`);
      } else if (error.name === 'SequelizeUniqueConstraintError') {
        req.flash('error_msg', 'CPF ou matrícula já cadastrados.');
      } else {
        req.flash('error_msg', 'Erro ao criar o profissional.');
      }

      return res.render('profissional/create', {
        error_msg: req.flash('error_msg'),
        success_msg: req.flash('success_msg'),
        formData: req.body, // Mantém os dados do formulário
      });
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
      success_msg: req.flash('success_msg')
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

      const {
        nome,
        email,
        rg,
        cpf,
        status,
        dataNascimento,
        sexo,
        estadoCivil,
        matricula,
        dataAdmissao,
        cargo,
        cep,
        telefone,
        tipoTelefone,
        endereco,
        bairro,
        cidade,
        estado,
        numero,
        complemento,
        vinculo,
        contatoEmergenciaNome,
        telefoneContatoEmergencia,
      } = req.body;

      console.log(req.body);  

      if (!nome || !email || !cpf || nome.trim() === "" || email.trim() === "" || cpf.trim() === "") {
        const errorMessage = 'Campos obrigatórios não preenchidos.';
        console.error(errorMessage, { nome, email, cpf });
        req.flash('error_msg', errorMessage);
        return res.render('profissional/edit', {
          profissional: profissional.get({ plain: true }),
          error_msg: req.flash('error_msg'),
          success_msg: req.flash('success_msg')
        });
      }

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        req.flash('error_msg', 'Email inválido.');
        return res.render('profissional/edit', {
          profissional: profissional.get({ plain: true }),
          error_msg: req.flash('error_msg'),
          success_msg: req.flash('success_msg')
        });
      }

      const cpfRegex =  /^\d{3}\.\d{3}\.\d{3}-\d{2}$/ ; 
      if (!cpfRegex.test(cpf)) {
        req.flash('error_msg', 'CPF deve conter apenas números e ter 11 dígitos.');
        return res.render('profissional/edit', {
          profissional: profissional.get({ plain: true }),
          error_msg: req.flash('error_msg'),
          success_msg: req.flash('success_msg')
        });
      }

      const existingCpf = await Profissional.findOne({ where: { cpf, id: { [Op.ne]: req.params.id } } });
      if (existingCpf) {
        req.flash('error_msg', 'Já existe um profissional cadastrado com este CPF.');
        return res.render('profissional/edit', {
          profissional: profissional.get({ plain: true }),
          error_msg: req.flash('error_msg'),
          success_msg: req.flash('success_msg')
        });
      }

      const existingMatricula = await Profissional.findOne({ where: { matricula, id: { [Op.ne]: req.params.id } } });
      if (existingMatricula) {
        req.flash('error_msg', 'Já existe um profissional cadastrado com esta matrícula.');
        return res.render('profissional/edit', {
          profissional: profissional.get({ plain: true }),
          error_msg: req.flash('error_msg'),
          success_msg: req.flash('success_msg')
        });
      }

      let imagePath = profissional.imagePath;
      if (req.file) {
        if (!req.file.mimetype.startsWith('image/')) {
          req.flash('error_msg', 'Por favor, carregue apenas arquivos de imagem.');
          return res.redirect(`/pacientes/${req.params.id}/edit`);
        }
        imagePath = req.file.filename;
      }

await profissional.update({
        nome,
        email,
        rg,
        cpf,
        status,
        dataNascimento,
        sexo,
        cep,
        endereco,
        bairro,
        cidade,
        estado,
        numero,
        telefone,
        tipoTelefone,
        complemento,
        estadoCivil,
        matricula,
        dataAdmissao,
        cargo,
        vinculo,
        contatoEmergenciaNome,
        telefoneContatoEmergencia,
        imagePath, 
      });


      req.flash('success_msg', 'Profissional atualizado com sucesso!');
      res.redirect('/profissionais');
    } catch (error) {
      console.error('Erro ao atualizar profissional:', error);

      if (error instanceof ValidationError) {

        const validationErrors = error.errors.map(err => err.message);
        console.error('Erros de validação do Sequelize:', validationErrors);
        req.flash('error_msg', `Erro de validação: ${validationErrors.join('. ')}`);
      } else {
        console.error('Erro inesperado ao atualizar profissional:', error);
        req.flash('error_msg', 'Erro ao atualizar o profissional.');
      }

      return res.render('profissional/edit', {
        error_msg: req.flash('error_msg'),
        success_msg: req.flash('success_msg')
      });
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
      
      const { dataInicio, dataFim, profissional } = req.query;

      const where = {};
  
      if (dataInicio && dataFim) {
        where.data = {
          [Op.between]: [dataInicio, dataFim],
        };
      } else if (dataInicio) {
        where.data = {
          [Op.gte]: dataInicio, 
        };
      } else if (dataFim) {
        where.data = {
          [Op.lte]: dataFim, 
        };
      }
  
      if (profissional) {
        where.adminId = profissional; 
      }
  
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

  const xlsx = require('xlsx');

  exports.generateCSVReport = async (req, res) => {
    try {
      const profissionais = await Profissional.findAll();
  
      if (profissionais.length === 0) {
        return res.status(404).send('Nenhum profissional encontrado para gerar o relatório.');
      }
  
      const dados = profissionais.map(profissional => ({
        'ID': profissional.id,
        'Nome': profissional.nome,
        'Data de Admissão': new Date(profissional.dataAdmissao).toLocaleDateString(),
        'Cargo': profissional.cargo,
        'Telefone': profissional.telefone,
        'Email': profissional.email,
      }));
  
      const parser = new Parser();
      const csvData = parser.parse(dados);
  
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename=relatorio_profissionais.csv');
      res.send(csvData);
  
    } catch (error) {
      console.error('Erro ao gerar o relatório de profissionais em CSV:', error);
      res.status(500).send('Erro ao gerar o relatório. Tente novamente mais tarde.');
    }
  };


  exports.show = async (req, res) => {
    try {

      const profissional = await Profissional.findByPk(req.params.id, {
        include: [
          {
            model: Usuario,
            as: 'usuarios', 
            attributes: ['usuario'],
          },
        ],
      });

      if (!profissional) {
        req.flash('error_msg', 'Profissional não encontrado.');
        return res.redirect('/profissionais');
      }
  
      const encaminhamentos = await Encaminhamento.findAll({
        include: [
          {
            model: Profissional,
            as: 'profissionalRecebido',  
            where: { id: profissional.id },  
          }
        ],
        order: [['createdAt', 'DESC']], 
      });

      const fluxoAtendimento = await FluxoAtendimentos.findAll({
        include: [
          {
            model: Profissional,
            as: 'profissionalRecebido',  
            where: { id: profissional.id },  
          }
        ],
        order: [['createdAt', 'DESC']], 
      });
  
      const atendimentos = await Atendimento.findAll({
        where: {
          profissionalId: profissional.id,
        },
        include: [
          {
            model: Paciente,
            as: 'paciente', 
            attributes: ['id', 'nome', 'matricula'] 
          }
        ],
        order: [['dataAtendimento', 'DESC']],
      });
  
      const ocorrencias = await Ocorrencia.findAll({
        where: { profissionalId: profissional.id },
        order: [['data', 'DESC']],  
      });
      
      const imagePath = profissional.imagePath ? `/uploads/images/${profissional.imagePath}` : null;



      res.render('profissional/perfil',{
        profissional: profissional.get({ plain: true }), 
        encaminhamentos: encaminhamentos.map(e => e.get({ plain: true })),
        fluxoAtendimento: fluxoAtendimento.map(f => f.get({ plain: true })),  // transformando os objetos relacionados em arrays plenos
        atendimentos: atendimentos.map(a => a.get({ plain: true })),
        ocorrencias: ocorrencias.map(o => o.get({ plain: true })),
        usuario: profissional.usuarios[0]?.usuario || 'Nenhum usuário associado',
        imagePath: imagePath, 


      });
    } catch (error) {
      console.error('Erro ao buscar detalhes do profissional:', error);
      req.flash('error_msg', 'Erro ao buscar detalhes do profissional.');
      res.redirect('/profissionais');
    }
  };

  exports.showPerfil = async (req, res) => {
    try {

      if (!req.user) {
        req.flash('error_msg', 'Você precisa estar logado para acessar esta página.');
        return res.redirect('/login'); 
      }
  
      const profissionalId = req.user.profissionalId; 
      console.log('ID do profissional:', profissionalId);
  
      const profissional = await Profissional.findByPk(profissionalId, {
        include: [
          {
            model: Usuario,
            as: 'usuarios', 
            attributes: ['usuario'], 
          },
        ],
      });
  
      if (!profissional) {
        req.flash('error_msg', 'Profissional não encontrado.');
        return res.redirect('/profissionais');
      }
  
      const encaminhamentos = await Encaminhamento.findAll({
        include: [
          {
            model: Profissional,
            as: 'profissionalRecebido',  
            where: { id: profissional.id },  
          },
        ],
        order: [['createdAt', 'DESC']],  
      });

      const fluxoAtendimento = await FluxoAtendimentos.findAll({
        include: [
          {
            model: Profissional,
            as: 'profissionalRecebido',  
            where: { id: profissional.id },  
          }
        ],
        order: [['createdAt', 'DESC']], 
      });
  
      const atendimentos = await Atendimento.findAll({
        where: { profissionalId: profissional.id },
        order: [['dataAtendimento', 'DESC']],  
      });
  
      const ocorrencias = await Ocorrencia.findAll({
        where: { profissionalId: profissional.id },
        order: [['data', 'DESC']],  
      });
  
      const imagePath = profissional.imagePath ? `/uploads/images/${profissional.imagePath}` : null;
  
      const usuario = profissional.usuarios[0]?.usuario || 'Nenhum usuário associado';
  
      res.render('profissional/meu_perfil', {
        profissional: profissional.get({ plain: true }),
        encaminhamentos: encaminhamentos.map(e => e.get({ plain: true })) || [],
        fluxoAtendimento: fluxoAtendimento.map(f => f.get({ plain: true })) || [],  // transformando os objetos relacionados em arrays plenos
        atendimentos: atendimentos.map(a => a.get({ plain: true })) || [],
        ocorrencias: ocorrencias.map(o => o.get({ plain: true })) || [],
        usuario: usuario, 
        imagePath: imagePath, 
      });
    } catch (error) {
      console.error('Erro ao buscar detalhes do profissional:', error);
      req.flash('error_msg', 'Erro ao buscar detalhes do profissional.');
      res.redirect('/profissionais');
    }
  };
  