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

exports.verifyToken = (req, res, next) => {
  if (!req.headers["authorization"]) {
    return res.status(401).send({message: "LOGIN_REQUIRED"});
  }
  try {
    if (!req.headers["authorization"]) {
      return res.status(401).send({message: "LOGIN_REQUIRED"});
    }
    const accessToken = req.headers["authorization"];
    const { userInfo } = jwt.verify(accessToken, process.env.JWT_SECRET_KEY);
    const findtoken = `SELECT token FROM users WHERE id = ${userInfo.id};`;
    con.query(findtoken, (err, result) => {
      if (err) throw err;
      if (result[0].token === accessToken) {
        req.decoded = jwt.verify(result[0].token, process.env.JWT_SECRET_KEY);
        return next();
      } else {
      return res.status(401).json({
        code: 401,
        message: 'UNAUTORIZED',
      });
      }
    })
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(419).json({
        code: 419,
        message: 'Token Expired',
      });
    }
    return res.status(401).json({
      code: 401,
      message: 'UNAUTORIZED',
    });
  };
};
