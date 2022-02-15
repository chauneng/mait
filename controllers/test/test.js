'use strict';
const {test} = require('../../models/test')
// const Views = '././views'

// exports.getTest = function (req, res) {
//     Test.getTest(function (err, test) {
//         console.log("controller");
//         if (err) res.send(err);
//         console.log("res", test);
//         res.send(test);
//     });
// };


app.get('/stopwatch', (req, res) => {
    res.header("Access-Control-Allow-Origin", "*");
    const sql = 'SELECT sd.end_time, sd.start_time, s.name, sd.subject FROM study_durations as sd LEFT JOIN subjects as s ON  sd.subject = s.id WHERE sd.user_id = 1'
    con.query(sql, function (err, result, fields) {
        if (err) throw err;
        console.log(err);
        res.send(result)
    });    
});


module.exports = async(req, res) => {

    test(req, res) => {
        res.header("Access-Control-Allow-Origin", "*");
        const sql = 'SELECT sd.end_time, sd.start_time, s.name, sd.subject FROM study_durations as sd LEFT JOIN subjects as s ON  sd.subject = s.id WHERE sd.user_id = 1'
        con.query(sql, function (err, result, fields) {
            if (err) throw err;
            console.log(err);
            res.send(result)
        });    
    });




    // test: function(req, res){
    //     test.test(req.con, function(err) {
    //         console.log()
    //     })
    // }
    // console.log("controllers ---");

    // let testInfo = test
    // console.log(testInfo);

    // console.log("+++++")


}