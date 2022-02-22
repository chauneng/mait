const express = require('express');
const mysql = require('mysql');
const dbconfig = require('../config/database');
const { verifyToken } = require('./middleware');

const connection = mysql.createConnection(dbconfig);
const router = express.Router();

// router.post('/', verifyToken, (req, res) => {
router.post('/', (req, res) => {
  // console.log(req.decoded, 1);
  // console.log(req.body, 1);
  const { content, subjectId } = req.body;
  // const { userInfo } = req.decoded;
  // console.log(typeof parseInt(subjectId, 10));
  if (content?.length === 0 || content === undefined) {
    return res.json({ error: 'empty content field' });
  }
  try {
    const insertsql = `INSERT INTO todos(content, subject_id, user_id) VALUES("${content}", ${parseInt(subjectId, 10)}, ${parseInt(1, 10)})`;
    // const insertsql = `INSERT INTO todos(content, subject_id, user_id) VALUES("${content}", ${parseInt(subjectId, 10)}, ${userInfo.id})`;
    connection.query(insertsql, (insertErr, result, fields) => {
      console.log(result);
      if (insertErr) throw insertErr;
      res.json({
        todo: {
          id: result.insertId,
          content,
          subject_id: parseInt(subjectId, 10),
          // userId: userInfo.id,
          user_id: 1,
          is_done: false,
        },
      });
    });
  } catch (error) {
    return res.json({ error });
  }
});

// todo 이미 있는 내용은 추가로 생성하지 않게 해야할까? 같은 것이 들어가면 안되는 이유도 없으니 그냥 유저가 알아서 지우게 하는게 나을 듯

// router.patch('/:todoID', verifyToken, (req, res) => {
router.patch('/:todoID', (req, res) => {
  const { content, isDone } = req.body;
  // const { userInfo } = req.decoded;
  const userInfo = {id:1};
  const { todoID } = req.params;
  // console.log(todoId)
  try {
    const findsql = `SELECT * FROM todos WHERE id = "${parseInt(todoID, 10)}";`;
    connection.query(findsql, (finderr, row) => {
      if (row.lenth === 0 || userInfo.id !== row.shift().user_id) {
        res.json({ message: 'Invalid user' });
      } else {
        // const oldTodo = row.shift();
        const updatesql = `UPDATE todos SET content = "${content}", is_done = ${parseInt(isDone===true ? 1 : 0, 10)} WHERE user_id = ${parseInt(userInfo.id, 10)} AND id = ${parseInt(todoID, 10)}`;
        try {
          connection.query(updatesql, (updateErr, result, fields) => {
            if (updateErr) throw updateErr;
            res.json({ message: 'success' });
          });
        } catch (error) {
          return res.json({ message: error });
        }
      }
    });
  } catch (error) {
    return res.json({ error });
  }
});

router.delete('/:todoID', (req, res) => {
  //const user_id = // 쿼리 수정
  const { todoID } = req.params;
  connection.query(`DELETE FROM todos WHERE id = ${todoID};`, (err, result) => {
    if (err) throw err;
    console.log(result);
    return res.status(200).send({ message: 'success' });
  });
});

module.exports = router;
