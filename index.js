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
const testRouter = require('./routes/test'); ////////////
const { v4: uuidV4 } = require('uuid');
const http = require('http');
const https = require('https');
const app = express();
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

// const io = require('socket.io')(server);
const io = require("socket.io")(server, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"]
    }
  });

app.set('view engine', 'ejs');
app.use(express.static(__dirname + '/public'));

const con = mysql.createConnection({
  host: 'emit.chjtdqatvvwb.ap-northeast-2.rds.amazonaws.com',
  port: 3306,
  user: 'admin',
  password: "12345",
  database: 'emit',
  multipleStatements: true
});

con.connect(function(err) {
    if (err) throw err;
    console.log('Connected');
});

const bodyParser = require('body-parser');
app.use(bodyParser.urlencoded({extended:true}));
app.use(bodyParser.json());


dotenv.config();

// const { v4: uuidV4 } = require('uuid');
const { verifyToken } = require('./routes/middleware');

const connection = mysql.createConnection(dbconfig);
// const jwt = require('./modules/jwt');

const corsOptions = {
  origin: 'https://maitapp.click',
  // origin: '*',
  credentials: true,
};

// const io = require("socket.io")(server, {
//     cors: {
//       origin: "*",
//       methods: ["GET", "POST"]
//     }
//   });


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

app.use('/test', testRouter);

app.set('view engine', 'ejs');
app.engine('html', require('ejs').renderFile);



app.get('/cam', verifyToken, (req, res) => {
    console.log("cam entered!!");
    const room_id = uuidV4();
    const user_id = req.decoded.userInfo.id;
    const sql = `SELECT nickname from users WHERE id = ${user_id}`;
    con.query(sql, (err, result) => {
      if (err) throw err;
      console.log("result", result[0].nickname);
      res.send( {message: "SUCCESS", roomid: `${room_id}`, userName: `${result[0].nickname}`} );
    });
    // res.redirect(`/cam/${uuidV4()}`);
    // res.send( {message: "SUCCESS", roomid: `${room_id}`, userName: `${nickname}`} );
});

app.get('/cam/:room', verifyToken, (req, res) => {
    const user_id = req.decoded.userInfo.id;
    const room_id = req.params.room
    console.log(room_id, "room");
    const sql = `SELECT nickname from users WHERE id = ${user_id}`;
    // res.render('room', { roomId: room_id });
    con.query(sql, (err, result) => {
      if (err) throw err;
      console.log("result", result[0].nickname);
      res.send({message: "SUCCESS", userName: `${result[0].nickname}`})
    });
    // res.send({message: "SUCCESS"})
    // res.send( {message : "SUCCESS", roomid : `${room_id}`} );
  });


////////// local에서 돌릴 때 -----
//   app.get('/cam', (req, res) => {
//     console.log("cam entered!!");
//     const room_id = uuidV4();
//     const user_id = 1;
//     const sql = `SELECT nickname from users WHERE id = ${user_id}`;
//     con.query(sql, (err, result) => {
//       if (err) throw err;
//       console.log("result", result[0].nickname);
//       res.send( {message: "SUCCESS", roomid: `${room_id}`, userName: `${result[0].nickname}`} );
//     });
//     // res.redirect(`/cam/${uuidV4()}`);
//     // res.send( {message: "SUCCESS", roomid: `${room_id}`, userName: `${nickname}`} );
// });

// app.get('/cam/:room', (req, res) => {
//   const user_id = 1;
//   const room_id = req.params.room
//   console.log(room_id, "room");
//   const sql = `SELECT nickname from users WHERE id = ${user_id}`;
//   // res.render('room', { roomId: room_id });
//   con.query(sql, (err, result) => {
//     if (err) throw err;
//     console.log("result", result[0].nickname);
//     res.send({message: "SUCCESS", userName: `${result[0].nickname}`})
//   });
//   // res.send({message: "SUCCESS"})
//   // res.send( {message : "SUCCESS", roomid : `${room_id}`} );
// });

