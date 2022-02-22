const morgan = require('morgan');
const express = require('express');
const mysql = require('mysql');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const dotenv = require('dotenv');
const dbconfig = require('./config/database');
const todosRouter = require('./routes/todos');
const statisticsRouter = require('./routes/statistics');
const authRouter = require('./routes/auth');
const pageRouter = require('./routes/page');
const { v4: uuidV4 } = require('uuid');
const http = require('http');
const https = require('https');
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

const io = require('socket.io')(server);
app.set('view engine', 'ejs');
app.use(express.static(__dirname + '/public'));
con.connect(function(err) {
    if (err) throw err;
    console.log('Connected');
});

app.use(bodyParser.urlencoded({extended:true}));
app.use(bodyParser.json());


dotenv.config();

// const { v4: uuidV4 } = require('uuid');
const { verifyToken } = require('./routes/middleware');

const connection = mysql.createConnection(dbconfig);
// const jwt = require('./modules/jwt');
const app = express();

const corsOptions = {
  origin: '*',
  credentials: true,
};

// app.set('port', process.env.PORT || 3001);
const port = 5000;
app.use(cors(corsOptions));
app.use(morgan('dev'));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cookieParser(process.env.COOKEY_SECRET_KEY));

app.use('/', pageRouter);
app.use('/todos', todosRouter);
app.use('/statistics', statisticsRouter);
app.use('/auth', authRouter);

app.set('view engine', 'ejs');
app.engine('html', require('ejs').renderFile);



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


app.use((req, res, next) => {
  const error = new Error(`${req.method} ${req.url} 라우터가 없습니다.`);
  error.status = 404;
  next(error);
});

app.use((err, req, res, next) => {
  res.locals.message = err.message;
  res.locals.error = process.env.NODE_ENV !== 'production' ? err : {};
  res.status(err.status || 500);
  res.render('error');
});

// app.listen(app.get('port'), () => {
//   console.log(`Express server listening on port ${app.get('port')}`);
// });

app.listen(port, () => {
    console.log('Express listening on port', port);
});

server.listen(443);