const express = require('express');
const mysql = require('mysql');
// const mysql = require('mysql2/promise');
const { verifyToken } = require('./middleware');

const dbconfig = require('../config/database');

// const pool = mysql.createPool(dbconfig);
const router = express.Router();
const con = mysql.createConnection(dbconfig);


// 다른 파일로 빼도 좋을 것 같습니다. 여기부터
function dateToReturnFormat(date){
  return date.toISOString().replace('T', ' ').substring(0, 19);
}

function msToHmsFormat(time) {
  const sec = Math.floor((time / 1000) % 60);
  const min = Math.floor((time / (1000 * 60)) % 60);
  const hour = Math.floor((time / (1000 * 60 * 60)) % 24);
  return `${String(hour).padStart(2, '0')}:${String(min).padStart(2, '0')}:${String(sec).padStart(2, '0')}`
}

// function toKoreaTimeZone(date){
//   date.setHours(date.getHours() + 9); 
// }

function rowsToDailyResponseData(rows, today) {
  // console.log(rows, "*****");
  const dateOfToday = new Date(`${today}T00:00:00`);
  // console.log(dateOfToday, "dateoftoday");///
  const dateOfTomorrow = new Date(`${today}T00:00:00`);
  dateOfTomorrow.setDate(dateOfTomorrow.getDate() + 1);
  // console.log((dateOfTomorrow), "******");//
  const [userLog, subjects] = rows; 
  const rangeTimeRaw = userLog
  .map(item => {
    const prevFlag = item.start_time - dateOfToday;
    const nextFlag = item.updated_at - dateOfTomorrow;
    return {
      subjectId: item.subject_id,
      subjectName: item.name, 
      color: `#${item.code}`,
      startTime: prevFlag < 0 ? dateOfToday : item.start_time,
      endTime: nextFlag > 0 ? dateOfTomorrow : item.updated_at,
    }
  });
  
  const rangeTime = rangeTimeRaw.map(item => {
    const startTime = new Date(item.startTime.getTime());
    const endTime = new Date(item.endTime.getTime());
    // toKoreaTimeZone(startTime);
    // toKoreaTimeZone(endTime);
    return {...item, startTime:dateToReturnFormat(startTime), endTime:dateToReturnFormat(endTime)}
  })
  
  let subjectTotalTime = subjects.map(item => {
    return {
      subjectId: item.id,
      subjectName: item.name,
      color: `#${item.code}`,
      totalTime: 0,
    }
  })

  subjectTotalTime = rangeTimeRaw.reduce((prev, curr) => {
    const arr = [...prev];
    const idx = prev.findIndex((elem) => elem.subjectId === curr.subjectId);
    console.log(arr, "arr");
    console.log(idx, "idx");
    console.log(arr[idx].totalTime, "********************");
    arr[idx].totalTime += curr.endTime - curr.startTime;
    return arr;
  }, subjectTotalTime)
  .map(item => {
    return {
      ...item,
      totalTime:msToHmsFormat(item.totalTime)
    }
  })

  return { rangeTime, subjectTotalTime }
}

function makeSubjectColorPair(subjectRow) {
  return subjectRow.reduce((prev, curr) => {
    const newObject = {...prev}
    newObject[curr.name] = `#${curr.code}`
    return newObject;
  }, {})
}

function makeSubjectTodo(todoRow) {
  const returnObj = {};
  const summary = todoRow.reduce((prev, curr) => {
    const newObject = {...prev}
    if(!(curr.name in newObject)){
      newObject[curr.name] = {
        count: 1,
        complete: curr.is_done,
      }
    }
    else{
      newObject[curr.name].count += 1;
      newObject[curr.name].complete += curr.is_done;
    }
    return newObject;
  }, {});
  for(const item in summary){
    returnObj[item] = summary[item].complete / summary[item].count
  }
  return returnObj;
}

