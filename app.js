require('dotenv').config({ path: `.env.${process.env.NODE_ENV}` });
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
const Evento = require ( './models/Evento');
const sequelize = require('./config/database');  

// Adicionando morgan e winston para logging
const morgan = require('morgan');
const { createLogger, transports, format } = require('winston');

// Configuração do Winston para logs personalizados
const logger = createLogger({
  format: format.combine(
    format.timestamp(), // Adiciona timestamp
    format.json() // Formata os logs como JSON
  ),
  transports: [
    new transports.File({ filename: 'error.log', level: 'error' }), // Logs de erros
    new transports.File({ filename: 'combined.log' }), // Logs gerais
    new transports.Console(), // Exibe logs no console
  ],
});

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
const fluxoAtendimentosRoutes = require('./routes/fluxoAtendimentosRoutes');
const relatoriosRoutes = require('./routes/relatoriosRoutes');
const profissionalRoutes = require('./routes/profissionalRoutes');
const mensagemRoutes = require('./routes/mensagemRoutes');
const usuarioRoutes = require('./routes/usuarioRoutes');
const notificacaoRoutes = require('./routes/notificacaoRoutes');
const graficosRoutes = require('./routes/graficosRoutes');
const contatoRoutes = require('./routes/contatoRoutes');
const discussaoCasoRoutes = require('./routes/discussaoCasoRoutes');
const noticiasRoutes = require('./routes/noticiasRoutes');
const avisoRoutes = require('./routes/avisoRoutes');

const rateLimit = require('express-rate-limit');
const helmet = require('helmet');

const Usuario = require('./models/Usuario'); 
const { partials } = require('handlebars');
const app = express();
const { format: dateFnsFormat } = require('date-fns');
const { ptBR } = require('date-fns/locale');
const SequelizeStore = require('connect-session-sequelize')(session.Store);
const { checkProfissional } = require('./utils');
const http = require('http');
const server = http.createServer(app);
const { Server } = require('socket.io');
const io = new Server(server);
const handlebars = require('handlebars');
const moment = require('moment'); 

const sessionStore = new SequelizeStore({
    db: sequelize,
});

handlebars.registerHelper('eq', (a, b) => a === b);
handlebars.registerHelper('or', (a, b) => a || b);

const hbs = engine({
  defaultLayout: 'main',
  layoutsDir: path.join(__dirname, 'views', 'layouts'),
  partialsDir: [
      path.join(__dirname, 'views', 'partials'),
      path.join(__dirname, 'views', 'partials', 'public')
  ],
  helpers: {
    eq: (a, b) => a === b,
    or: (a, b) => a || b,
    ifCond: function (v1, v2, options) {
        return v1 === v2 ? options.fn(this) : options.inverse(this);
    },
    ifEquals: function (arg1, arg2, options) {
        return arg1 === arg2 ? options.fn(this) : options.inverse(this);
    },
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
        d.setDate(d.getDate() + 1); 
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
    formatDateTime2: (date) => {
      const data = new Date(date);
      return data.toLocaleString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        timeZone: 'America/Sao_Paulo'
      });
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
        return dateFnsFormat(new Date(date), "dd/MM/yyyy HH:mm", { locale: ptBR });
    },
    formatDateWith: (date) => {
      if (!date) return '';
      return moment(date).format('YYYY-MM-DDTHH:mm');
    },
    formatData: (date) => {
      if (!date) return '';
      return moment(date).format('YYYY-MM-DD');
    },
    Data: (date) => {
      if (!date) return '';
      return moment(date).format('DD/MM/YYYY');
    },
    formatHour: (date) => {
        if (!date) return '';
        return dateFnsFormat(new Date(date), "HH:mm", { locale: ptBR });
    },
    isActive: function (currentPath, expectedPath) {
        return currentPath === expectedPath ? 'active' : '';
    },
    json: function (context) {
        return JSON.stringify(context);
    },
    formatDateToInput: function (isoDate) {
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
    formatRg: (rg) => {
        if (!rg) return "";
        return rg.replace(/^(\d{2})(\d{3})(\d{3})(\d{1})$/, "$1.$2.$3-$4");
    },
    gt: function (a, b) {
        return a > b;
    },
    truncate2: function (text, length) {
      if (text.length <= length) {
        return text;
      }
      return text.substring(0, length) + '...';
    },
    toLowerCase: (str) => str ? str.toLowerCase() : '',
    toUpperCase: (str) => str ? str.toUpperCase() : '',
    and: (a, b) => a && b,
    not: (a) => !a,
    includes: (array, value) => array && array.includes(value),
    subtract: (a, b) => a - b,
    add: (a, b) => a + b,
    multiply: (a, b) => a * b,
    divide: (a, b) => a / b,
    truncate: (str, length) => {
        if (!str) return '';
        return str.length > length ? str.substring(0, length) + '...' : str;
    },
    isEven: (num) => num % 2 === 0,
    isOdd: (num) => num % 2 !== 0,
    default: (value, defaultValue) => value || defaultValue,
  },
    safeStringify: function (obj) {
      return JSON.stringify(obj || {}).replace(/</g, '\\u003c');
  },
  runtimeOptions: {
      allowProtoPropertiesByDefault: true,
      allowProtoMethodsByDefault: true
  },
});


