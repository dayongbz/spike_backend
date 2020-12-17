const isAuth = (req, res, next) => {
  if (req.isAuthenticated()) return next();
  res.status(406).send('you have to login');
};

module.exports = { isAuth };
