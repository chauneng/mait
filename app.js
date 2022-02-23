const express = require('express');
const morgan = require('morgan');
// const Router = require('./routers/index');

const bodyParser = require('body-parser');
const cors = require('cors');


const app = express();
const port = 5000;
// require('./db');
// app.use('/', Router);

const mysql = require('mysql');
// const { builtinModules } = require('module');



const { v4: uuidV4 } = require('uuid');
const http = require('http');
const https = require('https');
// const server = https.createServer(app);

const fs = require('fs');
const server = https.createServer(
    {
        key: fs.readFileSync('/etc/letsencrypt/live/mait.shop/privkey.pem'),
        cert: fs.readFileSync('/etc/letsencrypt/live/mait.shop/cert.pem'),
        ca: fs.readFileSync('/etc/letsencrypt/live/mait.shop/chain.pem'),
        requestCert: false,
        rejectUnauthorized: false,
    },
    app
);

app.use(morgan("combined"));

// const server = app.listen(port);
const io = require('socket.io')(server);
// const io = require('socket.io').listen(server);
// app.set('views', __dirname + '/views');
// app.set('views', '/views');
app.set('view engine', 'ejs');
// app.use(express.static('puiblic'));
app.use(express.static(__dirname + '/public'));
// app.use(express.static('public'));


// const options = { // letsencrypt로 받은 인증서 경로를 입력
//     ca: fs.readFileSync('/etc/letsencrypt/live/mait.shop/fullchain.pem'),
//     key: fs.readFileSync('/etc/letsencrypt/live/mait.shop/privkey.pem'),
//     cert: fs.readFileSync('/etc/letsencrypt/live/mait.shop/cert.pem')
//     };





const con = mysql.createConnection({
    host: 'emit.chjtdqatvvwb.ap-northeast-2.rds.amazonaws.com',
    port: 3306,
    user: 'admin',
    password: '12345',
    database: 'emit',
    multipleStatements: true
});


con.connect(function(err) {
    if (err) throw err;
    console.log('Connected');
});


app.use(bodyParser.urlencoded({extended:true}));
app.use(bodyParser.json());



app.get('/cam', (req, res) => {
    res.redirect(`/cam/${uuidV4()}`);
});

app.get('/cam/:room', (req, res) => {
    const room_id = req.params.room
    res.render('room', { roomId: room_id });
  });
  
io.on('connection', (socket) => {
socket.on('join-room', (roomId, userId) => {
    socket.join(roomId);
    socket.to(roomId).broadcast.emit('user-connected', userId);

    socket.on('disconnect', () => {
    socket.to(roomId).broadcast.emit('user-disconnected', userId);
    });
});
});



// const whitelist = ["*"];
app.use(cors());
// app.options('*', cors());
// app.use(cors({
//     origin : "*",
//     methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
//     credentials: true
// }
// ));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));


app.get('/', (req, res) => {
    res.redirect('/mainpage');
});


// app.get('/stopwatch', (req, res) => {
//     // res.header("Access-Control-Allow-Origin", "*");
//     const sql = 'SELECT sd.end_time, sd.start_time, s.name, sd.subject FROM study_durations as sd LEFT JOIN subjects as s ON  sd.subject = s.id WHERE sd.user_id = 1'
//     con.query(sql, function (err, result, fields) {
//         if (err) throw err;
//         console.log(err);
//         res.send(result)
//     });    
// });


// app.post('/stopwatch', (req, res) => {
//     // res.header("Access-Control-Allow-Origin", "*");
//     const body = req.body;
//     const sql = `INSERT INTO study_durations(subject, user_id, start_time, end_time, created_at) VALUES (${body.subject}, ${body.user_id}, ${body.start_time}, ${body.end_time}, NOW())`;
//     console.log(sql);
//     con.query(sql, function(err, result, fields) {
//         if(err) throw err;
//         res.send('success')
//     });
// });



