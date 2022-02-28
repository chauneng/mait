const express = require('express');

const router = express.Router();
const mysql = require('mysql');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const dbconfig = require('../config/database');

const con = mysql.createConnection(dbconfig);
// const jwt = require('../modules/jwt');
const { verifyToken } = require('./middleware');

router.post('/signout', verifyToken, (req, res) => {
  const { userInfo } = req.decoded;
  console.log(userInfo, "******")
  if (!userInfo) {
    res.status(200).json({ message: 'No user info' });
  }
  con.query(`UPDATE users SET token = null WHERE id = "${userInfo.id}";`);
  // res.clearCookie('x_auth').json({ message: 'success' });
  res.json({ message: 'success' });
});

router.post('/signin', async (req, res, next) => {
  // console.log("*****")
  // console.log(userInfo, "******")
  // console.log(req.headers);
  res.header("ACCESS-Control-Allow-Origin", "https://maitapp.click");
  const { username, password } = req.body;
  try {
    // console.log(req.body.id);
    await con.query(`SELECT * FROM users WHERE username = "${username}";`, async (error, row) => {
      if (error) throw error;
      // console.log(row);
      const User = row.shift();
      if (User === undefined) {
        res.json({ message: 'Invalid id' });
      } else {
        const result = await bcrypt.compare(password, User.password);
        if (!result) {
          res.json({ message: 'Invalid password' });
        } else {
          const userInfo = {
            id: User.id,
            username: User.username,
          };
          // console.log(User);
          const accessToken = jwt.sign({ userInfo }, process.env.JWT_SECRET_KEY, { expiresIn: '30d' });
          console.log(accessToken, "CREATE ACCESS TOKEN");
          await con.query(`UPDATE users SET token = "${accessToken}" WHERE username = "${User.username}";`);
          // const refreshToken = jwt.sign({ userInfo }, process.env.JWT_SECRET_KEY, { expiresIn: '7d' });
          return res.cookie(
            'x_auth',
            { accessToken },
            // { maxAge: 31536000, path: '/', domain: 'https://mait.shop', sameSite: 'Lax', httpOnly: true }
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
      console.log(req.body);
      con.query('INSERT INTO users (username, password, created_at, nickname, email) VALUES (?, ?, NOW(), ?, ?)', [
        username,
        hashpw,
        nickname,
        email,
      ]);
      return res.json({ message: 'success' });
    });
  } catch (error) {
    // console.error(error);
    return next(error);
  }
});

router.delete('/close', verifyToken, (req, res) => {
  const userInfo = req.decoded;
  const { confirm, password } = req.body;

  if (confirm !== '회원 탈퇴') return res.send({ message: 'not confirmed' });

  const confirmSql = `SELECT * FROM users WHERE id =${userInfo.id};`;
  con.query(confirmSql, async (err, row) => {
    if (row.length === 0) return res.send({ message: 'cannot find user info' });

    const result = await bcrypt.compare(password, row[0].password);
    if (!result) return res.send({ message: 'wrong password' });

    const sql = `DELETE FROM users WHERE id = ${userInfo.id};`;
    con.query(sql, (err2, resultDeleted) => {
      if (err2) throw err2;
      if (resultDeleted[0].affectedRows !== 1) return res.send({ message: 'request failed' });

      return res.send({ message: 'success' });
    });
  });
});

router.patch('/mod', verifyToken, (req, res) => {
  const userInfo = req.decoded;
  const { currPassword, password, nickname, email } = req.body;

  const regExp = /^[0-9a-zA-Z]([-_.]?[0-9a-zA-Z])*@[0-9a-zA-Z]([-_.]?[0-9a-zA-Z])*.[a-zA-Z]{2,3}$/i;
  if (password.length < 4) return res.send({ message: 'Invalid password' });
  if (!nickname) return res.send({ message: 'Empty nickname' });
  if (!regExp.test(email)) return res.send({ message: 'Invalid email' });

  try {
    con.query(`SELECT * FROM users WHERE id = ${userInfo.id}`, async (err, row) => {
      if (err) throw err;
      if (row.length === 0 || row[0].password === null) return res.send({ message: 'invalid request' });

      const checkPassword = await bcrypt.compare(currPassword, row[0].password);
      if (!checkPassword) return res.send({ message: 'wrong password' });

      const newPassword = password === '' ? row[0].password : await bcrypt.hash(password, 12);
      const newNickname = nickname === '' ? row[0].nickname : nickname;
      const newEmail = email === '' ? row[0].email : email;

      con.query(`UPDATE users SET password = "${newPassword}", nickname = "${newNickname}", email = "${newEmail}" WHERE id = ${userInfo.id};`);
      return res.send({ message: 'success' });
    });
  } catch (e) {
    return res.send({ message: e });
  }
});

module.exports = router;
