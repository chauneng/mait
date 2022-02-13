const mysql = require('mysql');

const con = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '12345',
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