const isAuth = (req, res, next) => {
  console.log(req.isAuthenticated());
  if (req.isAuthenticated()) return next();
  res.status(406).send('you have to login');
};

module.exports = { isAuth };
