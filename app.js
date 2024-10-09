require('dotenv').config(); 
const express = require('express');
const bodyParser = require('body-parser');
const methodOverride = require('method-override');
const path = require('path');
const session = require('express-session');
const flash = require('connect-flash');
const { engine } = require('express-handlebars');
const cors = require('cors'); 

const authRoutes = require('./routes/authRoutes');
const profissionalRoutes = require('./routes/profissionalRoutes');
const pacienteRoutes = require('./routes/pacienteRoutes');
const escalaRoutes = require('./routes/escalaRoutes');
const fornecedorRoutes = require('./routes/fornecedorRoutes');
const produtoRoutes = require('./routes/produtoRoutes');
const ajusteEstoqueRoutes = require('./routes/ajusteEstoqueRoutes');
const atendimentoRoutes = require('./routes/atendimentoRoutes');
const ocorrenciaRoutes = require('./routes/ocorrenciaRoutes');

const app = express();
const PORT = process.env.PORT || 3000;

const hbs = engine({
    helpers: {
        eq: (a, b) => a === b, // Define o helper eq
        ifCond: (v1, v2, options) => {
            return (v1 === v2) ? options.fn(this) : options.inverse(this);
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

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(methodOverride('_method'));
app.use(express.static(path.join(__dirname, 'public')));

app.use(cors());

app.use(session({
    secret: process.env.SESSION_SECRET || 'default_secret', 
    resave: false,
    saveUninitialized: true,
    cookie: {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
    }
}));

app.use(flash());

app.use((req, res, next) => {
    res.locals.success_msg = req.flash('success_msg');
    res.locals.error_msg = req.flash('error_msg');
    next();
});

app.use('/auth', authRoutes);

app.use('/profissionais', profissionalRoutes);
app.use('/pacientes', pacienteRoutes);
app.use('/escalas', escalaRoutes);
app.use('/', fornecedorRoutes);
app.use('/', produtoRoutes);
app.use('/', ajusteEstoqueRoutes);
app.use('/atendimentos', atendimentoRoutes);
app.use('/ocorrencias', ocorrenciaRoutes);


app.use((req, res, next) => {
    res.status(404).render('error', { error_msg: 'Página não encontrada.' });
});

app.use((err, req, res, next) => {
    console.error(err.stack); 
    res.status(500).render('error', { error_msg: 'Algo deu errado. Tente novamente mais tarde.' });
});

app.listen(PORT, () => {
    console.log(`Servidor rodando em http://localhost:${PORT}`);
});
