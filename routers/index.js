const express = require('express');
const router = express.Router();
const controllers = require("../controllers/index")
// const roomModules = require('../controllers/room/roomModules')


// app.get('/', (req, res) => {
//     res.send('express start');
// });

router.get('/test', controllers.test);

module.exports = router;