// utils.js
const Profissional = require('./models/Profissional');

async function checkProfissional(usuario) {
  if (!usuario || !usuario.profissionalId) {
    console.log('Usuário ou profissionalId não encontrado');
    throw new Error('Usuário ou profissional não encontrado');
  }

  const profissional = await Profissional.findByPk(usuario.profissionalId);
  if (!profissional) {
    console.log('Profissional não encontrado');
    throw new Error('Profissional não encontrado');
  }

  return profissional;
}

module.exports = { checkProfissional };