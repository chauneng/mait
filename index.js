const express = require('express');
const morgan = require('morgan');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const dotenv = require('dotenv');

const todosRouter = require('./routes/todos');
const statisticsRouter = require('./routes/statistics');
const authRouter = require('./routes/auth');
const pageRouter = require('./routes/page');
const camstudyRouter = require('./routes/camstudy')
const http = require('http');
const https = require('httpolyglot')
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

dotenv.config();
const io = require("socket.io")(server, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"]
    }
  });

app.use(express.urlencoded({extended:true}));
const exp = require('constants');
app.use(exp.json());

const corsOptions = {
  origin: [ 'https://maitapp.click', 'https://maitapp2.click' ],
  credentials: true,
};

const port = 5001;
app.use(cors(corsOptions));
app.use(morgan('dev'));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cookieParser(process.env.COOKEY_SECRET_KEY));

app.use('/', pageRouter);
app.use('/todos', todosRouter);
app.use('/statistics', statisticsRouter);
app.use('/auth', authRouter);
app.use('/cam', camstudyRouter);

app.get('/', (req, res) => {
  console.log("HERE GET");
  res.send("SUCCESS")
})

  let socketList = {};
  let participants = {};

  app.get('/ping', (req, res) => {
    res
      .send({
        success: true,
      })
      .status(200);
  });
  // Socket
  io.on('connection', (socket) => {
  
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
  
    socket.on('join-room', ({roomId, userName, userUniqueId}) => {
      socket.join(roomId);
      participants[userUniqueId] =  socket.id;
      socketList[socket.id] = { userName, userUniqueId, video: true, audio: true };
      io.sockets.in(roomId).clients((err, clients) => {
        try {
          const users = [];
          clients.forEach((client) => {
            users.push({ userId: client, info: socketList[client] });
          });
          socket.broadcast.to(roomId).emit('user-join', users);
        } catch (e) {
          io.sockets.in(roomId).emit('error-user-exist', { err: true });
        }
      });
    });
  
    socket.on('call-user', ({ userToCall, from, signal }) => {
      let user_info = socketList[from];
      io.to(userToCall).emit('receive-call', {
        signal,
        from,
        info: user_info
      });
    });
  
    socket.on('accept-call', ({ signal, to }) => {
      io.to(to).emit('call-accepted', {
        signal,
        answerId: socket.id,
      });
    });
  
    socket.on('send-message', ({ roomId, msg, sender, senderId }) => {
      io.sockets.in(roomId).emit('receive-message', { msg, sender, senderId }); 
    });

    socket.on('siren', ({sender, senderId, receiver, receiverId}) => {
      const caller_id = participants[senderId];
      const callee_id = participants[receiverId];
      io.sockets.to(callee_id).emit('siren-fire', sender);
    })
    socket.on('leave-room', ({ roomId, leaver, leaverId }) => {
      if (socketList[leaverId] === undefined) {
        console.log("empty socketlist")
      } else {
      let leaver_nickname = socketList[leaverId]
      leaver_nickname = leaver_nickname.userName;
      delete socketList[leaverId];
      socket.broadcast
        .to(roomId)
        .emit('user-leave', { userId: socket.id, userName: leaver_nickname });
      io.sockets.sockets[socket.id].leave(roomId);
      }
    });
  });

app.listen(port, () => {
    console.log('Express listening on port', port);
});

server.listen(443);