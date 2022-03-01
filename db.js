const mysql = require('mysql');

const con = mysql.createConnection({
    host: 'emit.chjtdqatvvwb.ap-northeast-2.rds.amazonaws.com',
    user: 'admin',
    password: 'emit_to_mait',
    database: 'emit',
    multipleStatements: true
});

con.connect(function(err) {
    if (err) throw err;
    console.log('Connected');
});

module.exports = con;