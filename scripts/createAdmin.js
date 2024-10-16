const argon2 = require('argon2');
const Profissional = require('../models/Profissional');
const sequelize = require('../config/database');

(async () => {
    try {
        await sequelize.authenticate();
        console.log('Conexão estabelecida com sucesso.');

        // Sincroniza os modelos
        await sequelize.sync();
        console.log('Modelos sincronizados com sucesso.');

        // Verifica se o administrador já existe
        const existingAdmin = await Profissional.findOne({ where: { usuario: 'admin' } });
        if (existingAdmin) {
            console.log('Usuário administrador já existe.');
            return;
        }

        // Gera o hash da senha
        const hashedPassword = await argon2.hash('123');

        // Cria o usuário administrador
        await Profissional.create({
            nome: 'Admin Interno',
            email: 'admin@interno.com',
            matricula: 1,
            dataAdmissao: '2024-10-09',
            cargo: 'Administrador',
            vinculo: 'Servidor',
            cpf: '00000000000',
            dataNascimento: '1990-02-01',
            sexo: 'Masculino',
            estadoCivil: 'Solteiro',
            cep: '40240290',
            endereco: 'Rua Exemplo 100',
            bairro: 'Centro',
            cidade: 'Cidade Exemplo',
            estado: 'SP',
            numero: '100',
            complemento: '',
            telefone: '99999999999',
            tipoTelefone: 'Celular',
            usuario: 'admin',
            senha: hashedPassword,
            createdAt: new Date(),
            updatedAt: new Date(),
        });

        console.log('Usuário administrador criado.');
    } catch (error) {
        console.error('Erro ao criar o usuário administrador:', error);
    }
})(); 