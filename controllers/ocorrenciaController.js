const puppeteer = require('puppeteer');
const { Op } = require('sequelize');
const Ocorrencia = require('../models/Ocorrencia');
const Profissional = require('../models/Profissional');
const fs = require('fs');
const xlsx = require('xlsx'); 


const ocorrenciaController = {
  index: async (req, res) => {
    
    const { data, profissional } = req.query;
    const where = {};
    
    if (data) {
      where.data = data;
    }
    
    try {
      const ocorrencias = await Ocorrencia.findAll({
        where,
        include: [{
          model: Profissional,
          as: 'profissional',
          where: profissional ? { nome: { [Op.like]: `%${profissional}%` } } : undefined
        }],
        order: [['data', 'DESC']]  
      });
    
      // Aqui, você pode filtrar para garantir que apenas o administrador ou o profissional que criou a ocorrência
      // pode editar ou remover.
      const ocorrenciasData = ocorrencias.map(ocorrencia => {
        const ocorrenciaPlain = ocorrencia.get({ plain: true });
        // Adicionando a permissão para editar/remover
        ocorrenciaPlain.canEdit = req.profissional.id === ocorrenciaPlain.profissionalId || req.profissional.cargo === 'Administrador';
        return ocorrenciaPlain;
      });
    
      const profissionais = await Profissional.findAll();
    
      res.render('ocorrencias/index', {
        ocorrencias: ocorrenciasData,
        profissionais,
        query: req.query
      });
    } catch (error) {
      console.error('Erro ao listar ocorrências:', error);
      req.flash('error_msg', 'Erro ao listar ocorrências.');
      res.redirect('/ocorrencias');
    }
    
  },
  


  create: async (req, res) => {
    try {
      if (!req.user) {
        req.flash('error_msg', 'Usuário não autenticado.');
        return res.redirect('/login');
      }
  
      const profissionalId = req.user.profissionalId;
      console.log('ID do profissional logado:', req.user.profissionalId);
  
      return res.render('ocorrencias/create', {
        profissionalId, 
      });
    } catch (error) {
      console.error('Erro ao carregar o formulário:', error);
      req.flash('error_msg', 'Erro ao carregar o formulário de ocorrências.');
      return res.redirect('/ocorrencias');
    }
  },

  store: async (req, res) => {
    try {
      const { data, relatorio, horarioChegada, horarioSaida, profissionalId } = req.body;
  
      // Validação dos campos obrigatórios
      if (!data || !relatorio || !horarioChegada || !profissionalId) {
        req.flash('error_msg', 'Todos os campos obrigatórios devem ser preenchidos.');
        return res.redirect('back');
      }
  
      const chegada = new Date(`${data}T${horarioChegada}`);
      const saida = horarioSaida ? new Date(`${data}T${horarioSaida}`) : null;
  
      // Validação do horário de saída
      if (saida && saida <= chegada) {
        req.flash('error_msg', 'O horário de saída deve ser posterior ao horário de chegada.');
        return res.redirect('back');
      }
  
      // Verifica se há outra ocorrência que se sobreponha ao novo horário
      const ocorrenciaExistente = await Ocorrencia.findOne({
        where: {
          profissionalId,
          data,
        }
      });
  
      if (ocorrenciaExistente) {
        const ocorrenciaExistenteChegada = new Date(`${ocorrenciaExistente.data}T${ocorrenciaExistente.horarioChegada}`);
        const ocorrenciaExistenteSaida = ocorrenciaExistente.horarioSaida ? new Date(`${ocorrenciaExistente.data}T${ocorrenciaExistente.horarioSaida}`) : null;
  
        // Verifica se os horários se sobrepõem
        if (
          (chegada < ocorrenciaExistenteSaida && chegada >= ocorrenciaExistenteChegada) || // Se o novo horário de chegada está dentro do intervalo existente
          (saida && saida > ocorrenciaExistenteChegada && saida <= ocorrenciaExistenteSaida) || // Se o novo horário de saída está dentro do intervalo existente
          (chegada <= ocorrenciaExistenteChegada && (!saida || (saida >= ocorrenciaExistenteSaida))) // Se o novo horário cobre o intervalo existente
        ) {
          req.flash('error_msg', 'Já existe uma ocorrência cadastrada neste horário para este profissional.');
          return res.redirect('back');
        }
      }
  
      // Cria a nova ocorrência
      await Ocorrencia.create({
        data,
        relatorio,
        horarioChegada,
        horarioSaida,
        profissionalId
      });
  
      req.flash('success_msg', 'Ocorrência criada com sucesso.');
      res.redirect(`/ocorrencias`);
    } catch (error) {
      console.error("Erro ao criar ocorrência:", error);
      req.flash('error_msg', 'Erro ao criar ocorrência. Tente novamente.');
      return res.redirect('back');
    }
  },
  
  

  show: async (req, res) => {
    try {
      const ocorrencia = await Ocorrencia.findByPk(req.params.id, {
        include: [{ model: Profissional, as: 'profissional' }]
      });

      if (!ocorrencia) {
        return res.status(404).send("Ocorrência não encontrada.");
      }

      res.render('ocorrencias/detalhes', { ocorrencia: ocorrencia.get({ plain: true }) });
    } catch (error) {
      console.error('Erro ao buscar detalhes da ocorrência:', error);
      req.flash('error_msg', 'Erro ao buscar detalhes da ocorrência.');
      res.redirect('/ocorrencias');
    }
  },

  edit: async (req, res) => {
    try {
      const ocorrencia = await Ocorrencia.findByPk(req.params.id);

      if (!ocorrencia) {
        return res.status(404).send("Ocorrência não encontrada.");
      }

      const profissionais = await Profissional.findAll();
      res.render('ocorrencias/edit', { ocorrencia, profissionais });
    } catch (error) {
      console.error(error);
      res.status(500).send("Erro ao buscar ocorrência para edição.");
    }
  },

  update: async (req, res) => {
    try {
      const ocorrencia = await Ocorrencia.findByPk(req.params.id);
  
      if (!ocorrencia) {
        return res.status(404).send("Ocorrência não encontrada.");
      }
  
      const { data, relatorio, horarioChegada, horarioSaida, profissionalId } = req.body;
  
      // Validação dos campos obrigatórios
      if (!data || !relatorio || !horarioChegada || !profissionalId) {
        req.flash('error_msg', 'Todos os campos obrigatórios devem ser preenchidos.');
        return res.redirect('back');
      }
  
      const chegada = new Date(`${data}T${horarioChegada}`);
      const saida = horarioSaida ? new Date(`${data}T${horarioSaida}`) : null;
  
      // Validação do horário de saída
      if (saida && saida <= chegada) {
        req.flash('error_msg', 'O horário de saída deve ser posterior ao horário de chegada.');
        return res.redirect('back');
      }
  
      // Verifica se há outra ocorrência que se sobreponha ao novo horário
      const ocorrenciaExistente = await Ocorrencia.findOne({
        where: {
          profissionalId,
          data,
          id: { [Op.ne]: req.params.id } // Exclui a ocorrência atual da verificação
        }
      });
  
      if (ocorrenciaExistente) {
        const ocorrenciaExistenteChegada = new Date(`${ocorrenciaExistente.data}T${ocorrenciaExistente.horarioChegada}`);
        const ocorrenciaExistenteSaida = ocorrenciaExistente.horarioSaida ? new Date(`${ocorrenciaExistente.data}T${ocorrenciaExistente.horarioSaida}`) : null;
  
        // Verifica se os horários se sobrepõem
        if (
          (chegada < ocorrenciaExistenteSaida && chegada >= ocorrenciaExistenteChegada) || // Se o novo horário de chegada está dentro do intervalo existente
          (saida && saida > ocorrenciaExistenteChegada && saida <= ocorrenciaExistenteSaida) || // Se o novo horário de saída está dentro do intervalo existente
          (chegada <= ocorrenciaExistenteChegada && (!saida || (saida >= ocorrenciaExistenteSaida))) // Se o novo horário cobre o intervalo existente
        ) {
          req.flash('error_msg', 'Já existe uma ocorrência cadastrada neste horário para este profissional.');
          return res.redirect('back');
        }
      }
  
      // Atualiza a ocorrência
      await Ocorrencia.update({ data, relatorio, horarioChegada, horarioSaida, profissionalId }, {
        where: { id: req.params.id }
      });
  
      req.flash('success_msg', 'Ocorrência atualizada com sucesso.');
      res.redirect('/ocorrencias');
    } catch (error) {
      console.error(error);
      req.flash('error_msg', 'Erro ao atualizar ocorrência.');
      res.redirect('/ocorrencias');
    }
  },
  
  

  destroy: async (req, res) => {
    try {
      const ocorrencia = await Ocorrencia.findByPk(req.params.id);

      if (!ocorrencia) {
        return res.status(404).send("Ocorrência não encontrada.");
      }

      await Ocorrencia.destroy({ where: { id: req.params.id } });
      req.flash('success_msg', 'Ocorrência excluída com sucesso.');
      res.redirect('/ocorrencias');
    } catch (error) {
      console.error(error);
      req.flash('error_msg', 'Erro ao excluir ocorrência.');
      res.redirect('/ocorrencias');
    }
  },

  generateOcorrenciaReport: async (req, res) => {
    try {
      const { dataInicio, dataFim, profissional } = req.query;
      const where = {};

      if (dataInicio && dataFim) {
        where.data = { [Op.between]: [new Date(dataInicio), new Date(dataFim)] };
      } else if (dataInicio) {
        where.data = { [Op.gte]: new Date(dataInicio) };
      } else if (dataFim) {
        where.data = { [Op.lte]: new Date(dataFim) };
      }

      if (profissional) {
        where.profissionalId = profissional;
      }

      const ocorrencias = await Ocorrencia.findAll({
        where,
        include: [{ model: Profissional, as: 'profissional' }],
      });

      if (ocorrencias.length === 0) {
        return res.status(404).send('Nenhuma ocorrência encontrada para os filtros aplicados.');
      }

      let htmlContent = '<h1>Relatório de Ocorrências</h1><table border="1" cellpadding="5" cellspacing="0"><thead><tr><th>Data</th><th>Descrição</th><th>Profissional</th></tr></thead><tbody>';
      ocorrencias.forEach(ocorrencia => {
        const dataFormatada = new Date(ocorrencia.data).toLocaleDateString();
        htmlContent += `<tr><td>${dataFormatada}</td><td>${ocorrencia.relatorio}</td><td>${ocorrencia.profissional ? ocorrencia.profissional.nome : 'Profissional não encontrado'}</td></tr>`; // Usando "relatorio"
      });
      htmlContent += '</tbody></table>';

      const browser = await puppeteer.launch({ headless: true });
      const page = await browser.newPage();
      await page.setContent(htmlContent);

      const pdfBuffer = await page.pdf({ format: 'A4', printBackground: true });
      await browser.close();

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', 'attachment; filename=relatorio_ocorrencias.pdf');
      res.end(pdfBuffer);
    } catch (error) {
      console.error('Erro ao gerar o relatório em PDF:', error);
      res.status(500).send('Erro ao gerar o relatório. Tente novamente mais tarde.');
    }
  },

  generateOcorrenciaReportExcel: async (req, res) => {
    try {
      const { dataInicio, dataFim, profissional } = req.query;
      const where = {};

      if (dataInicio && dataFim) {
        where.data = { [Op.between]: [new Date(dataInicio), new Date(dataFim)] };
      } else if (dataInicio) {
        where.data = { [Op.gte]: new Date(dataInicio) };
      } else if (dataFim) {
        where.data = { [Op.lte]: new Date(dataFim) };
      }

      if (profissional) {
        where.profissionalId = profissional;
      }

      const ocorrencias = await Ocorrencia.findAll({
        where,
        include: [{ model: Profissional, as: 'profissional' }],
      });

      if (ocorrencias.length === 0) {
        return res.status(404).send('Nenhuma ocorrência encontrada para os filtros aplicados.');
      }

      const dataForExcel = ocorrencias.map(ocorrencia => {
        const dataFormatada = new Date(ocorrencia.data).toLocaleDateString();
        return {
          Data: dataFormatada,
          Descricao: ocorrencia.relatorio, 
          Profissional: ocorrencia.profissional ? ocorrencia.profissional.nome : 'Profissional não encontrado',
        };
      });

      const wb = xlsx.utils.book_new();
      const ws = xlsx.utils.json_to_sheet(dataForExcel);
      xlsx.utils.book_append_sheet(wb, ws, 'Ocorrências');

      const excelBuffer = xlsx.write(wb, { bookType: 'xlsx', type: 'buffer' });

      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', 'attachment; filename=relatorio_ocorrencias.xlsx');
      res.end(excelBuffer);
    } catch (error) {
      console.error('Erro ao gerar o relatório em Excel:', error);
      res.status(500).send('Erro ao gerar o relatório. Tente novamente mais tarde.');
    }
  }
};

module.exports = ocorrenciaController;
