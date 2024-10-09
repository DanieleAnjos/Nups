const express = require('express');
const bcrypt = require('bcryptjs');
const { Sequelize, DataTypes } = require('sequelize');

const sequelize = new Sequelize('nups_db', 'root', '1234', {
    host: 'localhost',
    dialect: 'mysql',
});

const Profissional = sequelize.define('Profissional', {
    usuario: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    senha: {
        type: DataTypes.STRING,
        allowNull: false,
    },
});

(async () => {
    await sequelize.sync();
    // Crie um usuário para teste
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('senha1212', salt);
    await Profissional.create({
        usuario: 'admin',
        senha: hashedPassword,
    });
})();

const app = express();
app.use(express.json());

app.post('/auth/login', async (req, res) => {
    const { usuario, senha } = req.body;
    const profissional = await Profissional.findOne({ where: { usuario } });

    if (!profissional) {
        return res.status(404).send('Usuário não encontrado');
    }

    const isPasswordValid = await bcrypt.compare(senha, profissional.senha);

    if (!isPasswordValid) {
        return res.status(401).send('Senha incorreta');
    }

    res.send('Login realizado com sucesso');
});

app.listen(3000, () => {
    console.log('Servidor rodando na porta 3000');
});
