const express = require('express');
// const Router = require('./routers/index');
// const globalRouter = require('./routers/stopwatch.js');
const bodyParser = require('body-parser');
const cors = require('cors');


const app = express();
const port = 5000;
// require('./db');
// app.use('/', Router);
// const mysql = require('mysql2/promise');
const mysql = require('mysql');
// const { builtinModules } = require('module');

const http = require('http');
const Pool = require('mysql/lib/Pool');
const server = http.createServer(app);

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
    database: 'emit_2',
    multipleStatements: true
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




//app.use(cors());
app.use(cors({
    origin : "*",
    credentials: true
}
));



// app.get('/', (req, res) => {
//     res.send('express start');
// });



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




///

app.get('/mainpage', (req, res) => {
    const sql_1 = 'SELECT s.id, s.name, c.code, sd.start_time, sd.end_time FROM study_durations as sd LEFT JOIN subjects as s ON sd.subject = s.id LEFT JOIN colors as c ON c.id = s.color_id WHERE sd.user_id = 1;'
    const sql_2 = 'SELECT t.content, t.subject_id, t.is_done FROM todos AS t LEFT JOIN users AS u ON u.id = 1;'
    con.query(sql_1 + sql_2, function(err, result){
        if(err) {
            console.log("Error Execution :", err);
            res.send("오류");
            throw err;
        };
        const results ={}
        let res_subject = result[0];
        let res_todo = result[1];
        results.subjects = result.map((data) => {
            const {id, name, code, start_time, end_time, is_done, subject, } = data;
            let calculatedTime = 0;
            return {
                id, 
                name,
                color: code,
                totalTime: calculatedTime
            }
        });
        results.todos = result[1]
        console.log(results);
        res.send({"subjects" : res_subject, "todos" : res_todo});

    });
    con.end();

})





// app.get('/mainpage', (req, res) => {
//     res.header("Access-Control-Allow-Origin", "*");
//     const result = {};
//     const sql = 'SELECT s.id, s.name, c.code, sd.start_time, sd.end_time, t.content, t.subject_id, t.is_done FROM study_durations as sd LEFT JOIN subjects as s ON  sd.subject = s.id LEFT JOIN colors as c ON c.id = s.color_id LEFT JOIN todos as t ON sd.user_id = t.user_id WHERE sd.user_id = 1'
//     con.query(sql, function (err, result, fields) {
//         if (err) throw err;
//         const results = {}
//         results.subjects = result.map((data) => {
//             const {id, name, code, start_time, end_time, is_done, subject, } = data;
//             let calculatedTime = 0;
//             return {
//                 id, 
//                 name,
//                 color: code,
//                 totalTime: calculatedTime
//             }
//         })

//         // console.log(results, "results");
//         result = [results];
//         const sql_todo = `SELECT t.content, t.subject_id, t.is_done FROM todos AS t LEFT JOIN users AS u ON u.id = t.user_id WHERE u.id = 1`
//         console.log(result, "result")
//         res.send(JSON.stringify(result));
//     })
//     console.log(result, "***");
    
// });



app.post('/subject', (req, res) => {
    res.header("Access-Control-Allow-Origin", "*");
    const body = req.body;
    const subject = body.subject;
    const color_code= body.colorCode;
    
    con.query(``)


    // if (body.subject === "" | body.colorCode)
    const sql = `INSERT INTO subjects(user_id, name, color_id) VALUES (1, "${subject}", "${color_code}")`;
    console.log(sql);
    con.query(sql, function(err, result, fields) {
        if(err) throw err;
        db_index = result.insertId;
        console.log(db_index);
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