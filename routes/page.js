const express = require('express');
const router = express.Router();
const mysql = require('mysql');
const dbconfig = require('../config/database');
const { verifyToken } = require('./middleware');
const con = mysql.createConnection(dbconfig);



// router.get('/', (req, res) => {
//     return res.redirect('/mainpage');
// })



router.get('/mainpage', verifyToken, (req, res) => {
// router.get('/mainpage', (req, res) => {
  const user_id = req.decoded.userInfo.id;
  // const user_id = 9;
//   console.log(req.decoded.userInfo.id, req.decoded.userInfo.username);
  let today = new Date();
  today.setHours(today.getHours() + 9); 
  today = today.toISOString().split('T')[0].substring(0, 19);
  const sql_1 = `SELECT
                      s.id,
                      s.name,
                      c.id as colorId,
                      sd.start_time,
                      sd.updated_at
                  FROM study_durations AS sd 
                  RIGHT JOIN subjects AS s 
                      ON sd.subject_id = s.id 
                  LEFT JOIN colors AS c 
                      ON c.id = s.color_code_id 
                  WHERE (sd.user_id = ${user_id})
                  AND (s.is_deleted = 0)
                  AND (sd.updated_at IS NOT NULL)
                  AND (DATE_FORMAT(sd.start_time, "%Y-%m-%d") = STR_TO_DATE("${today}", "%Y-%m-%d") 
                  OR DATE_FORMAT(sd.updated_at, "%Y-%m-%d") = STR_TO_DATE("${today}", "%Y-%m-%d"));`;
  const sql_2 = `SELECT * FROM colors;`;
  const sql_3 = `SELECT id, name, color_code_id as colorId FROM subjects WHERE user_id = ${user_id} AND is_deleted = 0;`;
  const sql_4 = `SELECT nickname from users WHERE id = ${user_id}`;
  con.query(sql_1 + sql_2 + sql_3+ sql_4, function(err, result){
      if(err) {
          console.log("Error Execution :", err);
          res.send("ERROR");
          throw err;
      };
    //   console.log(result[0])
      const results ={}
      const dateOfToday = new Date(`${today}T00:00:00`);
      const dateOfTomorrow = new Date(`${today}T00:00:00`);
      dateOfTomorrow.setDate(dateOfTomorrow.getDate() + 1);
      results.subjects = result[0].map((data) => {
          const prevFlag = data.start_time - dateOfToday;
          const nextFlag = data.updated_at - dateOfTomorrow;
          const {id, name, colorId} = data;
          let time = ((data["updated_at"]-data["start_time"])/1000);
          return {
              id,
              name,
              colorId,
              startTime: prevFlag < 0 ? dateOfToday : data.start_time,
              endTime: nextFlag > 0 ? dateOfTomorrow : data.updated_at
          }
      })
      results.subjects = results.subjects.map((data) => {
        const {id, name, colorId} = data;
        let time = ((data["endTime"]-data["startTime"])/1000);
        return {
            id,
            name,
            colorId,
            totalTime: time
        }
      }).reduce((prev, curr) => {
          const arr = [...prev];
          const idx = prev.findIndex((elem) => elem.id === curr.id);
          if (idx === -1) {
            arr.push({
              id: curr.id,
              name: curr.name,
              colorId: curr.colorId,
              totalTime: curr.totalTime,
            });
          } else {
            arr[idx].totalTime += curr.totalTime;
          }
          return arr;
        }, []);
        results.subjects = results.subjects.map((data) => {
            const { id, name, colorId } = data;
            let time = data["totalTime"];
            let min = (time/60);
            let hour = (min/60);
            let sec = (time%60);
            min = (min%60);
            function pad(n, width) {
              n = n + '';
              return n.length >= width ? n : new Array(width - n.length + 1).join('0') + n;
            }
            return {
              id,
              name,
              colorId,
              totalTime: `${pad(parseInt(hour), 2)}:${pad(parseInt(min), 2)}:${pad(parseInt(sec), 2)}`
          }
        }) 
      res.send({"study" : results.subjects, "colors" : result[1], "subjects": result[2], "nickname": result[3][0].nickname});
  });
});