function getDayTotalTime(timeRow, day) {
  
  const dayData = timeRow.filter(item => {
    const nextDay = new Date(day.getTime());
    nextDay.setDate(nextDay.getDate() + 1);
    return item.start_time >= day && item.start_time < nextDay;
  })
  
  const returnObj = dayData.reduce((prev, curr) => {
    const newObject = {...prev}
    if(!(curr.name in newObject)){
      newObject[curr.name] = {
        totalTime: curr.updated_at - curr.start_time,
      }
    }
    else{
      newObject[curr.name].totalTime += curr.updated_at - curr.start_time
    }
    return newObject
  }, {})

  for(const item in returnObj){
    returnObj[item].totalTime = msToHmsFormat(returnObj[item].totalTime);
  }
  return returnObj;
}

function splitTimeRow(timeRow) {
  return timeRow.flatMap(item => {
    const startDate = new Date(item.start_time.getTime());
    // toKoreaTimeZone(startDate);
    const today = dateToReturnFormat(startDate).substring(0, 10);
    const splitPoint = new Date(`${today}T00:00:00`);
    splitPoint.setDate(splitPoint.getDate() + 1);
    if(splitPoint < item.updated_at){
      // 쪼개는 경우
      const {subject_id, start_time, updated_at, name, code} = item
      return [{
        subject_id, 
        start_time, 
        updated_at: splitPoint, 
        name, 
        code,
      },
      {
        subject_id, 
        start_time: splitPoint, 
        updated_at, 
        name, 
        code,
      }]
    }
    else{
      return item;
    }
  });
}

function makeSubjectTotalTime(timeRow, startDate, endDate) {
  const [startYear, startMonth, startDay] = startDate.split('-').map(item => parseInt(item));
  const startDateObj = new Date(startYear, startMonth - 1, startDay);
  const [endYear, endMonth, endDay] = endDate.split('-').map(item => parseInt(item));
  const endDateObj = new Date(endYear, endMonth - 1, endDay);
  
  const returnObj = {}
  timeRow = splitTimeRow(timeRow);
  while(startDateObj <= endDateObj){
    const currentDate = new Date(startDateObj.getTime())
    // toKoreaTimeZone(currentDate);
    const dateKey = dateToReturnFormat(currentDate).substring(0, 10);
    returnObj[dateKey] = getDayTotalTime(timeRow, startDateObj);
    startDateObj.setDate(startDateObj.getDate() + 1);
  }
  return returnObj;
}
// 다른 파일로 빼도 좋을 것 같습니다. 여기까지 

router.get('/daily', verifyToken, async (req, res) => {
  // router.get('/daily', verifyToken, async (req, res) => {
  const { userInfo } = req.decoded;
  // const userInfo = {id: 1}
  // const user_id = req.decoded.userInfo.id;
  console.log(req.decoded.userInfo.id, req.decoded.userInfo.username);
  const { today } = req.query;
  console.log(today);
  
  try {
    const sql = `SELECT sd.subject_id, 
    sd.start_time, 
    sd.updated_at, 
    s.name,
    c.code 
    FROM study_durations AS sd
    JOIN subjects AS s 
    ON sd.subject_id = s.id
    JOIN colors AS c
    ON c.id = s.color_code_id 
    WHERE sd.user_id = ${parseInt(userInfo.id, 10)}
    AND updated_at IS NOT NULL
    AND (date_format(sd.updated_at, "%Y-%m-%d") = STR_TO_DATE("${today}", "%Y-%m-%d") 
    OR date_format(sd.start_time, "%Y-%m-%d") = STR_TO_DATE("${today}", "%Y-%m-%d"));`;
    const sql2 = `SELECT subjects.id, subjects.name, colors.code FROM emit.subjects JOIN colors ON subjects.color_code_id = colors.id WHERE subjects.user_id = ${parseInt(userInfo.id, 10)};`
    con.query(sql + sql2, (err, row) => {
      if (err) throw err;
      return res.json(rowsToDailyResponseData(row, today));
    });
  } catch (error) {
    return res.json({ error });
  }
});

