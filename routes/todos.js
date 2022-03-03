const express = require('express');
const mysql = require('mysql');
const dbconfig = require('../config/database');
const { verifyToken } = require('./middleware');

const connection = mysql.createConnection(dbconfig);
const router = express.Router();


router.get('/', verifyToken, (req, res) => {
  const user_id = req.decoded.userInfo.id;
  let today = new Date();
  today.setHours(today.getHours() + 9); 
  today = today.toISOString().split('T')[0].substring(0, 19);
  const todos= `SELECT 
                      t.id,
                      t.content, 
                      t.subject_id AS subjectId, 
                      t.is_done AS isDone
                  FROM todos AS t 
                  LEFT JOIN subjects AS s
                      ON t.subject_id = s.id
                  WHERE DATE_FORMAT(t.created_at, "%Y-%m-%d") = STR_TO_DATE("${today}", "%Y-%m-%d")
                     AND t.user_id = ${user_id}
                     AND s.is_deleted = 0;`;
  const colors = `SELECT * FROM colors;`;
  const subjects = `SELECT id, name, color_code_id as colorId FROM subjects WHERE user_id = ${user_id} AND is_deleted = 0;`;
  connection.query(todos + colors + subjects, (err, result) => {
      if(err) throw err;
      console.log(result);
      res.status(200).send({message: "SUCCESS", todos: result[0], colors: result[1], subjects: result[2]})
  })
})


router.post('/', verifyToken, (req, res) => {
// router.post('/', (req, res) => {
  // console.log(req.decoded, 1);
  if (req.body.subjectId === undefined) {
    return res.send( {"message" : "EMPTY_SUBJECTID"} )
  } else if (req.body.content === undefined) {
    return res.send({"message" : "EMPTY_CONTENT"})
  }

  const { content, subjectId } = req.body;
  console.log(req.body);
  console.log(content, subjectId, "*******");
  const user_id = req.decoded.userInfo.id;
  // const user_id  = 9;
  // console.log(typeof parseInt(subjectId, 10));
  if (content?.length === 0 || content === undefined) {
    return res.json({ error: 'empty content field' });
  }
  try {
    // const insertsql = `INSERT INTO todos(content, subject_id, user_id) VALUES("${content}", ${parseInt(subjectId, 10)}, ${parseInt(1, 10)})`;
    const insertsql = `INSERT INTO todos(content, subject_id, user_id) VALUES("${content}", ${subjectId}, ${user_id})`;
    connection.query(insertsql, (insertErr, result, fields) => {
      console.log(result);
      if (insertErr) throw insertErr;
      res.json({
        todo: {
          id: result.insertId,
          content,
          subject_id: subjectId,
          userId: user_id,
          is_done: false,
        },
      });
    });
  } catch (error) {
    return res.json({ error });
  }
});

// todo 이미 있는 내용은 추가로 생성하지 않게 해야할까? 같은 것이 들어가면 안되는 이유도 없으니 그냥 유저가 알아서 지우게 하는게 나을 듯

router.patch('/:id', verifyToken, (req, res) => {
// router.patch('/:id', (req, res) => {
  const content = req.body.content;
  const subject_id = req.body.subjectId;
  const is_done = req.body.isDone;
  const user_id = req.decoded.userInfo.id;
  // const user_id = 9;
  const todo_id = req.params.id;
  // console.log(todo_id)
  // console.log(todoId)
  try {
    const findsql = `SELECT * FROM todos WHERE id = "${todo_id}";`;
    connection.query(findsql, (finderr, row) => {
      console.log(row);
      if (row.length === 0 || row[0].user_id !== user_id) {
        res.status(400).json({ message: 'INVALID_USER' });
      } else {
        // const oldTodo = row.shift();
        const updatesql = `UPDATE todos SET content = "${content}", subject_id = ${subject_id}, is_done = ${parseInt(is_done===true ? 1 : 0, 10)} WHERE user_id = ${parseInt(user_id, 10)} AND id = ${parseInt(todo_id, 10)}`;
        console.log(updatesql, "UPDATE_SQL");
        try {
          connection.query(updatesql, (updateErr, result, fields) => {
            if (updateErr) throw updateErr;
            res.status(200).json({ message: 'SUCCESS' });
          });
        } catch (error) {
          return res.status(400).json({ message: error });
        }
      }
    });
  } catch (error) {
    return res.json({ error });
  }
});

router.delete('/:id', verifyToken, (req, res) => {
// router.delete('/:id', (req, res) => {
  //const user_id = // 쿼리 수정
  console.log(req.params.id);
  if (req.params.id === undefined) {
    return res.status(400).send({message: "INVALID_TODO_ID"});
  }
  const todo_id = req.params.id;
  const user_id = req.decoded.userInfo.id;
  // const user_id = 9;
  // console.log(req.decoded.userInfo.id, req.decoded.userInfo.username);
  connection.query(`DELETE FROM todos WHERE id = ${todo_id} AND user_id = ${user_id};`, (err, result) => {
    if (err) throw err;
    console.log(result);
    return res.status(200).send({ message: 'SUCCESS' });
  });
});

module.exports = router;
