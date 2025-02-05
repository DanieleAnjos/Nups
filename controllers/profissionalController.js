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
      const profissional = await Profissional.findByPk(req.params.id);
  
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
  
      // Renderiza a página com as informações do profissional
      res.render('profissional/perfil', {
        profissional: profissional.get({ plain: true }),  // Transforma o modelo em objeto simples
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
      // Verifica se o usuário está autenticado
      if (!req.user) {
        req.flash('error_msg', 'Você precisa estar logado para acessar esta página.');
        return res.redirect('/login');  // Redirecionar para a página de login
      }
  
      const profissionalLogado = req.user;  // Profissional logado
  
      const profissional = await Profissional.findByPk(req.params.id);
  
      if (!profissional) {
        req.flash('error_msg', 'Profissional não encontrado.');
        return res.redirect('/profissionais');
      }
  
      // Verifica se o profissional logado é o mesmo que o solicitado
      if (profissional.id !== profissionalLogado.id) {
        req.flash('error_msg', 'Você não tem permissão para visualizar este perfil.');
        return res.redirect('/profissionais');
      }
  
      // Buscando o encaminhamento pelo ID (provavelmente id do encaminhamento passado na URL)
      const encaminhamento = await Encaminhamento.findByPk(req.params.encaminhamentoId);
  
      if (!encaminhamento) {
        req.flash('error_msg', 'Encaminhamento não encontrado.');
      }
  
      // Buscar todos os encaminhamentos do profissional, utilizando a associação correta
      const encaminhamentos = await Encaminhamento.findAll({
        include: [
          {
            model: Profissional,
            as: 'profissionalRecebido',  // Alias correto do profissionalEnvio
            where: { nome: profissional.nome },  // Filtra pelo nome do profissional logado
          }
        ],
        order: [['createdAt', 'DESC']],  // Ordena por data de criação
      });
  
      // Buscar os atendimentos relacionados ao profissional
      const atendimentos = await Atendimento.findAll({
        where: {
          profissionalId: profissional.id, 
        },
        order: [['dataAtendimento', 'DESC']],  // Ordena por data de atendimento
      });
  
      // Buscar as ocorrências relacionadas ao profissional
      const ocorrencias = await Ocorrencia.findAll({
        where: { profissionalId: profissional.id },
        order: [['data', 'DESC']],  // Ordena por data da ocorrência
      });
  
      // Renderiza a página com os dados do profissional e suas informações
      res.render('profissional/meu_perfil', {
        profissional: profissional.get({ plain: true }),  // Transforma o modelo em um objeto simples
        encaminhamentos: encaminhamentos.map(e => e.get({ plain: true })) || [],  // Garante que será um array vazio se não houver encaminhamentos
        atendimentos: atendimentos.map(a => a.get({ plain: true })) || [],  // Garante que será um array vazio se não houver atendimentos
        ocorrencias: ocorrencias.map(o => o.get({ plain: true })) || [],  // Garante que será um array vazio se não houver ocorrências
        encaminhamento: encaminhamento ? encaminhamento.get({ plain: true }) : null, // Garante que será null se não houver encaminhamento
      });
    } catch (error) {
      console.error('Erro ao buscar detalhes do profissional:', error);
      req.flash('error_msg', 'Erro ao buscar detalhes do profissional.');
      res.redirect('/profissionais');
    }
  };
  