router.put('/subject/:id', verifyToken, (req, res) => {
  const user_id = req.decoded.userInfo.id;
  console.log(req.decoded.userInfo.id, req.decoded.userInfo.username);
  const id = req.params.id
  const body = req.body;
  let name;
  let color_id;
  if (body.colorId === undefined | body.colorId === "") {
      return res.status(400).send({message: "INVALID_COLOR"});
  } else {
      color_id = body.colorId;
  }
  if (body.name === undefined | body.name === "") {
      return res.status(400).send({message: "INVALID_NAME"});
  } else {
      name = body.name;
  }
  const subject_check = `SELECT id FROM subjects WHERE user_id=${user_id} AND name="${name}" AND id != ${id}`
  con.query(subject_check, (err, result) => {
      if(err) throw err;
      if (result != "") { ///// if (result) ??
          // console.log(result[0].id, "************")
          return res.status(400).send({message: "SUBJECT_EXISTS"});
      } else {
          const sql = `UPDATE subjects SET name = "${name}", color_code_id = ${color_id} WHERE id = ${id}`;
          con.query(sql, (err, result) => {
          if(err) throw err;
          return res.status(200).send({message: "SUCCESS"});
          })
      }
  })
})


router.delete('/subject/:id', verifyToken, (req, res) => {
  const user_id = req.decoded.userInfo.id;
  console.log(req.decoded.userInfo.id, req.decoded.userInfo.username);
  const id = req.params.id;
  con.query(`UPDATE subjects SET is_deleted = 1 WHERE id = ${id} AND user_id = ${user_id};`, function(err, result) {
      if(err) throw err;
      console.log(result);
      res.status(200).send({message: "SUCCESS"})
  })
})


router.post('/subject', verifyToken, (req, res) => {
//   res.header("Access-Control-Allow-Origin", "*");
//   console.log(req.body)
  const user_id = req.decoded.userInfo.id;
  console.log(req.decoded.userInfo.id, req.decoded.userInfo.username, "/subject");
  const body = req.body;
  if (body.subject === undefined | body.subject === "") {
      return res.status(401).send( {message: "NO_SUBJECT_PROVIDED"} )
  }
  const subject_name = body.subject; // request.get.body ?
  if (body.colorId === undefined) {
      return res.status(401).send( {message: "NO_COLOR_SELECTED"} ) 
  } 
  const color_id = body.colorId;
  con.query(`SELECT * FROM subjects WHERE user_id = ${user_id} AND name = "${subject_name}" AND is_deleted = 0`, function(err, result) {
      if (err) {
          console.log("ERROR Execution: ", err);
          res.send("ERROR");
          throw err;
      }
      console.log("result", result)
      if (result != "") { 
          return res.status(401).send( {message: "SUBJECT_EXISTS"} )
      } else {
          const sql = `INSERT INTO subjects(user_id, name, color_code_id) VALUES (${user_id}, "${subject_name}", "${color_id}")`;
          console.log(sql);
          con.query(sql, function(err, result, fields) {
              if(err) throw err;

              db_index = result.insertId;
              console.log(db_index);

              const sub_sql = `SELECT id, name, color_code_id as colorId FROM subjects WHERE id = ${db_index}`;
              con.query(sub_sql, function (err, result, fields) {
                  if (err) throw err;
                  console.log(err);
                  console.log(...result);
                  return res.send(...result)
              })
          })
      }
  }) 
});

router.post('/studytime', verifyToken, (req, res) => {
// router.post('/studytime', (req, res) => {
  const user_id = req.decoded.userInfo.id;
  // const user_id = 5
  console.log(req.body, "BODY!!!!")
  console.log(req.decoded.userInfo.id, req.decoded.userInfo.username);
  const subject_id = req.body.subjectId
  const start_time = req.body.startTime
  // console.log(req.body, "*****")
  sql = `INSERT INTO study_durations(subject_id, user_id, start_time) VALUES(${subject_id}, ${user_id}, "${start_time}");`
  console.log(sql, "SQL")
  con.query(sql, function(err, result) {
      if(err) throw err;
      db_index = result.insertId;
      console.log(result, db_index, "!!!!!!!!!!!!");
      return res.status(200).send({message: "SUCCESS", id: db_index})
  })
});


router.patch('/studytime/:id', verifyToken, (req, res) => {
// router.patch('/studytime/:id', (req, res) => {
  const user_id = req.decoded.userInfo.id;
  // const user_id = 5;
  console.log(req.decoded.userInfo.id, req.decoded.userInfo.username);
  const study_duration_id = req.params.id;
  const end_time = req.body.endTime;
  sql = `UPDATE study_durations SET updated_at = "${end_time}" WHERE id = ${study_duration_id};`
  con.query(sql, function(err, result) {
      if(err) throw err;
      return res.status(200).send({message: "SUCCESS"})
  })
});




module.exports = router;
