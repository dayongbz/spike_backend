const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const CryptoJS = require('crypto-js');
const sql = require('mssql');
const dotenv = require('dotenv');

const { runQuery } = require('../function/query');

dotenv.config();

module.exports = async () => {
  try {
    passport.serializeUser((user, done) => {
      done(null, user.username);
    });

    passport.deserializeUser(async (username, done) => {
      const result = await runQuery(
        'SELECT * FROM Users WHERE username = @username',
        ['username', sql.VarChar(20), username],
      );
      done(null, result[0]);
    });
    passport.use(
      new LocalStrategy(async (username, password, done) => {
        const saltResult = await runQuery(
          'SELECT pwd_salt FROM Users WHERE username = @username',
          ['username', sql.VarChar(20), username],
        );
        if (saltResult.length == 0) {
          return done(null, false, { messeage: 'Incorrect username' });
        }
        const { pwd_salt: salt } = saltResult[0];
        const passwordPbkdf = CryptoJS.PBKDF2(password, salt, {
          keySize: 256 / 32,
          iterations: process.env.ITERATION,
        });
        const result = await runQuery(
          'SELECT * FROM Users WHERE username = @username AND password = @password',
          ['username', sql.VarChar(20), username],
          ['password', sql.VarChar(255), passwordPbkdf],
        );
        if (result.length == 0) {
          return done(null, false, { message: 'Incorrect' });
        } else {
          return done(null, result[0]);
        }
      }),
    );
  } catch (err) {
    console.error(err);
    return done(null, false, { message: 'Incorrect' });
  }
};
