const express = require('express');

const router = express.Router();
const mysql = require('mysql');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const dbconfig = require('../config/database');

const con = mysql.createConnection(dbconfig);
const { verifyToken } = require('./middleware');

function insertToken(id, username) {
  const userInfo = { id, username };
  const accessToken = jwt.sign({ userInfo }, process.env.JWT_SECRET_KEY, { expiresIn: '30d' });
  con.query(`UPDATE users SET token = "${accessToken}" WHERE id = ${id};`);
  return accessToken;
}

router.post('/signin', async (req, res) => {
  const { username, password } = req.body;
  try {
    await con.query(`SELECT * FROM users WHERE username = "${username}" AND social_type_id IS NULL;`, async (error, row) => {
      if (error) throw error;
      if (row.length === 0) {
        res.status(400).json({ message: 'INVALID_USERNAME' });
      } else {
        const result = await bcrypt.compare(password, row[0].password);
        if (!result) {
          res.status(400).json({ message: 'INVALID_PASSWORD' });
        } else {
          const accessToken = insertToken(row[0].id, row[0].username);
          return res.status(200).json({ message: 'SUCCESS', accessToken });
        }
      }
    });
  } catch (e) {
    return res.status(400).json({ message: e });
  }
});

router.post('/signout', verifyToken, (req, res) => {
  const { userInfo } = req.decoded;
  if (!userInfo) {
    res.status(400).json({ message: 'NO_USER_INFO' });
  }
  try {
    con.query(`UPDATE users SET token = null WHERE id = ${userInfo.id};`, (err, result) => {
      if (err) throw err;
    });
  } catch (e) {
    return res.status(400).json({ message: e });
  }
  res.status(200).json({ message: 'SUCCESS' });
});

router.post('/signup', (req, res) => {
  const { username, password, nickname, email } = req.body;
  const regExpEmail = /^[0-9a-zA-Z]([-_.]?[0-9a-zA-Z])*@[0-9a-zA-Z]([-_.]?[0-9a-zA-Z])*.[a-zA-Z]{2,3}$/i;
  const regExpUsername = /^[a-z0-9A-Z]{1,16}$/i;
  const regExpNickname = /^[\S]{1,20}$/i;
  const regExpPassword = /^[a-z0-9A-Z!@#$%^&*]{4,72}$/i;
  if (!regExpUsername.test(username)) return res.status(400).json({ message: 'USERNAME_INVALID' });
  if (!regExpNickname.test(nickname)) return res.status(400).json({ message: 'NICKNAME_INVALID' });
  if (!regExpPassword.test(password)) return res.status(400).json({ message: 'PASSWORD_INVALID' });
  if (!regExpEmail.test(email)) return res.status(400).json({ message: 'EMAIL_INVALID' });
  try {
    con.query(`SELECT * FROM users WHERE username = "${username}"`, async (error, exUser) => {
      if (error) throw (error);
      if (!exUser) {
        return res.status(400).json({ message: 'CONNECTION_ERROR' });
      }
      if (exUser.length !== 0) {
        return res.status(400).json({ message: 'USERNAME_EXISTS' });
      }
      const hashpw = await bcrypt.hash(password, 12);
      con.query('INSERT INTO users (username, password, created_at, nickname, email) VALUES (?, ?, NOW(), ?, ?)', [
        username, hashpw, nickname, email,
      ]);
      return res.status(200).json({ message: 'SUCCESS' });
    });
  } catch (error) {
    return res.status(400).json({ message: error });
  }
});


router.post('/signup', (req, res) => {
  const { username, password, nickname, email } = req.body;
  const regExp = /^[0-9a-zA-Z]([-_.]?[0-9a-zA-Z])*@[0-9a-zA-Z]([-_.]?[0-9a-zA-Z])*.[a-zA-Z]{2,3}$/i;
  if (username.length === 0) return res.status(400).json({ message: 'EMPTY_USERNAME' });
  if (username.length > 16) return res.status(400).json({ message: 'ID_TOO_LONG' });
  if (password.length < 4) return res.status(400).json({ message: 'PASSWORD_TOO_SHORT' });
  if (nickname.length === 0 || nickname.length > 16) return res.status(400).json({ message: 'EMPTY_NICKNAME' });
  if (!regExp.test(email)) return res.status(400).json({ message: 'EMAIL_INVALID' });
  try {
    con.query(`SELECT * FROM users WHERE username = "${username}"`, async (error, exUser) => {
      if (error) throw (error);
      if (!exUser) {
        return res.status(400).json({ message: 'CONNECTION_ERROR' });
      }
      if (exUser.length !== 0) {
        return res.status(400).json({ message: 'USERNAME_EXISTS' });
      }
      const hashpw = await bcrypt.hash(password, 12);
      con.query('INSERT INTO users (username, password, created_at, nickname, email) VALUES (?, ?, NOW(), ?, ?)', [
        username, hashpw, nickname, email,
      ]);
      return res.status(200).json({ message: 'SUCCESS' });
    });
  } catch (error) {
    return res.status(400).json({ message: error });
  }
});

router.post('/kakao', (req, res) => {
  const { username, email, nickname } = req.body;
  try {
    const searchQuery = `SELECT * FROM users 
    WHERE social_type_id = 1 AND username = "${username}";`;
    con.query(searchQuery, (err, row) => {
      if (err) throw err;
      if (row.length === 0) {
        const signUpQuery = `INSERT INTO users (social_type_id, username, nickname, email, created_at) 
        VALUES (1, "${username}", "${nickname}", "${email}", NOW());`;
        con.query(signUpQuery, async (err2, result) => {
          if (err2) throw err;
          const accessToken = insertToken(result.insertId, username);
          return res.status(200).json({ message: 'SUCCESS', accessToken });
        });
      } else {
        const accessToken = insertToken(row[0].id, row[0].username);
        return res.status(200).json({ message: 'SUCCESS', accessToken });
      }
    });
  } catch (e) {
    res.json(e.data);
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
