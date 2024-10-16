const Profissional = require('../models/Profissional');
const argon2 = require('argon2');

exports.registerAdmin = async (req, res) => {
  try {
    const existingAdmin = await Profissional.findOne({ where: { usuario: 'admin' } });
    if (existingAdmin) {
      return res.status(400).send('Usuário administrador já existe.');
    }
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
    });
    res.status(201).send('Usuário administrador criado.');
  } catch (error) {
    res.status(500).send('Erro ao criar o usuário administrador: ' + error.message);
  }
};

exports.login = (req, res, next) => {
  passport.authenticate('local', { 
    successRedirect: '/perfil', 
    failureRedirect: '/login', 
    failureFlash: true 
  })(req, res, next);
};

exports.logout = (req, res) => {
  req.logout((err) => {
    if (err) { return next(err); }
    res.redirect('/');
  });
};

exports.ensureAuthenticated = (req, res, next) => {
  console.log('Autenticação autorizada para a rota: ', req.originalUrl);

  if (req.isAuthenticated()) {
    console.log('Usuário autenticado');
    return next();
  }
  console.log('Usuário não autenticado, redirecionando de volta')
  res.redirect('/auth/login');
};