const argon2 = require('argon2');
const Profissional = require('../models/Profissional');

(async () => {
    try {
        const novoProfissional = await Profissional.create({
            nome: 'Admin Interno2',
            email: 'adminsjj@interno.com',
            matricula: 12,
            dataAdmissao: '2024-10-09',
            cargo: 'Administrador',
            vinculo: 'Servidor',
            cpf: '000.000.000-02',
            rg: '000000000',
            dataNascimento: '1990-02-01',
            sexo: 'Masculino',
            estadoCivil: 'Solteiro',
            cep: '40240-290',
            endereco: 'Rua Exemplo 100',
            bairro: 'Centro',
            cidade: 'Cidade Exemplo',
            estado: 'SP',
            numero: '100',
            complemento: '',
            telefone: '99999999999',
            tipoTelefone: 'Celular',
            imagePath: null,
            contatoEmergenciaNome: null,
            telefoneContatoEmergencia: null,
        });

        console.log('Usuário administrador criado:', novoProfissional);
    } catch (error) {
        console.error('Erro ao criar o usuário administrador:', error);
    }
})();