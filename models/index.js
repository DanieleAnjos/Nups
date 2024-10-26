const Evento = require('./Evento');
const Imagem = require('./Imagem');

Evento.hasMany(Imagem, { foreignKey: 'eventoId', as: 'imagens' });
Imagem.belongsTo(Evento, { foreignKey: 'eventoId' });

module.exports = {
    Evento,
    Imagem,
};
