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

const authRoutes = require('./routes/authRoutes');
const profissionalRoutes = require('./routes/profissionalRoutes');
const pacienteRoutes = require('./routes/pacienteRoutes');
const escalaRoutes = require('./routes/escalaRoutes');
const fornecedorRoutes = require('./routes/fornecedorRoutes');
const produtoRoutes = require('./routes/produtoRoutes');
const ajusteEstoqueRoutes = require('./routes/ajusteEstoqueRoutes');
const atendimentoRoutes = require('./routes/atendimentoRoutes');
const ocorrenciaRoutes = require('./routes/ocorrenciaRoutes');
const salasRoutes = require('./routes/salasRoutes');
const reservasSalaRoutes = require('./routes/reservasSalaRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const eventoRoutes = require('./routes/eventoRoutes');

const Usuario = require('./models/Usuario'); 
const app = express();
const PORT = process.env.PORT || 3002;

const hbs = engine({
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
            return `${year}-${month}-${day}`;
        },
        formatDateTime: (date) => {
            if (!date) return '';
            const d = new Date(date);
            const year = d.getFullYear();
            const month = String(d.getMonth() + 1).padStart(2, '0');
            const day = String(d.getDate()).padStart(2, '0');
            const hours = String(d.getHours()).padStart(2, '0');
            const minutes = String(d.getMinutes()).padStart(2, '0');
            return `${year}-${month}-${day}T${hours}:${minutes}`;
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
    secret: process.env.SESSION_SECRET || 'default_secret', 
    resave: false,
    saveUninitialized: false, 
    cookie: {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production', 
        maxAge: 24 * 60 * 60 * 1000 
    }
}));

app.use(passport.initialize());
app.use(passport.session());

app.use((req, res, next) => {
    res.locals.success_msg = req.flash('success_msg');
    res.locals.error_msg = req.flash('error_msg');
    next();
});

app.use('/auth', authRoutes);

app.get('/', (req, res) => {
    res.redirect('/auth/login');
});

app.use((req, res, next) => {
    const publicRoutes = ['/auth/login', '/auth/register', '/css/', '/favicon.ico'];
    
    if (publicRoutes.some(route => req.originalUrl.startsWith(route))) {
        return next();
    }

    if (req.isAuthenticated()) {
        console.log('Usuário autenticado');
        return next();
    }

    console.log('Usuário não autenticado, redirecionando de volta');
    req.flash('error_msg', 'Você precisa estar logado para acessar essa página.'); // Mensagem de erro
    res.redirect('/auth/login');
});

app.use('/profissionais', profissionalRoutes);
app.use('/pacientes', pacienteRoutes);
app.use('/escalas', escalaRoutes);
app.use('/fornecedores', fornecedorRoutes);
app.use('/produtos', produtoRoutes);
app.use('/ajusteestoque', ajusteEstoqueRoutes);
app.use('/atendimentos', atendimentoRoutes);
app.use('/ocorrencias', ocorrenciaRoutes);
app.use('/salas', salasRoutes);
app.use('/reservas', reservasSalaRoutes);
app.use('/dashboard', dashboardRoutes);
app.use('/eventos', eventoRoutes);

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
