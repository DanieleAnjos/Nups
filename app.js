require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const methodOverride = require('method-override');
const path = require('path');
const session = require('express-session');
const flash = require('connect-flash');
const { engine } = require('express-handlebars');
const cors = require('cors');
const passport = require('./config/passportConfig'); 
const argon2 = require('argon2'); 
const Profissional = require('./models/Profissional');
const sequelize = require('./config/database');  


const authRoutes = require('./routes/authRoutes');
const pacienteRoutes = require('./routes/pacienteRoutes');
const escalaRoutes = require('./routes/escalaRoutes');
const produtoRoutes = require('./routes/produtoRoutes');
const ajusteEstoqueRoutes = require('./routes/ajusteEstoqueRoutes');
const atendimentoRoutes = require('./routes/atendimentoRoutes');
const ocorrenciaRoutes = require('./routes/ocorrenciaRoutes');
const salasRoutes = require('./routes/salasRoutes');
const reservasSalaRoutes = require('./routes/reservasSalaRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const eventoRoutes = require('./routes/eventoRoutes');
const encaminhamentosRoutes = require('./routes/encaminhamentosRoutes');
const relatoriosRoutes = require('./routes/relatoriosRoutes');
const profissionalRoutes = require('./routes/profissionalRoutes');
const mensagemRoutes = require('./routes/mensagemRoutes');
const usuarioRoutes = require('./routes/usuarioRoutes');
const notificacaoRoutes = require('./routes/notificacaoRoutes');
const graficosRoutes = require('./routes/graficosRoutes');
const contatoRoutes = require('./routes/contatoRoutes');
const discussaoCasoRoutes = require('./routes/discussaoCasoRoutes');
const Usuario = require('./models/Usuario'); 
const { partials } = require('handlebars');
const app = express();
const PORT = process.env.PORT || 3000;
const { format } = require('date-fns');
const { ptBR } = require('date-fns/locale');
const SequelizeStore = require('connect-session-sequelize')(session.Store);
const { checkProfissional } = require('./utils');
const http = require('http');
const server = http.createServer(app);
const { Server } = require('socket.io');
const io = new Server(server);

const sessionStore = new SequelizeStore({
    db: sequelize,
});

const hbs = engine({
    defaultLayout: 'main',
    layoutsDir: path.join(__dirname, 'views', 'layouts'),
    partialsDir: [
        path.join(__dirname, 'views', 'partials'),
        path.join(__dirname, 'views', 'partials', 'public')
    ],
    helpers: {
        eq: (a, b) => a === b,
        ifCond: (v1, v2, options) => (v1 === v2 ? options.fn(this) : options.inverse(this)),
        ifEquals: (arg1, arg2, options) => (arg1 === arg2 ? options.fn(this) : options.inverse(this)),

        formatDate: (date) => {
            if (!date) return '';
            const d = new Date(date);
            const year = d.getFullYear();
            const month = String(d.getMonth() + 1).padStart(2, '0');
            const day = String(d.getDate()).padStart(2, '0');
            return `${day}/${month}/${year}`;
        },

        OneDate: (date) => {
          if (!date) return '';
          const d = new Date(date);
          d.setDate(d.getDate() + 1); // Adiciona um dia
          const year = d.getFullYear();
          const month = String(d.getMonth() + 1).padStart(2, '0');
          const day = String(d.getDate()).padStart(2, '0');
          return `${day}/${month}/${year}`;
      },

        formatDateTime: (date) => {
            if (!date) return '';
            const d = new Date(date);
            const year = d.getFullYear();
            const month = String(d.getMonth() + 1).padStart(2, '0');
            const day = String(d.getDate()).padStart(2, '0');
            const hours = String(d.getHours()).padStart(2, '0');
            const minutes = String(d.getMinutes()).padStart(2, '0');
            return `${day}/${month}/${year} ${hours}:${minutes}`;
        },

        formatTime: (date) => {
            if (!date) return '';
            const d = new Date(date);
            const hours = String(d.getHours()).padStart(2, '0');
            const minutes = String(d.getMinutes()).padStart(2, '0');
            return ` ${hours}:${minutes}`;
        },

        formatDateWithFns: (date) => {
            if (!date) return '';
            return format(new Date(date), "dd/MM/yyyy HH:mm", { locale: ptBR });
        },

        formatHour : (date) => {
          if (!date) return '';
          return format(new Date(date), "HH:mm", { locale: ptBR });
        },

        isActive: function(currentPath, expectedPath) {
            return currentPath === expectedPath ? 'active' : '';
        },

        json: function(context) {
            return JSON.stringify(context);
        },

        formatDateToInput : function (isoDate) {
          if (!isoDate) return '';
          const date = new Date(isoDate);
          const year = date.getFullYear();
          const month = String(date.getMonth() + 1).padStart(2, '0');
          const day = String(date.getDate()).padStart(2, '0');
          return `${year}-${month}-${day}`;
      },

      formatCPF: (cpf) => {
        if (!cpf) return "";
        return cpf.replace(/^(\d{3})(\d{3})(\d{3})(\d{2})$/, "$1.$2.$3-$4");
      },
      formatTelefone: (telefone) => {
        if (!telefone) return "";
        return telefone.replace(/^(\d{2})(\d{5})(\d{4})$/, "($1) $2-$3");
      },
      formatTelefoneContato: (telefoneContato) => {
        if (!telefoneContato) return "";
        return telefoneContato.replace(/^(\d{2})(\d{4})(\d{4})$/, "($1) $2-$3");
      },
      formatCEP: (cep) => {
        if (!cep) return "";
        return cep.replace(/^(\d{5})(\d{3})$/, "$1-$2");
      },

      formatRg : (rg) => {
        if (!rg) return "";
        return rg.replace(/^(\d{2})(\d{3})(\d{3})(\d{1})$/, "$1.$2.$3-$4");
      },
    },
    runtimeOptions: {
        allowProtoPropertiesByDefault: true,
        allowProtoMethodsByDefault: true
    }
});




app.engine('handlebars', hbs);
app.set('view engine', 'handlebars');
app.set('views', path.join(__dirname, 'views'));
app.use('/uploads', express.static(path.join(__dirname, 'uploads'), {
    maxAge: '30d', 
    setHeaders: function (res, path) {
        if (path.endsWith('.js') || path.endsWith('.css')) {
            res.setHeader('Cache-Control', 'public, max-age=31536000'); 
        }
    }
}));

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(methodOverride('_method'));
app.use(express.static(path.join(__dirname, 'public')));
app.use(cors());
app.set('trust proxy', 1);



var corsOptions = {
    origin: function (origin, callback) {
      const allowedOrigins = [
        'https://nups-summer-moon-5282.fly.dev',
        'https://nups.onrender.com',
        'http://localhost:3000'
      ];
      
      if (allowedOrigins.indexOf(origin) !== -1 || !origin) {
        callback(null, true);
      } else {
        callback(new Error('Não permitido por CORS'));
      }
    },
    optionsSuccessStatus: 200 
  };
  

app.use(cors(corsOptions));

app.use(flash());

app.use(session({
    secret: 'secret_key',
    resave: false,
    //store: sessionStore, // Add this line
    saveUninitialized: false, 
    cookie: { httpOnly: true, secure: process.env.NODE_ENV === 'production' }
}));


sessionStore.sync();


app.use(passport.initialize());
app.use(passport.session());

app.use((req, res, next) => {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.removeHeader('x-powered-by'); 
    next();
});

app.use((req, res, next) => {
    res.locals.success_msg = req.flash('success_msg');
    res.locals.error_msg = req.flash('error_msg');
    if (req.user && req.user.cargo) {
        res.locals.cargo = req.user.cargo; 
    }
    next();
});


app.use('/auth', authRoutes);

app.get('/auth/login',function(req, res)  {
  res.render('auth/login');
});

app.use('/auth', usuarioRoutes);


app.get('/NupsNews',function(req, res)  {
    res.render('NupsNews', { layout: 'public/public-layout'} );
});

app.get('/Eventos',function(req, res)  {
    res.render('Eventos', {layout: 'public/public-layout'});
});
app.get('/Quem_Somos',function(req, res)  {
    res.render('Quem_Somos', {layout: 'public/public-layout'});
});

app.get('/', function(req, res) {
    const { error_msg, success_msg } = req.query; 
    
    res.render('Pagina_Inicial', {
        layout: 'public/public-layout',
        error_msg: error_msg || null,  
        success_msg: success_msg || null 
    });
});



const accessControl = {
    'Administrador': [
      '/dashboard/adm',
      '/pacientes',
      '/escalas',
      '/fornecedores',
      '/ajustes',
      '/atendimentos',
      '/ocorrencias',
      '/salas',
      '/reservas',
      '/dashboard',
      '/eventos2',
      '/encaminhamentos',
      '/relatorios',
      '/estoque',
      '/produtos',
      '/mensagens',
      '/notificacoes',
      '/profissionais',
      '/graficos',
      '/discussoes',

    ],
    'Assistente social': [
      '/dashboard/assistente-social',
      '/pacientes',
      '/ajustes',
      '/atendimentos',
      '/notificacoes',
      '/mensagens',
      '/profissionais/meu_perfil/',
      '/encaminhamentos',
      '/escalas'

    ],
    'Psicólogo': [
      '/dashboard/psicologo-psiquiatra',
      '/pacientes',
      '/ajustes',
      '/atendimentos',
      '/relatorios'
    ],
    'Psiquiatra': [
      '/dashboard/psicologo-psiquiatra',
      '/pacientes',
      '/ajustes',
      '/atendimentos',
      '/relatorios'
    ]
  };
  
  app.use(async (req, res, next) => {
    const publicRoutes = ['/auth/login', '/auth/register', '/css/', '/favicon.ico'];
  
    if (publicRoutes.some(route => req.originalUrl.startsWith(route))) {
      return next();
    }
  
    if (req.isAuthenticated()) {
      try {
        const profissional = await checkProfissional(req.user); 
  
        const cargo = profissional.cargo;
        const permittedRoutes = accessControl[cargo];
  
        if (permittedRoutes && permittedRoutes.some(route => req.originalUrl.startsWith(route))) {
          return next();
        } else {
          console.log('Acesso negado: Você não tem permissão para acessar esta página');
          req.flash('error_msg', 'Você não tem permissão para acessar esta página.');
          return res.redirect('/auth/login');
        }
      } catch (err) {
        console.error('Erro ao verificar o profissional:', err);
        req.flash('error_msg', 'Erro ao verificar as permissões do profissional.');
        return res.redirect('/');
      }
    }
  
    req.flash('error_msg', 'Você precisa estar logado para acessar essa página.');
    res.redirect('/auth/login');
  });
  


app.use('/pacientes', pacienteRoutes);
app.use('/escalas', escalaRoutes);
app.use('/produtos', produtoRoutes);
app.use('/ajustes', ajusteEstoqueRoutes);
app.use('/atendimentos', atendimentoRoutes);
app.use('/ocorrencias', ocorrenciaRoutes);
app.use('/salas', salasRoutes);
app.use('/reservas', reservasSalaRoutes);
app.use('/dashboard', dashboardRoutes);
app.use('/eventos2', eventoRoutes);
app.use('/encaminhamentos', encaminhamentosRoutes);
app.use('/relatorios', relatoriosRoutes);
app.use('/mensagens', mensagemRoutes);
app.use('/notificacoes', notificacaoRoutes);
app.use('/graficos', graficosRoutes);
app.use('/contato', contatoRoutes);
app.use('/profissionais', profissionalRoutes);
app.use('/discussoes', discussaoCasoRoutes);



app.use((req, res) => {
    res.status(404).render('404'); 
});

app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send(process.env.NODE_ENV === 'production' ? 'Algo deu errado!' : err.stack);
});


app.listen(PORT, () => {
    console.log(`Servidor rodando na porta http://localhost:${PORT}`);
});

sequelize.sync({ alter: true });


sequelize.sync()
  .then(() => console.log('Tabelas sincronizadas ou alteradas'))
  .catch(err => console.error('Erro ao sincronizar tabelas:', err));

  module.exports = app;
