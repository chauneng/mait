const express = require('express');
const dotenv = require('dotenv');
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');

const app = express();
app.use(cookieParser(process.env.COOKIE_SECRET_KEY));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

dotenv.config();
cookieParser();

exports.isLoggedIn = (req, res, next) => {
  if (req.isAuthenticated()) {
    next();
  } else {
    res.status(403).send('Login reqired');
  }
};

exports.isNotLoggedIn = (req, res, next) => {
  if (!req.isAuthenticated()) {
    next();
  } else {
    res.redirect('/');
  }
};



exports.verifyToken = (req, res, next) => {
  console.log(req.headers.authorization);
  // console.log(req.cookies.x_auth.accessToken);
  try {
    // req.decoded = jwt.verify(req.cookies.x_auth.accessToken, process.env.JWT_SECRET_KEY);
    const accessToken = req.headers.authorization;
    const { userInfo } = jwt.verify(accessToken, process.env.JWT_SECRET_KEY);
    console.log(userInfo.id);
    const findtoken = `SELECT token FROM users WHERE id = ${parseInt(userInfo.id, 10)};`;
    con.query(findtoken, async (err, row) => {
      if (err) throw err;
      await row.map((item) => {
        console.log(item.token)
        if (item.token === accessToken) {
          req.decoded = jwt.verify(item.token, process.env.JWT_SECRET_KEY);
          con.end();
          return next();
        }
        return res.status(401).json({ message: 'unauthorized token' });
      });
      // req.decoded = jwt.verify(accessToken, process.env.JWT_SECRET_KEY);
    });
    // // console.log(req.decoded);
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(419).json({
        code: 419,
        message: 'Token Expired',
      });
      // return res.redirect('/refresh');
    }
    return res.status(401).json({
      code: 401,
      message: 'unaurthorized',
    });
  }
};

// exports.verifyToken = (req, res, next) => {
//   console.log(req.cookies);
//   try {
//     req.decoded = jwt.verify(req.cookies.x_auth.accessToken, process.env.JWT_SECRET_KEY );
//     return next();
//   } catch (error) {
//     if (error.name === 'TokenExpiredError') {
//       return res.status(419).json({
//         code: 419,
//         message: 'Token Expired',
//       });
//     }
//     return res.status(401).json({
//       code: 401,
//       message: error,
//     });
//   }
// };

// exports.verifyToken = (req, res, next) => {
//   console.log(req.headers.authorization);
//   try {
//     // req.decoded = jwt.verify(req.cookies.x_auth.accessToken, process.env.JWT_SECRET_KEY);
//     req.decoded = jwt.verify(req.headers.authorization, process.env.JWT_SECRET_KEY);
//     // console.log(req.fresh.cookies.x_auth.accessToken);
//     console.log(req.decoded);
//     return next();
//   } catch (error) {
//     if (error.name === 'TokenExpiredError') {
//       return res.status(419).json({
//         code: 419,
//         message: 'Token Expired',
//       });
//       // return res.redirect('/refresh');
//     }
//     return res.status(401).json({
//       code: 401,
//       message: error,
//     });
//   }
// };
