const argon2 = require('argon2');
const Profissional = require('../models/Profissional'); // Ajuste o caminho

(async () => {
    try {
        // Verifica se o administrador já existe
        const existingAdmin = await Profissional.findOne({ where: { usuario: 'admin' } });

        if (existingAdmin) {
            console.log('Usuário administrador já existe.');
            return;
        }

        // Gera o hash da senha
        const hashedPassword = await argon2.hash('senhalima');

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
            cep: '40240290', // Forneça um CEP válido
            endereco: 'Rua Exemplo 100', // Preencha com o endereço
            bairro: 'Centro', // Preencha com o bairro
            cidade: 'Cidade Exemplo', // Preencha com a cidade
            estado: 'SP', // Preencha com a sigla do estado
            numero: '100',
            complemento: '',
            telefone: '99999999999',
            tipoTelefone: 'Celular',
            imagePath: null,
            contatoEmergenciaNome: null,
            telefoneContatoEmergencia: null,
            usuario: 'admin', // Mantenha o nome de usuário como 'admin'
            senha: hashedPassword, // Use o hash gerado
            createdAt: new Date(),
            updatedAt: new Date(),
        });

        console.log('Usuário administrador criado.');
    } catch (error) {
        console.error('Erro ao criar o usuário administrador:', error);
    }
})();
