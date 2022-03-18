const mysql = require('mysql');

const dbconfig = require('../config/database');
const con = mysql.createConnection(dbconfig);

function updateUserToken(id, accessToken) {
  con.query(`UPDATE users SET token = "${accessToken}" WHERE id = ${id};`);
}

function findByUsername(username) {
  return new Promise((resolve, reject) => {
    con.query(`SELECT * FROM users WHERE username = "${username}" AND social_type_id IS NULL;`,
    (error, row) => {
      if (error) {
        reject(error);
        return;
      }
      resolve(row)
    });
  });
}

module.exports = {
  findByUsername,
  updateUserToken
}