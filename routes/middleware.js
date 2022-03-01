const express = require('express');
const dotenv = require('dotenv');
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');

const mysql = require('mysql');
const dbconfig = require('../config/database');
const con = mysql.createConnection(dbconfig);



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
  try {
    console.log(1, req.headers["authorization"]);
    const accessToken = req.headers["authorization"];
    console.log(2);
    const { userInfo } = jwt.verify(accessToken, process.env.JWT_SECRET_KEY);
    const findtoken = `SELECT token FROM users WHERE id = ${parseInt(userInfo.id, 10)};`;
    con.query(findtoken, (err, result) => {
      if (err) throw err;
      console.log(result[0].token, "token in DB");
      console.log(accessToken, "access token");
      if (result[0].token === accessToken) {
        req.decoded = jwt.verify(result[0].token, process.env.JWT_SECRET_KEY);
        console.log("SUCCESS!!!!!!!!!!!!!!!", userInfo);
        return next();
      }
    })
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
  };
};
    // con.query(findtoken, async (err, row) => {
    //   if (err) throw err;
    //   await row.map((item) => {
    //     console.log(item.token, "ITEM TOKEN");
    //     console.log(accessToken, "ACCESS TOKEN");

    //     if (item.token === accessToken) {
    //       console.log(5555555555555);
    //       req.decoded = jwt.verify(item.token, process.env.JWT_SECRET_KEY);
    //       con.end();
    //       console.log(666666666666666);
    //       return next();
    //     }
    //     console.log(7777777777777)
    //     return res.status(401).json({ message: 'unauthorized token' });
    //   });
    //   // req.decoded = jwt.verify(accessToken, process.env.JWT_SECRET_KEY);
    // });
    // // console.log(req.decoded);
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
//       message: 'unaurthorized 123',
//     });
//   }
// };

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
