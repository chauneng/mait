const express = require('express');
const globalRouter = express.Router();

globalRouter.get('/', (req, res) => {
    res.send('router!');
});

module.exports = globalRouter;