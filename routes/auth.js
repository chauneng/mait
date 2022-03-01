const express = require('express');

const router = express.Router();
const mysql = require('mysql');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const qs = require('qs');
const axios = require('axios');

const dbconfig = require('../config/database');

const con = mysql.createConnection(dbconfig);
const { verifyToken } = require('./middleware');

function insertToken(userId, nickname) {
  const userInfo = { userId, nickname };
  const accessToken = jwt.sign({ userInfo }, process.env.JWT_SECRET_KEY, { expiresIn: '30d' });
  con.query(`UPDATE users SET token = "${accessToken}" WHERE id = "${userId}";`);
  return accessToken;
}

router.get('/signout', verifyToken, (req, res) => {
  const { userInfo } = req.decoded;
  if (!userInfo) {
    res.status(200).json({ message: 'No user info' });
  }
  con.query(`UPDATE users SET token = null WHERE username = "${userInfo.username}";`);
  res.clearCookie('x_auth').json({ message: 'success' });
});

router.post('/signin', async (req, res, next) => {
  res.header('ACCESS-Control-Allow-Origin', 'https://maitapp.click');
  const { username, password } = req.body;
  try {
    await con.query(`SELECT * FROM users WHERE username = "${username}";`, async (error, row) => {
      if (error) throw error;
      const User = row.shift();
      if (User === undefined) {
        res.json({ message: 'Invalid id' });
      } else {
        const result = await bcrypt.compare(password, User.password);
        if (!result) {
          res.json({ message: 'Invalid password' });
        } else {
          const accessToken = insertToken(User.id, User.nickname);
          return res.cookie(
            'x_auth',
            { accessToken },
            { maxAge: 31536000, domain: 'https://mait.shop', sameSite: 'none', httpOnly: true, secure: true }
          ).json({ message: 'success', accessToken });
        }
      }
    });
  } catch (e) {
    next();
  }
});

router.post('/signup', (req, res, next) => {
  const {
    username, password, nickname, email,
  } = req.body;
  const regExp = /^[0-9a-zA-Z]([-_.]?[0-9a-zA-Z])*@[0-9a-zA-Z]([-_.]?[0-9a-zA-Z])*.[a-zA-Z]{2,3}$/i;
  if (!username) return res.status(400).json({ message: 'Empty IDfield' });
  if (username.length > 16) return res.json({ message: 'Too long id' });
  if (password.length < 4) return res.json({ message: 'Invalid password' });
  if (!nickname) return res.json({ message: 'Empty nickname' });
  if (!regExp.test(email)) return res.json({ message: 'Invalid email' });
  try {
    con.query(`SELECT * FROM users WHERE username = "${username}"`, async (error, exUser) => {
      if (error) throw (error);
      if (!exUser) {
        return res.json({ message: 'connection error' });
      }
      if (exUser.length !== 0) {
        return res.json({ message: 'Existing user' });
      }
      const hashpw = await bcrypt.hash(password, 12);
      con.query('INSERT INTO users (username, password, created_at, nickname, email) VALUES (?, ?, NOW(), ?, ?)', [
        username,
        hashpw,
        nickname,
        email,
      ]);
      return res.json({ message: 'success' });
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
  let token;
  try {
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
    });
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
    });
  } catch (e) {
    res.json(e.data);
  }
  try {
    const searchQuery = `SELECT * FROM users 
    WHERE social_type_id = ${parseInt(1, 10)} AND username = "${user.data.id}";`;
    con.query(searchQuery, (err, row) => {
      if (err) throw err;
      if (row.length === 0) {
        const signUpQuery = `INSERT INTO users (social_type_id, username, nickname, email) 
        VALUES (${parseInt(1, 10)}, "${user.data.id}", "${user.data.properties.nickname}", "${user.data.kakao_account.email}");`;
        con.query(signUpQuery, async (err2, result) => {
          if (err2) throw err;
          const accessToken = insertToken(result.insertId, user.data.id);
          return res.json({ message: 'success', accessToken });
        });
      } else {
        const accessToken = insertToken(row[0].id, row[0].username);
        return res.json({ message: 'success', accessToken });
      }
    });
  } catch (e) {
    res.json(e.data);
  }
});

module.exports = router;
