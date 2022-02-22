const express = require('express');
const router = express.Router();

router.get('/stopwatch', (req, res) => {
  res.header("Access-Control-Allow-Origin", "*");
  const sql = 'SELECT sd.end_time, sd.start_time, s.name, sd.subject FROM study_durations as sd LEFT JOIN subjects as s ON  sd.subject = s.id WHERE sd.user_id = 1'
  con.query(sql, function (err, result, fields) {
      if (err) throw err;
      console.log(err);
      res.send(result)
  });    
});

router.post('/stopwatch', (req, res) => {
  // res.header("Access-Control-Allow-Origin", "*");
  const body = req.body;
  const sql = `INSERT INTO study_durations(subject, user_id, start_time, end_time, created_at) VALUES (${body.subject}, ${body.user_id}, ${body.start_time}, ${body.end_time}, NOW())`;
  console.log(sql);
  con.query(sql, function(err, result, fields) {
      if(err) throw err;
      res.send('success')
  });
});

module.exports = router;