router.get('/period', verifyToken, async (req, res) => {
// router.get('/period', async (req, res) => {
  const { userInfo } = req.decoded;
  // const userInfo = {id:1}
  if (req.query === "") {
    return res.status(400).send( {message: "INVALID_DATES"})
  };
  const { startDate, endDate } = req.query;
  console.log(req.query);
  console.log(endDate);
  const [endYear, endMonth, endDay] = endDate.split('-').map(item => parseInt(item));
  const endDateObj = new Date(endYear, endMonth - 1, endDay);
  // toKoreaTimeZone(endDateObj);
  endDateObj.setDate(endDateObj.getDate() + 1);
  const realEndDate = dateToReturnFormat(endDateObj).substring(0, 10)
  try {
    const subjectQ = `SELECT subjects.name, colors.code 
      FROM emit.subjects 
      JOIN colors ON subjects.color_code_id = colors.id 
      WHERE subjects.user_id = ${parseInt(userInfo.id, 10)};`
    const todoQ = `SELECT s.name, s.color_code_id, t.is_done, t.created_at
      FROM todos AS t
      JOIN subjects As s ON t.subject_id = s.id
      WHERE s.user_id = ${parseInt(userInfo.id, 10)}
      AND t.created_at BETWEEN STR_TO_DATE("${startDate}", "%Y-%m-%d") AND STR_TO_DATE("${realEndDate}", "%Y-%m-%d)");`;
    const timeQ = `SELECT sd.subject_id, sd.start_time, sd.updated_at, s.name, c.code 
      FROM study_durations AS sd
      JOIN subjects AS s 
      ON sd.subject_id = s.id
      JOIN colors AS c
      ON c.id = s.color_code_id
      WHERE sd.user_id = ${parseInt(userInfo.id, 10)}
      AND updated_at IS NOT NULL
      AND ((sd.start_time >= STR_TO_DATE("${startDate}", "%Y-%m-%d") AND sd.start_time < STR_TO_DATE("${realEndDate}", "%Y-%m-%d"))
      OR (sd.updated_at >= STR_TO_DATE("${startDate}", "%Y-%m-%d") AND sd.updated_at < STR_TO_DATE("${realEndDate}", "%Y-%m-%d")));`;
     // await connection.query(sql, async (err, row) => {
    con.query(subjectQ + todoQ + timeQ, async (err, row) => {
      if (err) throw err;
      const [subjectRow, todoRow, timeRow] = row;
      timeRow.forEach(item => {
        console.log(item.start_time+1);
        console.log(item.updated_at+1);
        console.log();
      });

      console.log("subjectColorPair : ",makeSubjectColorPair(subjectRow),
      "subjectTotalTime : ", makeSubjectTotalTime(timeRow, startDate, endDate),
      "subjectTodo : ", makeSubjectTodo(todoRow))

      return res.json( {
        subjectColorPair: makeSubjectColorPair(subjectRow),
        subjectTotalTime: makeSubjectTotalTime(timeRow, startDate, endDate),
        subjectTodo: makeSubjectTodo(todoRow),
      }) ;
    });
  } catch (error) {
    return res.json({ error });
  }
});

router.get('/edit', verifyToken, (req, res) => {
  const user_id = req.decoded.userInfo.id;
  console.log(req.decoded.userInfo.id, req.decoded.userInfo.username);
  const date = req.body.date /// 키값 확인
  // const date = "2022-02-21"
  sql = `SELECT id, subject_id, start_time, updated_at FROM study_durations WHERE user_id = ${user_id} AND updated_at is NOT NULL
  AND(DATE_FORMAT(updated_at, "%Y-%m-%d") = STR_TO_DATE("${date}", "%Y-%m-%d") OR DATE_FORMAT(start_time, "%Y-%m-%d") = STR_TO_DATE("${date}", "%Y-%m-%d"));`
  con.query(sql, function(err, result) {
      if(err) throw err;
      return res.status(200).send({message: "SUCCESS", result: result})
  })
})

