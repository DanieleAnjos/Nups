function ensureAuthenticated(req, res, next) {
    if (req.isAuthenticated()) {
        return next();
    }
    req.flash('error_msg', 'Por favor, faça login para acessar esta página.');
    res.redirect('/login');
}

module.exports = ensureAuthenticated;
