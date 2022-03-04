const express = require('express');

const router = express.Router();
const mysql = require('mysql');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const qs = require('qs');
const axios = require('axios');
const url = require('url');

const dbconfig = require('../config/database');

const con = mysql.createConnection(dbconfig);
const { verifyToken } = require('./middleware');

function insertToken(id, nickname) {
  const userInfo = { id, nickname };
  const accessToken = jwt.sign({ userInfo }, process.env.JWT_SECRET_KEY, { expiresIn: '30d' });
  con.query(`UPDATE users SET token = "${accessToken}" WHERE id = ${id};`);
  return accessToken;
}

router.post('/signout', verifyToken, (req, res) => {
  const { userInfo } = req.decoded;
  console.log(userInfo, "*******");
  console.log(userInfo);
  if (!userInfo) {
    res.status(200).json({ message: 'NO_USER_INFO' });
  }
  con.query(`UPDATE users SET token = null WHERE id = ${userInfo.id};`, (err, result) => {
    if(err) {throw err};
  });
  res.clearCookie('x_auth').json({ message: 'SUCCESS' });
});

router.post('/signin', async (req, res) => {
  // res.header('ACCESS-Control-Allow-Origin', 'https://maitapp.click');
  console.log(req.body, "***");
  const { username, password } = req.body;
  console.log(username, "username");
  console.log(password, "password");
  try {
    await con.query(`SELECT * FROM users WHERE username = "${username}";`, async (error, row) => {
      if (error) throw error;
      if (row.length === 0) {
        res.status(400).json({ message: 'INVALID_USERNAME' });
      } else {
        const result = await bcrypt.compare(password, row[0].password);
        if (!result) {
          res.status(400).json({ message: 'INVALID_PASSWORD' });
        } else {
          const accessToken = insertToken(row[0].id, row[0].username);
          return res.cookie(
            'x_auth',
            { accessToken },
            { maxAge: 31536000, domain: 'https://mait.shop', sameSite: 'none', httpOnly: true, secure: true }
          ).json({ message: 'SUCCESS', accessToken });
        }
      }
    });
  } catch (e) {
    // next();
  }
});

router.post('/signup', (req, res, next) => {
  const {
    username, password, nickname, email,
  } = req.body;
  console.log(req.body, "req_body");
  const regExp = /^[0-9a-zA-Z]([-_.]?[0-9a-zA-Z])*@[0-9a-zA-Z]([-_.]?[0-9a-zA-Z])*.[a-zA-Z]{2,3}$/i;
  if (!username) return res.status(200).json({ message: 'EMPTY_USERNAME' });
  if (username.length > 16) return res.status(200).json({ message: 'ID_TOO_LONG' });
  if (password.length < 4) return res.status(200).json({ message: 'PASSWORD_TOO_SHORT' });
  if (!nickname) return res.status(200).json({ message: 'EMPTY_NICKNAME' });
  if (!regExp.test(email)) return res.status(200).json({ message: 'EMAIL_INVALID' });
  try {
    
    con.query(`SELECT * FROM users WHERE username = "${username}"`, async (error, exUser) => {
      if (error) throw (error);
      if (!exUser) {
        return res.status(200).json({ message: 'CONNECTION_ERROR' });
      }
      if (exUser.length !== 0) {
        return res.status(200).json({ message: 'USERNAME_EXISTS' });
      }
      const hashpw = await bcrypt.hash(password, 12);
      con.query('INSERT INTO users (username, password, created_at, nickname, email) VALUES (?, ?, NOW(), ?, ?)', [
        username,
        hashpw,
        nickname,
        email,
      ]);
      return res.status(200).json({ message: 'SUCCESS' });
    });
  } catch (error) {
    return next(error);
  }
});

router.get('/kakao', (req, res) => {
  const kakaoAuthURL = `https://kauth.kakao.com/oauth/authorize?client_id=${process.env.KAKAO_CLIENT_ID}&redirect_uri=${process.env.KAKAO_REDIRECT_URI}&response_type=code&scope=profile_nickname,account_email`;
  res.redirect(kakaoAuthURL);
});

router.get('/kakao/callback', async (req, res) => {
  console.log("********")
  let token;
  
  try {
    console.log("#############################1")
    token = await axios({
      method: 'POST',
      url: 'https://kauth.kakao.com/oauth/token',
      headers: {
        'content-type': 'application/x-www-form-urlencoded',
      },
      data: qs.stringify({
        grant_type: 'authorization_code',
        client_id: process.env.KAKAO_CLIENT_ID,
        client_secret: process.env.KAKAO_CLIENT_SECRET_KEY,
        redirectUri: process.env.KAKAO_REDIRECT_URI,
        code: req.query.code,
      }),
      
    }
    )
  } catch (err) {
    res.json(err.data);
  }
  let user;
  try {
    user = await axios({
      method: 'get',
      url: 'https://kapi.kakao.com/v2/user/me?property_keys=%5B%22properties.nickname%22%2C+%22kakao_account.email%22%5D&secure_resource=true',
      headers: {
        Authorization: `Bearer ${token.data.access_token}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    })
  } catch (e) {
    res.json(e.data);
  }
  try {
    const searchQuery = `SELECT * FROM users 
    WHERE social_type_id = ${parseInt(1, 10)} AND username = "${user.data.id}";`;
    con.query(searchQuery, (err, row) => {
      if (err) throw err;
      if (row.length === 0) {
        console.log("#############################11", user.data)
        
        const signUpQuery = `INSERT INTO users (social_type_id, username, nickname, email) 
        VALUES (1, "${user.data.id}", "${user.data.properties.nickname}", "${user.data.kakao_account.email}");`;
        con.query(signUpQuery, async (err2, result) => {
          if (err2) throw err;
          console.log("#############################12", result)
          const accessToken = insertToken(result.insertId, user.data.id);
          
          return res.json({ message: 'SUCCESS', accessToken });
        });
      } 
      else {
        
        const accessToken = insertToken(row[0].id, row[0].username);
        res.redirect(url.format({pathname: '/mainpage', data: {message : "SUCCESS", accessToken}}))
      }
    });
  } catch (e) {
    res.json(e.data);
  }
});

module.exports = router;
