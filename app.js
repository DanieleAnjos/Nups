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
const sequelize = require('./config/database');  // Supondo que você tenha a instância do sequelize configurada


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
const atendimentos2Routes = require('./routes/atendimentos2Routes');
const usuarioRoutes = require('./routes/usuarioRoutes');
const notificacaoRoutes = require('./routes/notificacaoRoutes');
const graficosRoutes = require('./routes/graficosRoutes');
const contatoRoutes = require('./routes/contatoRoutes');
 


const Usuario = require('./models/Usuario'); 
const { partials } = require('handlebars');
const app = express();
const PORT = process.env.PORT || 3002;
const { format } = require('date-fns');
const { ptBR } = require('date-fns/locale');

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

        formatDateWithFns: (date) => {
            if (!date) return '';
            return format(new Date(date), "dd/MM/yyyy HH:mm", { locale: ptBR });
        },

        isActive: function(currentPath, expectedPath) {
            return currentPath === expectedPath ? 'active' : '';
        },

        json: function(context) {
            return JSON.stringify(context);
        }
    },
    runtimeOptions: {
        allowProtoPropertiesByDefault: true,
        allowProtoMethodsByDefault: true
    }
});




app.engine('handlebars', hbs);
app.set('view engine', 'handlebars');
app.set('views', path.join(__dirname, 'views'));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(methodOverride('_method'));
app.use(express.static(path.join(__dirname, 'public')));
app.use(cors());
app.use(flash());

app.use(session({
    secret: 'secret_key',
    resave: false,
    saveUninitialized: false,
    cookie: { httpOnly: true, secure: process.env.NODE_ENV === 'production' }
}));

app.use(passport.initialize());
app.use(passport.session());

app.use((req, res, next) => {
    res.locals.success_msg = req.flash('success_msg');
    res.locals.error_msg = req.flash('error_msg');
    if (req.user && req.user.cargo) {
        res.locals.cargo = req.user.cargo; 
    }
    next();
});


app.use('/auth', authRoutes);

app.get('/', (req, res) => {
    res.redirect('/auth/login');
});

app.get('/NupsNews',function(req, res)  {
    res.render('NupsNews', { layout: 'public/public-layout'} );
});

app.get('/Eventos',function(req, res)  {
    res.render('Eventos', {layout: 'public/public-layout'});
});
app.get('/Quem_Somos',function(req, res)  {
    res.render('Quem_Somos', {layout: 'public/public-layout'});
});

app.get('/Pagina_Inicial', function(req, res) {
    const { error_msg, success_msg } = req.query; // Captura as mensagens na query string
    
    // Passa as mensagens para o template Handlebars
    res.render('Pagina_Inicial', {
        layout: 'public/public-layout',
        error_msg: error_msg || null,  // Se não houver mensagem de erro, passa null
        success_msg: success_msg || null // Se não houver mensagem de sucesso, passa null
    });
});

app.use('/contato', contatoRoutes);


app.use(async (req, res, next) => {
    const publicRoutes = ['/auth/login', '/auth/register', '/css/', '/favicon.ico'];

    if (publicRoutes.some(route => req.originalUrl.startsWith(route))) {
        return next();
    }

    if (req.isAuthenticated()) {
        console.log('Usuário autenticado');

        const usuario = req.user;  
        if (!usuario || !usuario.profissionalId) {
            console.log('Usuário ou profissionalId não encontrado');
            req.flash('error_msg', 'Usuário ou profissional não encontrado');
            return res.redirect('/auth/login'); 
        }

        try {
            const profissional = await Profissional.findByPk(usuario.profissionalId); // Buscando o profissional associado

            if (!profissional) {
                console.log('Profissional não encontrado');
                req.flash('error_msg', 'Profissional não encontrado');
                return res.redirect('/');
            }

            const dashboardRoutes = {
                'Administrador': '/dashboard/adm',
                'Assistente social': '/dashboard/assistente-social',
                'Psicólogo': '/dashboard/psicologo-psiquiatra',
                'Psiquiatra': '/dashboard/psicologo-psiquiatra'
            };

            const cargo = profissional.cargo; 
            const permittedRoutes = accessControl[cargo];

            if (permittedRoutes && permittedRoutes.some(route => req.originalUrl.startsWith(route))) {
                return next();
            } else {
                if (req.originalUrl === '/') {
                    const redirectRoute = dashboardRoutes[cargo];
                    if (redirectRoute) {
                        return res.redirect(redirectRoute);
                    }
                }

                console.log('Acesso negado: Você não tem permissão para acessar esta página');
                req.flash('error_msg', 'Você não tem permissão para acessar esta página.');
                return res.redirect('/');
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



const accessControl = {
    'Administrador': [
        '/dashboard/adm',
        '/profissionais',
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
        '/mensagens',
        '/produtos',
        '/atendimentos2',
        '/notificacoes',
        '/graficos',
        '/usuarios',
        '/auth/lista',
    ],
    'Assistente social': [
        '/dashboard/assistente-social',
        '/atendimentos',
        '/ocorrencias',
        '/mensagens',
        '/pacientes',
        '/reservas',
        '/atendimentos2',
        '/profissionais/meu_perfil',

    ],
    'Psicólogo': [
        '/dashboard/psicologo-psiquiatra',
        '/dashboard/psicologo',
        '/atendimentos',
        '/ocorrencias',
        '/mensagens',
        '/pacientes',
        '/reservas',
        '/atendimentos2',
        '/profissionais/meu_perfil',

    ],
    'Psiquiatra': [
        '/dashboard/psicologo-psiquiatra',
        '/dashboard/psicologo',
        '/atendimentos',
        '/ocorrencias',
        '/mensagens',
        '/pacientes',
        '/reservas',
        '/atendimentos2',
        '/profissionais/meu_perfil',
    ],
};


app.use('/profissionais', profissionalRoutes);
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
app.use('/atendimentos2', atendimentos2Routes);
app.use('/notificacoes', notificacaoRoutes);
app.use('/graficos', graficosRoutes);
app.use('/auth', usuarioRoutes);


app.use((req, res) => {
    res.status(404).render('404'); 
});

app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send('Algo deu errado!'); 
});

app.listen(PORT, () => {
    console.log(`Servidor rodando em http://localhost:${PORT}`);
});

sequelize.sync()
  .then(() => console.log('Tabelas sincronizadas ou alteradas'))
  .catch(err => console.error('Erro ao sincronizar tabelas:', err));

  module.exports = app;
