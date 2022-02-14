

export async function test(req, res) {
        const sql = 'SELECT sd.end_time, sd.start_time, s.name, sd.subject FROM study_durations as sd LEFT JOIN subjects as s ON  sd.subject = s.id WHERE sd.user_id = 1'
        con.query(sql, function (err, result, fields) {
            if (err) throw err;
            console.log(err);
            res.send(result)

}


//     test: function(req, res) {
//         const sql = 'SELECT sd.end_time, sd.start_time, s.name, sd.subject FROM study_durations as sd LEFT JOIN subjects as s ON  sd.subject = s.id WHERE sd.user_id = 1'
//         con.query(sql, function (err, result, fields) {
//             if (err) throw err;
//             console.log(err);
//             res.send(result)

//          }
// }



// module.exports ={
//     test: function(con, callback) {
//         const sql = 'SELECT sd.end_time, sd.start_time, s.name, sd.subject FROM study_durations as sd LEFT JOIN subjects as s ON  sd.subject = s.id WHERE sd.user_id = 1'
//         con.query(sql, function (err, result, fields) {
//             if (err) throw err;
//             console.log(err);
//             res.send(result)

//          }
// }






// 'use strict';

// const mysql = require('mysql');
// const db = require('../db');

// let Test = function(test) {
//     this.startTime = test.start_time;
//     this.endTime = test.end_time;
//     this.name = test.name;
//     this.subject = test.subject;
// };

// const 


// Test.getTest = function(result) {
//     mysql.query(
//         `SELECT sd.end_time, sd.start_time, s.name, sd.subject 
//         FROM study_durations as sd 
//         LEFT JOIN subjects as s 
//         ON  sd.subject = s.id 
//         WHERE sd.user_id = 1`
//     , function (err, res) {
//         if (err) {
//             console.log("error: ", err);
//             result(null, err);
//         } else {
//             console.log("result ", res);
//             result(null, res);
//         }
//     });
// }

// module.exports = Test;

// module.exports = {

//     getTest: function() {
//         return new Promise ((resolve, reject) => {
//             const con = mysql.createConnection(db);
//             con.query(
//                 `SELECT sd.end_time, sd.start_time, s.name, sd.subject 
//                 FROM study_durations as sd 
//                 LEFT JOIN subjects as s 
//                 ON  sd.subject = s.id 
//                 WHERE sd.user_id = 1`, (err, result, fields) => {
//                     if(err){
//                         reject(err);
//                     } else {
//                         resolve(result);
//                     }
//                 });
//             con.end();
//         });
//     }
// }