/////////로컬에서 돌릴 때 -----






  //// 현세
  let socketList = {};
  let participants = {};

  // app.use(express.static(path.join(__dirname, 'public')));
  
  // if (process.env.NODE_ENV === 'production') {
  //   app.use(express.static(path.join(__dirname, '../client/build')));
  
  //   app.get('/*', function (req, res) {
  //     res.sendFile(path.join(__dirname, '../client/build/index.html'));
  //   });
  // }
  
  // Route
  app.get('/ping', (req, res) => {
    res
      .send({
        success: true,
      })
      .status(200);
  });
  
  // Socket
  io.on('connection', (socket) => {
    console.log(`New User connected: ${socket.id}`);
  
    socket.on('disconnect', () => {
      socket.disconnect();
      console.log('User disconnected!');
    });
  
    socket.on('check-user', ({ roomId, userName }) => {
      let error = false;
  
      io.sockets.in(roomId).clients((err, clients) => {
        clients.forEach((client) => {
          if (socketList[client] == userName) {
            error = true;
          }
        });
        socket.emit('error-user-exist', { error });
      });
    });
  
    /**
     * Join Room
     */
    socket.on('join-room', (roomId, userName) => {
      // Socket Join RoomName
      socket.join(roomId);
      participants[userName] =  socket.id;
      console.log(participants);
      socketList[socket.id] = { userName, video: true, audio: true };
      console.log(socketList, "socket list");
      // Set User List  
      io.sockets.in(roomId).clients((err, clients) => {
        try {
          const users = [];
          clients.forEach((client) => {
            // Add User List
            users.push({ userId: client, info: socketList[client] });
          });
          socket.broadcast.to(roomId).emit('user-join', users);
        } catch (e) {
          io.sockets.in(roomId).emit('error-user-exist', { err: true });
        }
      });
    });
  
    socket.on('call-user', ({ userToCall, from, signal }) => {
      io.to(userToCall).emit('receive-call', {
        signal,
        from,
        info: socketList[socket.id],
      });
    });
  
    socket.on('accept-call', ({ signal, to }) => {
      io.to(to).emit('call-accepted', {
        signal,
        answerId: socket.id,
      });
    });
  
    socket.on('send-message', ({ roomId, msg, sender }) => {
      io.sockets.in(roomId).emit('receive-message', { msg, sender });
    });

    socket.on('siren', ({sender, receiver}) => {
      const caller_id = participants[sender];
      const callee_id = participants[receiver];
      console.log(`FROM ${sender} TO ${receiver}`);
      io.sockets.to(callee_id).emit('siren-fire', sender);
    })
  
    socket.on('leave-room', ({ roomId, leaver }) => {
      console.log(socketList, "SOCKET LIST before");
      delete socketList[socket.id];
      // delete participants.find()
      console.log(socketList, "SOCKET LIST after");
      socket.broadcast
        .to(roomId)
        .emit('user-leave', { userId: socket.id, userName: [socket.id] });
      io.sockets.sockets[socket.id].leave(roomId);
    });
  
    socket.on('toggle-camera-audio', ({ roomId, switchTarget }) => {
      if (switchTarget === 'video') {
        socketList[socket.id].video = !socketList[socket.id].video;
      } else {
        socketList[socket.id].audio = !socketList[socket.id].audio;
      }
      socket.broadcast
        .to(roomId)
        .emit('toggle-camera', { userId: socket.id, switchTarget });
    });
  });

  ////



  
// io.on('connection', (socket) => {
// console.log("socket", socket.id);
// /// test
// socket.on("me", (id) => {
//     console.log("id", id);
//     socket.emit('new-message', 'message!');
// })
// socket.on("new-message", (message) => {
//     console.log("*******");
//     console.log(message);
//     });
// ////

// socket.on('join-room', (roomId, userId) => {
//     socket.join(roomId);
//     console.log("roomId : ", roomId, "userId : ", userId );
//     console.log("****");
//     socket.to(roomId).broadcast.emit('user-connected', userId);

//     // socket.on("new-message", () => {
//     // console.log("*******");
//     // });

//     socket.on('disconnect', () => {
//     console.log("roomId : ", roomId, "userId : ", userId );
//     socket.to(roomId).broadcast.emit('user-disconnected', userId);
//     });
// });
// });


// app.use((req, res, next) => {
//   const error = new Error(`${req.method} ${req.url} 라우터가 없습니다.`);
//   error.status = 404;
//   next(error);
// });

// app.use((err, req, res, next) => {
//   res.locals.message = err.message;
//   res.locals.error = process.env.NODE_ENV !== 'production' ? err : {};
//   res.status(err.status || 500);
//   res.render('error');
// });

// app.listen(app.get('port'), () => {
//   console.log(`Express server listening on port ${app.get('port')}`);
// });

app.listen(port, () => {
    console.log('Express listening on port', port);
});

server.listen(443);