app.get('/mainpage', (req, res) => {
    let today = new Date();
    today.setHours(today.getHours() + 9); 
    today = today.toISOString().split('T')[0].substring(0, 19);
    const user_id = 1;
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
    const sql_2 = `SELECT 
                        t.id,
                        t.content, 
                        t.subject_id AS subjectId, 
                        t.is_done AS isDone
                    FROM todos AS t 
                    LEFT JOIN users AS u 
                        ON u.id = ${user_id}
                    WHERE DATE_FORMAT(t.created_at, "%Y-%m-%d") = STR_TO_DATE("${today}", "%Y-%m-%d");`;
    const sql_3 = `SELECT * FROM colors;`;
    const sql_4 = `SELECT id, name, color_code_id as colorId FROM subjects WHERE user_id = ${user_id} AND is_deleted = 0`;
    con.query(sql_1 + sql_2 + sql_3+ sql_4, function(err, result){
        if(err) {
            console.log("Error Execution :", err);
            res.send("ERROR");
            throw err;
        };
        console.log(result[0])
        const results ={}
        results.subjects = result[0].map((data) => {
            const {id, name, colorId} = data;
            let time = ((data["updated_at"]-data["start_time"])/1000);
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
        res.send({"study" : results.subjects, "todos" : result[1], "colors" : result[2], "subjects": result[3]});
    });
});

app.put('/subject/:id', (req, res) => {
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
    const user_id = 1; // 토큰에서 받기!!
    const subject_check = `SELECT id FROM subjects WHERE user_id=${user_id} AND name="${name}" AND id != ${id}`
    con.query(subject_check, (err, result) => {
        if(err) throw err;
        if (result != "") {
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


app.delete('/subject/:id', (req, res) => {
    const id = req.params.id;
    con.query(`UPDATE subjects SET is_deleted = 1 WHERE id = ${id};`, function(err, result) {
        if(err) throw err;
        console.log(result);
        res.status(200).send({message: "SUCCESS"})
    })
})


app.post('/subject', (req, res) => {
    res.header("Access-Control-Allow-Origin", "*");
    console.log(req.body)
    const body = req.body;
    const user_id = 1; // 토큰에서 가져오기!
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


app.delete('/todos/:id', (req, res) => {
    //const user_id = // 쿼리 수정
    const id = req.params.id;
    con.query(`DELETE FROM todos WHERE id = ${id};`, function(err, result) {
        if(err) throw err;
        // console.log(result);
        return res.status(200).send({message: "SUCCESS"})
    })
})


// app.post('/study_log', (req, res) => {
//     const user_id = 1;
//     let subject_id 
//     if (req.body.subjectId === undefined | req.body.subjectId === "") {
//         const create_sub = `INSERT INTO subjects(user_id, name, color_code_id) VALUES(${user_id}, "UNDEFINED", 1)`
//     }
//     console.log(req.body, "****");
//     sql = `INSERT INTO study_durations(subject_id, user_id, start_time) VALUES(${subject_id}, ${user_id}, NOW());`
//     con.query(sql, function(err, result) {
//         if(err) throw err;
//         db_index = result.insertId;
//         console.log(db_index);
//         return res.status(200).send({message: "SUCCESS", id: db_index})
//     })
// });


app.post('/studytime', (req, res) => {
    const user_id = 1;
    const subject_id = req.body.subjectId
    const start_time = req.body.startTime
    console.log(req.body, "*****")
    sql = `INSERT INTO study_durations(subject_id, user_id, start_time) VALUES(${subject_id}, ${user_id}, "${start_time}");`
    con.query(sql, function(err, result) {
        if(err) throw err;
        db_index = result.insertId;
        console.log(db_index);
        return res.status(200).send({message: "SUCCESS", id: db_index})
    })
});


app.patch('/studytime/:id', (req, res) => {
    const user_id = 1;
    const study_duration_id = req.params.id;
    const end_time = req.body.endTime;
    sql = `UPDATE study_durations SET updated_at = "${end_time}" WHERE id = ${study_duration_id};`
    con.query(sql, function(err, result) {
        if(err) throw err;
        return res.status(200).send({message: "SUCCESS"})
    })
});



app.get('/statistics/edit/', (req, res) => {
    const user_id = 1 /////
    // const date = req.body.date
    const date = "2022-02-21"
    sql = `SELECT id, subject_id, start_time, updated_at FROM study_durations WHERE user_id = ${user_id} AND updated_at is NOT NULL
    AND(DATE_FORMAT(updated_at, "%Y-%m-%d") = STR_TO_DATE("${date}", "%Y-%m-%d") OR DATE_FORMAT(start_time, "%Y-%m-%d") = STR_TO_DATE("${date}", "%Y-%m-%d"));`
    con.query(sql, function(err, result) {
        if(err) throw err;
        return res.status(200).send({message: "SUCCESS", result: result})
    })
})

app.patch('/statistics/:id', (req, res) => {
    const user_id = 1;
    const start_time = req.body.startTime;
    const updated_at = req.body.endTime;
    const id = req.params.id;
    sql = `UPDATE study_durations SET start_time = "${start_time}", updated_at = "${updated_at}" WHERE id=${id} AND user_id = ${user_id};`
    con.query(sql, (err, result) => {
        if(err) throw err;
        console.log(result, "*****")
        return res.status(200).send({message: "SUCCESS"})
    })
})


app.delete('/statistics/:id', (req, res) => {
    const user_id = 1;
    const id = req.params.id;
    sql = `DELETE from study_durations WHERE id = ${id} AND user_id = ${user_id};`
    con.query(sql, (err, result) => {
        if(err) throw err;
        return res.status(204).send()
    })
})




app.listen(port, () => {
    console.log('Express listening on port', port);
});


// // server.listen(port);

// // https.createServer(options, app).listen(443);

// https.createServer(options, app).listen(443, () => {
//     console.log('Express is listening on port', 443);
// });
server.listen(443);

// const io = require('socket.io')(server);