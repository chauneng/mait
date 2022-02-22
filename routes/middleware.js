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
  // console.log(req.headers);
  console.log(req.cookies);
  try {
    // todo 쿼리로 db에서 token 꺼내오고, 비교해야 함
    // req.decoded = jwt.verify(req.cookies.x_auth.accessToken, process.env.JWT_SECRET_KEY);
    // req.decoded = jwt.verify(req.headers.authorization, process.env.JWT_SECRET_KEY);
    req.decoded = jwt.verify(req.cookies.x_auth.accessToken, process.env.JWT_SECRET_KEY );
    // console.log(req.fresh.cookies.x_auth.accessToken);
    // console.log(req.decoded);
    return next();
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
      message: error,
    });
  }
};

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
