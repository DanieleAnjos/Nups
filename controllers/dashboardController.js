const dashboardController = {
  adm: (req, res) => {
      res.render('dashboard/adm', { user: req.user });
  }
};

module.exports = dashboardController;
