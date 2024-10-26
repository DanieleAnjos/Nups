require('dotenv').config(); 
const sequelize = require('../config/database'); 
const Usuario = require('../models/Usuario'); 
const argon2 = require('argon2');
const { Profissional } = require('../models/Profissional'); 

const createUser = async (usuario, senha, profissionalId) => {
    try {

        await sequelize.authenticate();
        console.log('Conexão com o banco de dados estabelecida.');

        const hashedPassword = await argon2.hash(senha);
        
        const newUser = await Usuario.create({
            usuario,
            senha: hashedPassword,
            profissionalId
        });

        console.log(`Usuário ${newUser.usuario} criado com sucesso!`);
    } catch (error) {
        console.error('Erro ao criar usuário:', error);
    } finally {
        await sequelize.close();
        console.log('Conexão com o banco de dados encerrada.');
    }
};

const usuario = 'admin'; 
const senha = 'Senhalima12.'; 
const profissionalId = 1; 

createUser(usuario, senha, profissionalId);
