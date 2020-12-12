const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const CryptoJS = require('crypto-js');
const sql = require('mssql');
const dotenv = require('dotenv');

const { runQuery } = require('../query');

dotenv.config();

module.exports = async () => {
  try {
    passport.use(
      new LocalStrategy(async (nickname, password, done) => {
        const saltResult = await runQuery(
          'SELECT pwd_salt FROM Users WHERE nickname = @nickname',
          ['nickname', sql.VarChar(20), nickname],
        );
        if (saltResult.length == 0) {
          return done(null, false, { messeage: 'Incorrect nickname' });
        }
        const { pwd_salt: salt } = saltResult[0];
        const passwordPbkdf = CryptoJS.PBKDF2(password, salt, {
          keySize: 256 / 32,
          iterations: process.env.ITERATION,
        });
        const result = await runQuery(
          'SELECT * FROM Users WHERE nickname = @nickname AND password = @password',
          ['nickname', sql.VarChar(20), nickname],
          ['password', sql.VarChar(255), passwordPbkdf],
        );
        if (result.length == 0) {
          return done(null, false, { message: 'Incorrect' });
        } else {
          return done(null, result[0]);
        }
      }),
    );

    passport.serializeUser((user, done) => {
      done(null, user.nickname);
    });

    passport.deserializeUser(async (nickname, done) => {
      const result = await runQuery(
        'SELECT * FROM Users WHERE nickname = @nickname',
        ['nickname', sql.VarChar(20), nickname],
      );
      done(null, result[0]);
    });
  } catch (err) {
    console.error(err);
    return done(null, false, { message: 'Incorrect' });
  }
};
