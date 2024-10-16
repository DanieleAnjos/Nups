// const LocalStrategy = require('passport-local').Strategy;
// const bcrypt = require('bcryptjs');
// const { Profissional } = require('../models/Profissional');

// module.exports = function(passport) {
//   passport.use(new LocalStrategy({ usernameField: 'email' }, async (email, password, done) => {
//     try {
//       const profissional = await Profissional.findOne({ where: { email } });
//       if (!profissional) {
//         return done(null, false, { message: 'Este e-mail não está registrado' });
//       }

//       // Log para verificar o hash armazenado e a senha fornecida
//       console.log('Senha fornecida pelo usuário:', password);
//       console.log('Hash armazenado:', profissional.senha);
      
//       // Verifica a senha
//       const isMatch = await bcrypt.compare(password, profissional.senha);
//       console.log('A senha está correta?', isMatch); // Log do resultado da comparação
      
//       if (isMatch) {
//         return done(null, profissional);
//       } else {
//         return done(null, false, { message: 'Senha incorreta' });
//       }
//     } catch (err) {
//       console.error(err);
//       return done(err);
//     }
//   }));

//   passport.serializeUser((profissional, done) => {
//     done(null, profissional.id);
//   });

//   passport.deserializeUser(async (id, done) => {
//     try {
//       const profissional = await Profissional.findByPk(id);
//       done(null, profissional);
//     } catch (err) {
//       done(err);
//     }
//   });
// };