router.patch('/:id', verifyToken, (req, res) => {
  const user_id = req.decoded.userInfo.id;
  console.log(req.decoded.userInfo.id, req.decoded.userInfo.username);
  const start_time = req.body.startTime;
  const updated_at = req.body.endTime;
  const id = req.params.id;
  sql = `UPDATE study_durations SET start_time = "${start_time}", updated_at = "${updated_at}" WHERE id=${id} AND user_id = ${user_id};`
  con.query(sql, (err, result) => {
      if(err) throw err;
      return res.status(200).send({message: "SUCCESS"})
  })
})


router.delete('/:id', verifyToken, (req, res) => {
  const user_id = req.decoded.userInfo.id;
  console.log(req.decoded.userInfo.id, req.decoded.userInfo.username);
  const id = req.params.id;
  sql = `DELETE from study_durations WHERE id = ${id} AND user_id = ${user_id};`
  con.query(sql, (err, result) => {
      if(err) throw err;
      return res.status(204).send()
  })
})

router.get('/ranking', verifyToken, (req, res) => {
// router.get('/ranking', (req, res) => {
  const user_id  = req.decoded.userInfo.id;
  let today = new Date();
  console.log(today);
  today.setHours(today.getHours() + 9); 
  today = today.toISOString().split('T')[0].substring(0, 19);
  console.log(`today is ${today}`);
  sql = `SELECT 
            sd.start_time, 
            sd.updated_at,
            sd.user_id as userId,
            u.nickname
         FROM study_durations AS sd
         LEFT JOIN users AS u
            ON sd.user_id = u.id
         WHERE sd.updated_at IS NOT NULL
            AND (DATE_FORMAT(sd.start_time, "%Y-%m-%d") = STR_TO_DATE("${today}", "%Y-%m-%d") 
            OR DATE_FORMAT(sd.updated_at, "%Y-%m-%d") = STR_TO_DATE("${today}", "%Y-%m-%d"));`
  con.query(sql, (err, result) => {
    if(err) throw err;
    const results = {}
    const dateOfToday = new Date(`${today}T00:00:00`);
    const dateOfTomorrow = new Date(`${today}T00:00:00`);
    dateOfTomorrow.setDate(dateOfTomorrow.getDate() + 1);
    results.ranking = result.map((data) => {
      const prevFlag = data.start_time - dateOfToday;
      const nextFlag = data.updated_at - dateOfTomorrow;
      let { userId, nickname, startTime, updated_at } = data;
      return {
        userId,
        nickname,
        startTime: prevFlag < 0 ? dateOfToday : data.start_time,
        endTime: nextFlag > 0 ? dateOfTomorrow : data.updated_at
      }
    })
      results.ranking = results.ranking.map((data) => {
        let time = (data["endTime"]-data["startTime"]);
        let { userId, nickname, startTime, endTime } = data;
        return {
            userId,
            nickname,
            totalTime: time
        }
      }).reduce((prev, curr) => {
      const arr = [...prev];
      const idx = prev.findIndex((elem) => elem.userId === curr.userId);
      if (idx === -1) {
        arr.push({
          userId: curr.userId,
          nickname: curr.nickname,
          totalTime: curr.totalTime
        });
      } else {
        arr[idx].totalTime += curr.totalTime;
      }
      return arr;
    }, []);
    results.ranking = results.ranking.sort((a, b) => (a.totalTime < b.totalTime? 1:-1));
    const rank = results.ranking.findIndex(outcome => outcome.userId === user_id);
    return res.status(200).send({message: "SUCCESS", result: results.ranking, rank: `${rank+1}`});
    // return res.status(200).send({message: "SUCCESS", result: results.ranking, rank: 1});
  })
})


module.exports = router;