app.use(methodOverride('_method')); 

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

// Adicionando morgan para logging de requisições HTTP
app.use(morgan('combined'));

var corsOptions = {
    origin: function (origin, callback) {
      const allowedOrigins = [
        'https://nups-summer-moon-5282.fly.dev',
        'https://nups.onrender.com',
        'http://localhost:3000',
        'http://dev.nupsweb.org',
        'http://nupsweb.org',
        'https://nupsweb.org',
        'http://dev.nupsweb.org',
        'https://dev.nupsweb.org',

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

const favicon = require('serve-favicon');

app.use(favicon(path.join(__dirname, 'public', 'IMG', 'favicon2-16x16.png')));


app.use(session({
  secret: process.env.SESSION_SECRET, // Chave secreta da sessão
  resave: false,
  saveUninitialized: false,
  store: sessionStore,
  cookie: {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production' && process.env.FORCE_HTTPS !== 'false',
    sameSite: 'strict',
    maxAge: 24 * 60 * 60 * 1000, // 24 horas
  },
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

app.use((req, res, next) => {
  if (req.user) {
    res.locals.user = req.user; // Disponibiliza o usuário logado para todas as views
    res.locals.profissionalId = req.user.profissionalId; // Inclui o profissionalId também
  }
  next();
});


app.use('/auth', authRoutes);

app.get('/auth/login',function(req, res)  {
  res.render('auth/login');
});

app.get('/Atividades',function(req, res)  {
  res.render('Atividades', {
    layout: 'public/public-layout'
  });
});

app.get('/Quadro-Modalidades',function(req, res)  {
  res.render('Quadro-Modalidades', {
    layout: 'public/public-layout'
  });
});

const eventoController = require('./controllers/eventoController');
const noticiaController = require('./controllers/noticiaController');

const { truncate } = require('./models/Ocorrencia');
const Noticias = require('./models/Noticias');

app.use('/Evento-detalhes/:id', eventoController.visualizar);
app.use('/Noticia-detalhes/:id', noticiaController.visualizar);

app.get('/eventos/busca', async (req, res) => {
  try {
    const eventos = await Evento.findAll();

    const eventosComImagem = eventos.map(evento => {
      return {
        ...evento.toJSON(), 
        imagePath: evento.imagePath ? `/uploads/images/${evento.imagePath}` : null
      };
    });

    res.json(eventosComImagem); 

  } catch (error) {
    logger.error('Erro ao buscar eventos:', error); // Logando o erro
    res.status(500).json({ error: 'Erro ao buscar eventos' });
  }
});

app.get('/noticias/busca', async (req, res) => {
  try {
    const noticia = await Noticias.findAll();

    const noticiasComImagem = noticia.map(noticia => {
      return {
        ...noticia.toJSON(), 
        imagePath: noticia.imagePath ? `/uploads/images/${noticia.imagePath}` : null
      };
    });

    res.json(noticiasComImagem);

  } catch (error) {
    logger.error('Erro ao buscar notícias:', error); // Logando o erro
    res.status(500).json({ error: 'Erro ao buscar notícias' });
  }
});

app.use('/Nups-Eventos', eventoController.visualizarEvento);
app.use('/Nups-Noticias', noticiaController.visualizarNoticia);

app.get('/Quem_Somos',function(req, res)  {
    res.render('Quem_Somos', {layout: 'public/public-layout'});
});

app.get('/', function(req, res) {
    res.render('Pagina_Inicial', {
        layout: 'public/public-layout'
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
      '/eventos',
      '/encaminhamentos',
      '/relatorios',
      '/estoque',
      '/produtos',
      '/mensagens',
      '/notificacoes',
      '/profissionais',
      '/graficos',
      '/discussoes',
      '/usuarios',
      '/Eventos-detalhes',
      '/noticias',
      '/auth/changePassword',
      '/avisos',
      '/fluxoAtendimentos',
      '/auth/changeUsername',

    ],
    'Adm': [
      '/dashboard/adm2',
      '/pacientes',
      '/escalas',
      '/atendimentos',
      '/ocorrencias',
      '/salas',
      '/reservas',
      '/eventos',
      '/encaminhamentos',
      '/relatorios',
      '/estoque',
      '/produtos',
      '/mensagens',
      '/notificacoes',
      '/profissionais',
      '/graficos',
      '/discussoes',
      '/usuarios',
      '/Eventos-detalhes',
      '/noticias',
      '/auth/changePassword',
      '/avisos',
      '/fluxoAtendimentos'
    ],

    'Gestor Adms': [
      '/dashboard/admGestor',
      '/pacientes',
      '/escalas',
      '/atendimentos',
      '/ocorrencias',
      '/salas',
      '/reservas',
      '/eventos',
      '/encaminhamentos',
      '/relatorios',
      '/estoque',
      '/produtos',
      '/mensagens',
      '/notificacoes',
      '/profissionais',
      '/graficos',
      '/discussoes',
      '/usuarios',
      '/Eventos-detalhes',
      '/noticias',
      '/auth/changePassword',
      '/avisos',
      '/fluxoAtendimentos'
    ],

    'Gestor Servico Social': [
      '/dashboard/socialGestor',
      '/pacientes',
      '/escalas',
      '/atendimentos',
      '/reservas',
      '/encaminhamentos',
      '/relatorios',
      '/estoque',
      '/mensagens',
      '/notificacoes',
      '/graficos',
      '/discussoes',
      '/Eventos-detalhes',
      '/auth/changePassword',
      '/avisos',
      '/fluxoAtendimentos',
      '/profissionais/meu_perfil/',
      '/discussoes/detalhes',
      '/discussoes/edit',
      '/discussoes/create',
      '/fluxoAtendimentos'

    ],

    'Gestor Psicologia': [
      '/dashboard/psicoGestor',
      '/pacientes',
      '/escalas',
      '/atendimentos',
      '/reservas',
      '/encaminhamentos',
      '/relatorios',
      '/estoque',
      '/mensagens',
      '/notificacoes',
      '/graficos',
      '/discussoes',
      '/Eventos-detalhes',
      '/auth/changePassword',
      '/avisos',
      '/profissionais/meu_perfil/',
      '/discussoes/detalhes',
      '/discussoes/edit',
      '/discussoes/create',
      '/fluxoAtendimentos'
    ],

    'Gestor Psiquiatria': [
      '/dashboard/psiquiGestor',
      '/pacientes',
      '/escalas',
      '/atendimentos',
      '/reservas',
      '/encaminhamentos',
      '/relatorios',
      '/estoque',
      '/mensagens',
      '/notificacoes',
      '/graficos',
      '/discussoes',
      '/Eventos-detalhes',
      '/auth/changePassword',
      '/avisos',
      '/profissionais/meu_perfil/',
      '/discussoes/detalhes',
      '/discussoes/edit',
      '/discussoes/create',
      '/fluxoAtendimentos'
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
      '/escalas',
      '/fluxoAtendimentos',
      '/auth/changePassword',
      '/avisos/do-dia',
      '/avisos/dia',
      '/reservas',
      '/graficos',
      '/discussoes/detalhes',
      '/discussoes/edit',
      '/discussoes/create',
      '/avisos/:id/marcar-visto'


    ],
    'Psicólogo': [
      '/dashboard/psico',
      '/pacientes',
      '/ajustes',
      '/atendimentos',
      '/relatorios',
      '/notificacoes',
      '/profissionais/meu_perfil/',
      '/mensagens',
      '/auth/changePassword',
      '/avisos',
      '/reservas',
      '/graficos',
      '/discussoes/detalhes',
      '/discussoes/edit',
      '/discussoes/create',
      '/encaminhamentos',
      '/escalas',


    ],

    'Psiquiatra': [
      '/dashboard/psico',
      '/pacientes',
      '/ajustes',
      '/atendimentos',
      '/relatorios',
      '/notificacoes',
      '/profissionais/meu_perfil/',
      '/mensagens',
      '/auth/changePassword',
      '/avisos/do-dia',
      '/avisos/dia',
      '/reservas',
      '/graficos',
      '/discussoes/detalhes',
      '/discussoes/edit',
      '/discussoes/create',
      '/encaminhamentos',
      '/escalas',
      '/avisos/:id/marcar-visto'


    ]
};

app.use(async (req, res, next) => {
    const publicRoutes = ['/auth/login','/auth/resert-password','/contato', '/auth/forgotPassword','/auth/reset', '/auth/forgot',
       '/auth/resetPassword', '/css/', '/favicon.ico', 'eventos/Eventos-detalhes', '/Pagina_Inicial'];
  
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
          logger.warn(`Acesso negado: ${req.user.email} tentou acessar ${req.originalUrl}`); // Logando tentativa de acesso negado
          req.flash('error_msg', 'Você não tem permissão para acessar esta página.');
          return res.redirect('/auth/login');
        }
      } catch (err) {
        logger.error('Erro ao verificar o profissional:', err); // Logando o erro
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
app.use('/encaminhamentos', encaminhamentosRoutes);
app.use('/relatorios', relatoriosRoutes);
app.use('/mensagens', mensagemRoutes);
app.use('/notificacoes', notificacaoRoutes);
app.use('/graficos', graficosRoutes);
app.use('/contato', contatoRoutes);
app.use('/profissionais', profissionalRoutes);
app.use('/discussoes', discussaoCasoRoutes);
app.use('/usuarios', usuarioRoutes);
app.use('/fluxoAtendimentos', fluxoAtendimentosRoutes);
app.use('/eventos', eventoRoutes);
app.use('/noticias', noticiasRoutes);
app.use('/auth', usuarioRoutes);
app.use('/avisos', avisoRoutes);

app.use((req, res) => {
    res.status(404).render('404'); 
});

app.use(
  helmet.contentSecurityPolicy({
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", 'trusted-cdn.com'],
      styleSrc: ["'self'", 'trusted-cdn.com'],
      imgSrc: ["'self'", 'data:', 'trusted-cdn.com'],
      fontSrc: ["'self'", 'trusted-cdn.com'],
      connectSrc: ["'self'", 'api.trusted.com'],
    },
  })
);

const domain = process.env.DOMAIN || (process.env.NODE_ENV === 'development' ? 'dev.nupsweb.org' : 'nupsweb.org');

// Middleware de tratamento de erros (DEVE SER O ÚLTIMO)
app.use((err, req, res, next) => {
    logger.error(err.stack); // Logando o erro
    res.status(500).send(process.env.NODE_ENV === 'production' ? 'Algo deu errado!' : err.stack);
});

console.log('Arquivo .env carregado:', `.env.${process.env.NODE_ENV}`);
console.log('Ambiente:', process.env.NODE_ENV);
console.log('Banco de Dados:', process.env.DB_HOST);
console.log('Chave de Sessão:', process.env.SESSION_SECRET);
console.log(`Domínio: ${domain}`);


const PORT = process.env.PORT || 3000; // Usa a porta definida no .env ou 3000 como padrão

app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT} (${process.env.NODE_ENV})`);
});

sequelize.sync({ alter: true })
  .then(() => logger.info('Tabelas sincronizadas ou alteradas'))
  .catch(err => logger.error('Erro ao sincronizar tabelas:', err));

module.exports = app;