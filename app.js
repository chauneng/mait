const express = require('express');
const globalRouter = require('./routers/stopwatch.js');
const bodyParser = require('body-parser');
const cors = require('cors');


////

const { u4: uuidV4 } = require('uuid');
const fs = require('fs');
const https = require('https');
// const server = https.createServer(
//     {
//       key: fs.readFileSync('/etc/letsencrypt/live/localhost:3000/privkey.pem'),
//       cert: fs.readFileSync('/etc/letsencrypt/live/localhost:3000/cert.pem'),
//       ca: fs.readFileSync('/etc/letsencrypt/live/localhost:3000/chain.pem'),
//       requestCert: false,
//       rejectUnauthorized: false,
//     },
//     app
//   );
// const io = require('socket.io')(server);
  
/////

const app = express();
const port = 3000;
require('./db');

const mysql = require('mysql');
const { builtinModules } = require('module');

// const con = mysql.createConnection({
//     host: 'localhost',
//     user: 'root',
//     password: '12345',
//     database: 'emit'
// });


const con = mysql.createConnection({
    host: 'emit.chjtdqatvvwb.ap-northeast-2.rds.amazonaws.com',
    port: 3306,
    user: 'admin',
    password: 'jungle_emit',
    database: 'emit'
});


con.connect(function(err) {
    if (err) throw err;
    console.log('Connected');
    // con.query('CREATE DATABASE express_db', function (err, result) {
    // if (err) throw err; 
    //     console.log('database created');
    // });
    // const sql = 'query';
    // con.query(sql, function (err, result) {
    //     if (err) throw err;
    //     console.log('table created')
    // });
});


app.use(bodyParser.urlencoded({extended:true}));
app.use(bodyParser.json());



app.get('/cam', (req, res) => {
    res.redirect(`/${uuidV4()}`);
});

// app.get('/:room', ())





app.use('/check', globalRouter);
//app.use(cors());
app.use(cors({
    origin : "*",
    credentials: true
}
));


app.get('/', (req, res) => {
    res.send('express start');
});

app.post('/', (req, res) => {
    const body = req.body;
    console.log(body);
});


app.use(express.json());
app.use(express.urlencoded({ extended: true }));


app.get('/stopwatch', (req, res) => {
    res.header("Access-Control-Allow-Origin", "*");
    const sql = 'SELECT sd.end_time, sd.start_time, s.name, sd.subject FROM study_durations as sd LEFT JOIN subjects as s ON  sd.subject = s.id WHERE sd.user_id = 1'
    con.query(sql, function (err, result, fields) {
        if (err) throw err;
        console.log(err);
        res.send(result)
    });    
});

app.post('/stopwatch', (req, res) => {
    // res.header("Access-Control-Allow-Origin", "*");
    const body = req.body;
    const sql = `INSERT INTO study_durations(subject, user_id, start_time, end_time, created_at) VALUES (${body.subject}, ${body.user_id}, ${body.start_time}, ${body.end_time}, NOW())`;
    console.log(sql);
    con.query(sql, function(err, result, fields) {
        if(err) throw err;
        res.send('success')
    });
});




app.get('/mainpage', (req, res) => {
    res.header("Access-Control-Allow-Origin", "*");
    const sql = 'SELECT s.id, s.name, c.code, sd.start_time, sd.end_time FROM study_durations as sd LEFT JOIN subjects as s ON  sd.subject = s.id LEFT JOIN colors as c ON c.id = s.color_id WHERE sd.user_id = 1'
    con.query(sql, function (err, result, fields) {
        if (err) throw err;
         
        // for (i=0; i)
        // console.log(result);
        const results = {}
        results.subjects = result.map((data) => {
            const {id, name, code, start_time, end_time} = data;
            let calculatedTime = 0;
            return {
                id, 
                name,
                color: code,
                totalTime: calculatedTime
            }
            console.log(data);
        })
        console.log(results);
        res.send(JSON.stringify(results));
    });    
});



app.post('/subject', (req, res) => {
    res.header("Access-Control-Allow-Origin", "*");
    const body = req.body;
    // if (body.subject === "" | body.colorCode)
    const sql = `INSERT INTO subjects(user_id, name, color_id) VALUES (1, "${body.subject}", "${body.colorCode}")`;
    console.log(sql);
    con.query(sql, function(err, result, fields) {
        if(err) throw err;
        db_index = result.insertId;
        console.log(db_index);
        // sql = `SELECT s.id, s.name, c.code FROM subjects AS s LEFT JOIN colors AS c ON c.id = s.color_id WHERE s.user_id = ${db_index}`;
        // con.query(sql, function(err, result, fields) {
        //     if(err) throw err;
        //     console.log(result);
        //     res.send(result);
        // });
        // res.send('success')

        const sub_sql = `SELECT s.id, s.name, c.code as colorCode FROM subjects AS s LEFT JOIN colors AS c ON c.id = s.color_id WHERE s.id = ${db_index}`;

    con.query(sub_sql, function (err, result, fields) {
        if (err) throw err;
        console.log(err);
        
        res.send(...result)
    });  
    });

    // const sub_sql = `SELECT s.id, s.name, c.code FROM subjects AS s LEFT JOIN colors AS c ON c.id = s.color_id WHERE s.id = ${db_index}`;
    // console.log("*****");
    // con.query(sub_sql, function (err, result, fields) {
    //     if (err) throw err;
    //     console.log(err);
    //     res.send(result)
    // });  
});



app.listen(port, () => {
    console.log('Express listening on port', port);
});