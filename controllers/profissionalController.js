const Profissional = require('../models/Profissional');
const Notificacao = require('../models/Notificacao');


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
  res.render('profissional/create', {
    error_msg: req.flash('error_msg'), // Mensagens de erro
    success_msg: req.flash('success_msg') // Mensagens de sucesso
  });
};
exports.store = async (req, res) => {
  // Executa o middleware de upload
  upload.single('imagem')(req, res, async (err) => {
    if (err) {
      req.flash('error_msg', `Erro ao fazer upload da imagem: ${err.message}`);
      return res.render('profissional/create', {
        error_msg: req.flash('error_msg'),
        success_msg: req.flash('success_msg'),
      });
    }

    try {
      const { nome, email, dataNascimento, cpf, matricula, telefone } = req.body;

      // Validação de campos obrigatórios
      const errors = validationResult(req); // Usa express-validator para validação
      if (!errors.isEmpty()) {
        const errorMessages = errors.array().map((err) => err.msg);
        req.flash('error_msg', errorMessages.join('. '));
        return res.render('profissional/create', {
          error_msg: req.flash('error_msg'),
          success_msg: req.flash('success_msg'),
        });
      }

      // Verifica se o CPF já está cadastrado
      const existingCpf = await Profissional.findOne({ where: { cpf } });
      if (existingCpf) {
        req.flash('error_msg', 'Já existe um profissional cadastrado com este CPF.');
        return res.render('profissional/create', {
          error_msg: req.flash('error_msg'),
          success_msg: req.flash('success_msg'),
        });
      }

      // Verifica se a matrícula já está cadastrada
      const existingMatricula = await Profissional.findOne({ where: { matricula } });
      if (existingMatricula) {
        req.flash('error_msg', 'Já existe um profissional cadastrado com esta matrícula.');
        return res.render('profissional/create', {
          error_msg: req.flash('error_msg'),
          success_msg: req.flash('success_msg'),
        });
      }

      // Criação do profissional
      await Profissional.create({
        nome,
        email,
        dataNascimento,
        cpf,
        matricula,
        telefone,
        imagePath: req.file.filename, // Salva o nome do arquivo da imagem
      });

      req.flash('success_msg', 'Profissional criado com sucesso!');
      return res.redirect('/profissionais'); // Redireciona para a lista de profissionais
    } catch (error) {
      console.error('Erro ao criar profissional:', error);

      // Verificação de erros de validação do Sequelize
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
      }); // Renderiza a mesma página em caso de erro
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
      error_msg: req.flash('error_msg'), // Mensagens de erro
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
        return res.render('profissional/edit', {
          profissional: profissional.get({ plain: true }),
          error_msg: req.flash('error_msg'),
          success_msg: req.flash('success_msg')
        });
      }

      // Verificar formato do email
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        req.flash('error_msg', 'Email inválido.');
        return res.render('profissional/edit', {
          profissional: profissional.get({ plain: true }),
          error_msg: req.flash('error_msg'),
          success_msg: req.flash('success_msg')
        });
      }

      // Verificar formato do CPF (apenas números)
      const cpfRegex =  /^\d{3}\.\d{3}\.\d{3}-\d{2}$/ ; // CPF deve ter 11 dígitos
      if (!cpfRegex.test(cpf)) {
        req.flash('error_msg', 'CPF deve conter apenas números e ter 11 dígitos.');
        return res.render('profissional/edit', {
          profissional: profissional.get({ plain: true }),
          error_msg: req.flash('error_msg'),
          success_msg: req.flash('success_msg')
        });
      }

      // Verificar se o CPF já está cadastrado (exceto para o próprio profissional)
      const existingCpf = await Profissional.findOne({ where: { cpf, id: { [Op.ne]: req.params.id } } });
      if (existingCpf) {
        req.flash('error_msg', 'Já existe um profissional cadastrado com este CPF.');
        return res.render('profissional/edit', {
          profissional: profissional.get({ plain: true }),
          error_msg: req.flash('error_msg'),
          success_msg: req.flash('success_msg')
        });
      }

      // Verificar se a matrícula já está cadastrada (exceto para o próprio profissional)
      const existingMatricula = await Profissional.findOne({ where: { matricula, id: { [Op.ne]: req.params.id } } });
      if (existingMatricula) {
        req.flash('error_msg', 'Já existe um profissional cadastrado com esta matrícula.');
        return res.render('profissional/edit', {
          profissional: profissional.get({ plain: true }),
          error_msg: req.flash('error_msg'),
          success_msg: req.flash('success_msg')
        });
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
        imagePath: req.file.filename, // Atualiza o caminho da imagem se uma nova for enviada
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

      // Renderiza a página de edição com mensagens de erro
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

exports.generateExcelReport = async (req, res) => {
  try {
    const profissionais = await Profissional.findAll();

    if (profissionais.length === 0) {
      return res.status(404).send('Nenhum profissional encontrado para gerar o relatório.');
    }

    // Criar os dados para a planilha
    const dados = profissionais.map(profissional => ({
      'ID': profissional.id,
      'Nome': profissional.nome,
      'Data de Admissão': new Date(profissional.dataAdmissao).toLocaleDateString(),
      'Cargo': profissional.cargo,
      'Telefone': profissional.telefone,
      'Email': profissional.email,
    }));

    // Criar uma planilha a partir dos dados
    const ws = xlsx.utils.json_to_sheet(dados);

    // Criar um arquivo de trabalho
    const wb = xlsx.utils.book_new();
    xlsx.utils.book_append_sheet(wb, ws, 'Profissionais');

    // Gerar o arquivo Excel
    const excelBuffer = xlsx.write(wb, { bookType: 'xlsx', type: 'buffer' });

    // Configurar o cabeçalho para o download
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=relatorio_profissionais.xlsx');
    res.end(excelBuffer);

  } catch (error) {
    console.error('Erro ao gerar o relatório de profissionais em Excel:', error);
    res.status(500).send('Erro ao gerar o relatório. Tente novamente mais tarde.');
  }
};


  exports.show = async (req, res) => {
    try {
      // Busca o profissional pelo ID, incluindo o Usuario associado
      const profissional = await Profissional.findByPk(req.params.id, {
        include: [
          {
            model: Usuario,
            as: 'usuarios', // Alias definido na associação
            attributes: ['usuario'], // Seleciona apenas o campo 'usuario'
          },
        ],
      });

      if (!profissional) {
        req.flash('error_msg', 'Profissional não encontrado.');
        return res.redirect('/profissionais');
      }
  
      // Busca os encaminhamentos recebidos pelo profissional
      const encaminhamentos = await Encaminhamento.findAll({
        include: [
          {
            model: Profissional,
            as: 'profissionalRecebido',  // Alias correto de profissionalRecebido
            where: { id: profissional.id },  // Filtra pelo ID do profissional
          }
        ],
        order: [['createdAt', 'DESC']],  // Ordena por data de criação
      });
  
      // Busca os atendimentos associados ao profissional
      const atendimentos = await Atendimento.findAll({
        where: {
          profissionalId: profissional.id,
        },
        include: [
          {
            model: Paciente,
            as: 'paciente', // Alias deve ser o mesmo definido no relacionamento
            attributes: ['id', 'nome', 'matricula'] 
          }
        ],
        order: [['dataAtendimento', 'DESC']],
      });
  
      // Busca as ocorrências associadas ao profissional
      const ocorrencias = await Ocorrencia.findAll({
        where: { profissionalId: profissional.id },
        order: [['data', 'DESC']],  // Ordena por data da ocorrência
      });
      
      const imagePath = profissional.imagePath ? `/uploads/images/${profissional.imagePath}` : null;



      // Renderiza a página com as informações do profissional
      res.render('profissional/perfil',{
        profissional: profissional.get({ plain: true }),  // Transforma o modelo em objeto simples
        encaminhamentos: encaminhamentos.map(e => e.get({ plain: true })),
        atendimentos: atendimentos.map(a => a.get({ plain: true })),
        ocorrencias: ocorrencias.map(o => o.get({ plain: true })),
        usuario: profissional.usuarios[0]?.usuario || 'Nenhum usuário associado',
        imagePath: imagePath, // Constrói a URL corretamente


      });
    } catch (error) {
      console.error('Erro ao buscar detalhes do profissional:', error);
      req.flash('error_msg', 'Erro ao buscar detalhes do profissional.');
      res.redirect('/profissionais');
    }
  };

  
  exports.showPerfil = async (req, res) => {
    try {
      // Verifica se o usuário está autenticado
      if (!req.user) {
        req.flash('error_msg', 'Você precisa estar logado para acessar esta página.');
        return res.redirect('/login');  // Redirecionar para a página de login
      }
  
      const profissionalId = req.user.profissionalId; // Certifique-se de que `req.user` contém o ID correto do profissional
      console.log('ID do profissional:', profissionalId);
  
      // Busca o profissional usando o ID do profissional
      const profissional = await Profissional.findByPk(profissionalId);
  
  
      if (!profissional) {
        req.flash('error_msg', 'Profissional não encontrado.');
        return res.redirect('/profissionais');
      }
  
      // Buscar encaminhamentos relacionados ao profissional
      const encaminhamentos = await Encaminhamento.findAll({
        include: [
          {
            model: Profissional,
            as: 'profissionalRecebido',  // Alias correto do profissionalRecebido
            where: { id: profissional.id },  // Filtra pelo ID do profissional logado
          }
        ],
        order: [['createdAt', 'DESC']],  // Ordena por data de criação
      });
  
      // Buscar atendimentos relacionados ao profissional
      const atendimentos = await Atendimento.findAll({
        where: { profissionalId: profissional.id },
        order: [['dataAtendimento', 'DESC']],  // Ordena por data de atendimento
      });
  
      // Buscar ocorrências relacionadas ao profissional
      const ocorrencias = await Ocorrencia.findAll({
        where: { profissionalId: profissional.id },
        order: [['data', 'DESC']],  // Ordena por data da ocorrência
      });

      const imagePath = profissional.imagePath ? `/uploads/images/${profissional.imagePath}` : null;

  
      // Renderiza a página com os dados
      res.render('profissional/meu_perfil', {
        profissional: profissional.get({ plain: true }),
        encaminhamentos: encaminhamentos.map(e => e.get({ plain: true })) || [],
        atendimentos: atendimentos.map(a => a.get({ plain: true })) || [],
        ocorrencias: ocorrencias.map(o => o.get({ plain: true })) || [],
        imagePath: imagePath, // Constrói a URL corretamente

      });
    } catch (error) {
      console.error('Erro ao buscar detalhes do profissional:', error);
      req.flash('error_msg', 'Erro ao buscar detalhes do profissional.');
      res.redirect('/profissionais');
    }
  };
  
  


