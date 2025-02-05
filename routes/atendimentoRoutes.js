const express = require('express');
const router = express.Router();
const Atendimento = require('../models/Atendimento');
const atendimentoController = require('../controllers/atendimentoController');

router.get('/', atendimentoController.index);
router.get('/atendimentos/:matricula', async (req, res) => {
    const { matricula } = req.params;
    try {
        const atendimento = await Atendimento.findOne({ where: { matricula } });
        if (atendimento) {
            res.json(atendimento);
        } else {
            res.status(404).json({ message: 'Paciente não encontrado' });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Erro ao buscar paciente' });
    }
});
router.get('/create', atendimentoController.create);
router.post('/', atendimentoController.store);
router.get('/:id/edit', atendimentoController.edit);
router.put('/:id', atendimentoController.update);
router.delete('/:id', atendimentoController.destroy);
router.get('/dashboard', atendimentoController.dash);
router.get('/:id', atendimentoController.show);
router.get("/buscarPaciente", atendimentoController.buscarPaciente);
//router.get('/', atendimentoController.stats);



module.exports = router;
