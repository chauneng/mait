const express = require('express');
const router = express.Router();
// const mysql = require('mysql');
// const dbconfig = require('../config/database');
// const con = mysql.createConnection(dbconfig);

// router.get('/11', (req, res) => {
//     console.log("*****");
//     res.send("works!")
  
//   });


router.get('/', (req, res) => {
    return res.redirect('/mainpage');
})


module.exports = router;