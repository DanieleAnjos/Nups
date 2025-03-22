const express = require('express');
const router = express.Router();
const Arquivo = require('../models/Arquivo');
const { upload, uploadErrorHandler } = require('../config/multer');

router.get('/', async (req, res) => {
  try {
    const arquivos = await Arquivo.findAll({
      where: { profissionalId: req.user.profissionalId },
    });
    res.render('arquivos/index', { arquivos });
  } catch (error) {
    console.error('Erro ao buscar arquivos:', error);
    req.flash('error_msg', 'Erro ao buscar arquivos.');
    res.redirect('/profissionais');
  }
});

router.get('/create', (req, res) => {
  res.render('arquivos/create');
});

router.post('/create', upload.single('arquivo'), uploadErrorHandler, async (req, res) => {
  try {
    const { nome, descricao } = req.body;

    if (!req.file) {
      req.flash('error_msg', 'Nenhum arquivo enviado.');
      return res.redirect('/arquivos/create');
    }

    const caminho = req.file.path.replace('public', ''); // Caminho relativo

    await Arquivo.create({
      nome,
      caminho,
      descricao,
      profissionalId: req.user.profissionalId,
    });

    req.flash('success_msg', 'Arquivo enviado com sucesso!');
    res.redirect('/arquivos');
  } catch (error) {
    console.error('Erro ao enviar arquivo:', error);
    req.flash('error_msg', 'Erro ao enviar arquivo.');
    res.redirect('/arquivos/create');
  }
});

router.get('/edit/:id', async (req, res) => {
  try {
    const arquivo = await Arquivo.findByPk(req.params.id);

    if (!arquivo || arquivo.profissionalId !== req.user.profissionalId) {
      req.flash('error_msg', 'Arquivo não encontrado ou você não tem permissão para editá-lo.');
      return res.redirect('/arquivos');
    }

    res.render('arquivos/edit', { arquivo });
  } catch (error) {
    console.error('Erro ao buscar arquivo:', error);
    req.flash('error_msg', 'Erro ao buscar arquivo.');
    res.redirect('/arquivos');
  }
});

router.post('/edit/:id', upload.single('arquivo'), uploadErrorHandler, async (req, res) => {
  try {
    const { nome, descricao } = req.body;
    const arquivo = await Arquivo.findByPk(req.params.id);

    if (!arquivo || arquivo.profissionalId !== req.user.profissionalId) {
      req.flash('error_msg', 'Arquivo não encontrado ou você não tem permissão para editá-lo.');
      return res.redirect('/arquivos');
    }

    arquivo.nome = nome;
    arquivo.descricao = descricao;

    if (req.file) {

        if (arquivo.caminho) {
        const fs = require('fs');
        const path = require('path');
        const filePath = path.join(__dirname, '../public', arquivo.caminho);
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath); 
        }
      }

      arquivo.caminho = req.file.path.replace('public', '');
    }

    await arquivo.save();

    req.flash('success_msg', 'Arquivo atualizado com sucesso!');
    res.redirect('/arquivos');
  } catch (error) {
    console.error('Erro ao atualizar arquivo:', error);
    req.flash('error_msg', 'Erro ao atualizar arquivo.');
    res.redirect('/arquivos/edit/' + req.params.id);
  }
});

// Excluir arquivo
router.post('/delete/:id', async (req, res) => {
  try {
    const arquivo = await Arquivo.findByPk(req.params.id);

    if (!arquivo || arquivo.profissionalId !== req.user.profissionalId) {
      req.flash('error_msg', 'Arquivo não encontrado ou você não tem permissão para excluí-lo.');
      return res.redirect('/arquivos');
    }

    if (arquivo.caminho) {
      const fs = require('fs');
      const path = require('path');
      const filePath = path.join(__dirname, '../public', arquivo.caminho);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath); 
      }
    }

    await arquivo.destroy();

    req.flash('success_msg', 'Arquivo excluído com sucesso!');
    res.redirect('/arquivos');
  } catch (error) {
    console.error('Erro ao excluir arquivo:', error);
    req.flash('error_msg', 'Erro ao excluir arquivo.');
    res.redirect('/arquivos');
  }
});

module.exports = router;