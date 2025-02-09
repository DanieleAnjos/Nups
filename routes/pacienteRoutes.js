const express = require('express');
const router = express.Router();
const pacienteController = require('../controllers/pacienteController');
const Documento = require('../models/Documento');
const fs = require('fs');
const path = require('path');
const Paciente = require('../models/Paciente');
const multer = require('multer');


router.get('/', pacienteController.index);
router.get('/lista', pacienteController.index2);
router.get('/perfil/:id', pacienteController.perfil);
router.get('/create', pacienteController.create);
router.post('/', pacienteController.store);
router.get('/:id/edit', pacienteController.edit);
router.put('/:id', pacienteController.update);
router.delete('/:id', pacienteController.delete);

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/documents'); // Diretório para armazenar os arquivos
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname)); // Nome único para o arquivo
    }
});

const upload = multer({ storage });

// Rota para upload do documento
router.post('/:id/upload-documento', upload.single('documento'), async (req, res) => {
    try {
        const paciente = await Paciente.findByPk(req.params.id);
        if (!paciente) {
            return res.status(404).json({ message: 'Paciente não encontrado.' });
        }

        if (!req.file) {
            req.flash('error_msg', 'Nenhum arquivo foi enviado.');
            return res.redirect(`/pacientes/perfil/${paciente.id}`);
        }

        // Salva o documento no banco de dados
        await Documento.create({
            nome: req.file.originalname,
            caminho: req.file.filename,
            pacienteId: paciente.id,
        });

        req.flash('success_msg', 'Documento carregado com sucesso!');
        res.redirect(`/pacientes/perfil/${paciente.id}`);
    } catch (error) {
        console.error('Erro ao carregar documento:', error);
        req.flash('error_msg', 'Erro ao carregar documento.');
        res.redirect(`/pacientes/perfil/${req.params.id}`);
    }
});

router.delete('/:id/delete-documento/:documentoId', async (req, res) => {
    try {
        console.log('Iniciando exclusão do documento:', req.params.documentoId);

        // Busca o documento no banco de dados
        const documento = await Documento.findByPk(req.params.documentoId);
        if (!documento) {
            console.error('Documento não encontrado com ID:', req.params.documentoId);
            return res.status(404).json({ message: 'Documento não encontrado.' });
        }

        // Define o caminho do arquivo
        const filePath = path.join(__dirname, '../uploads/', documento.caminho);
        console.log('Caminho do arquivo:', filePath);

        // Verifica se o arquivo existe e tenta deletá-lo
        if (fs.existsSync(filePath)) {
            console.log('Arquivo encontrado, excluindo...');
            await fs.promises.unlink(filePath); // Usando unlink assíncrono
            console.log('Arquivo excluído com sucesso.');
        } else {
            console.warn('Arquivo não encontrado:', filePath);
        }

        // Exclui o registro no banco de dados
        await documento.destroy();
        console.log('Documento excluído com sucesso.');

        // Retorna uma resposta de sucesso
        res.json({ success: true, message: 'Documento excluído com sucesso.' });
    } catch (error) {
        console.error('Erro ao excluir documento:', error);
        res.status(500).json({ success: false, message: 'Erro ao excluir documento: ' + error.message });
    }
});

module.exports = router;