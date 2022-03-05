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

module.exports = router;
