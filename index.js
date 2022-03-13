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
// const https = require('https');
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

// const io = require('socket.io')(server);
const io = require("socket.io")(server, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"]
    }
  });

// app.set('view engine', 'ejs');
// app.use(express.static(__dirname + '/public'));


const con = mysql.createConnection({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE,
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
  origin: [ 'https://maitapp.click', 'https://maitapp2.click' ],
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

app.set('view engine', 'ejs');
app.engine('html', require('ejs').renderFile);


app.get('/', (req, res) => {
  console.log("HERE GET");
  res.send("SUCCESS")
})


app.get('/cam', verifyToken, (req, res) => {
    console.log("cam entered!!");
    const room_id = uuidV4().substring(0, 23);
    console.log(room_id, "room_id")
    const user_id = req.decoded.userInfo.id;
    const sql = `SELECT nickname from users WHERE id = ${user_id}`;
    con.query(sql, (err, result) => {
      if (err) throw err;
      console.log("result", result[0].nickname);
      res.send( {message: "SUCCESS", roomid: `${room_id}`, userName: `${result[0].nickname}`, userId: `${user_id}`} );
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
      res.send({message: "SUCCESS", userName: `${result[0].nickname}`, userId: `${user_id}`})
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
//       res.send( {message: "SUCCESS", roomid: `${room_id}`, userName: `${result[0].nickname}`, userId: `${user_id}`} );
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
//     res.send({message: "SUCCESS", userName: `${result[0].nickname}`, userId: `${user_id}`})
//   });
//   // res.send({message: "SUCCESS"})
//   // res.send( {message : "SUCCESS", roomid : `${room_id}`} );
// });

/////////로컬에서 돌릴 때 -----



// ///////////// jamalag SFU

// /**
//  * integrating mediasoup server with a node.js application
//  */

// /* Please follow mediasoup installation requirements */
// /* https://mediasoup.org/documentation/v3/mediasoup/installation/ */

// // const https = require('httpolyglot')

// const path = require('path')
// // const __dirname = path.resolve()

// // import { Server } from 'socket.io'
// const mediasoup = require('mediasoup');
// const socket = require('socket.io-client/lib/socket');

// app.get('*', (req, res, next) => {
//   const path = '/sfu/'

//   if (req.path.indexOf(path) == 0 && req.path.length > path.length) return next()

//   res.send(`You need to specify a room name in the path e.g. 'https://127.0.0.1/sfu/room'`)
// })

// // app.use('/sfu/:room', express.static(path.join(__dirname, 'public')))


// // app.get('/sfu/:room', (req, res) => {
// //   const room = req.params.room;
// //   console.log("ROOM ENTERED : ", `${room}`)
// //   // res.send("ROOM ENTERED : ", `${room}`);
// // });

// // SSL cert for HTTPS access
// // const options = {
// //   key: fs.readFileSync('./server/ssl/key.pem', 'utf-8'),
// //   cert: fs.readFileSync('./server/ssl/cert.pem', 'utf-8')
// // }

// // const httpsServer = https.createServer(options, app)
// // httpsServer.listen(3000, () => {
// //   console.log('listening on port: ' + 3000)
// // })

// // const io = new Server(httpsServer)

// // socket.io namespace (could represent a room?)
// const connections = io.of('/mediasoup')

// /**
//  * Worker
//  * |-> Router(s)
//  *     |-> Producer Transport(s)
//  *         |-> Producer
//  *     |-> Consumer Transport(s)
//  *         |-> Consumer 
//  **/
// let worker
// let rooms = {}          // { roomName1: { Router, rooms: [ sicketId1, ... ] }, ...}
// let peers = {}          // { socketId1: { roomName1, socket, transports = [id1, id2,] }, producers = [id1, id2,] }, consumers = [id1, id2,], peerDetails }, ...}
// let transports = []     // [ { socketId1, roomName1, transport, consumer }, ... ]
// let producers = []      // [ { socketId1, roomName1, producer, }, ... ]
// let consumers = []      // [ { socketId1, roomName1, consumer, }, ... ]

// const createWorker = async () => {
//   worker = await mediasoup.createWorker({
//     rtcMinPort: 2000,
//     rtcMaxPort: 29999,
//   })
//   console.log(`worker pid ${worker.pid}`)

//   worker.on('died', error => {
//     // This implies something serious happened, so kill the application
//     console.error('mediasoup worker has died')
//     setTimeout(() => process.exit(1), 2000) // exit in 2 seconds
//   })

//   return worker
// }

// // We create a Worker as soon as our application starts
// worker = createWorker()

// // This is an Array of RtpCapabilities
// // https://mediasoup.org/documentation/v3/mediasoup/rtp-parameters-and-capabilities/#RtpCodecCapability
// // list of media codecs supported by mediasoup ...
// // https://github.com/versatica/mediasoup/blob/v3/src/supportedRtpCapabilities.ts
// const mediaCodecs = [
//   {
//     kind: 'audio',
//     mimeType: 'audio/opus',
//     clockRate: 48000,
//     channels: 2,
//   },
//   {
//     kind: 'video',
//     mimeType: 'video/VP8',
//     clockRate: 90000,
//     parameters: {
//       'x-google-start-bitrate': 1000,
//     },
//   },
// ]

// // connections.on('connection', async socket => {
//   connections.on('connection', async socket => {
//   console.log("CONNECTION: SUCCESS", socket.id)
//   socket.emit('connection-success', {
//     socketId: socket.id
//   })

//   const removeItems = (items, socketId, type) => {
//     items.forEach(item => {
//       if (item.socketId === socket.id) {
//         item[type].close()
//       }
//     })
//     items = items.filter(item => item.socketId !== socket.id)

//     return items
//   }


//   socket.on('disconnect', () => {
//     // do some cleanup
//     console.log('peer disconnected')
   
//     consumers = removeItems(consumers, socket.id, 'consumer')
//     producers = removeItems(producers, socket.id, 'producer')
//     transports = removeItems(transports, socket.id, 'transport')

//     // console.log(peers[socket.id], "socket.id");
//     // console.log("NOW REMAIN", Object.keys(peers).length)

//     if (peers[socket.id] === undefined) {
//       console.log("peers[socket.id] === undefined")
//     } else {

//     const { roomName } = peers[socket.id]
//     delete peers[socket.id]
//     console.log("NOW REMAIN", Object.keys(peers).length)

//     // remove socket from room
//     rooms[roomName] = {
//       router: rooms[roomName].router,
//       peers: rooms[roomName].peers.filter(socketId => socketId !== socket.id)
//     }
//   }
//   })

//   socket.on('joinRoom', async ({ roomName }, callback) => {
//     // create Router if it does not exist
//     // const router1 = rooms[roomName] && rooms[roomName].get('data').router || await createRoom(roomName, socket.id)
//     console.log("SUCCESSFULLY JOINED A ROOM!");
//     // console.log("room name", roomName);
    
//     const router1 = await createRoom(roomName, socket.id)

//     peers[socket.id] = {
//       socket,
//       roomName,           // Name for the Router this Peer joined
//       transports: [],
//       producers: [],
//       consumers: [],
//       peerDetails: {
//         name: '',
//         isAdmin: false,   // Is this Peer the Admin?
//       }
//     }

//     console.log("participants", Object.keys(peers).length);
    

//     // get Router RTP Capabilities
//     const rtpCapabilities = router1.rtpCapabilities

//     // call callback from the client and send back the rtpCapabilities
//     callback({ rtpCapabilities })
//   })

//   const createRoom = async (roomName, socketId) => {
//     // worker.createRouter(options)
//     // options = { mediaCodecs, appData }
//     // mediaCodecs -> defined above
//     // appData -> custom application data - we are not supplying any
//     // none of the two are required
//     let router1
//     let peers = []
//     if (rooms[roomName]) {
//       router1 = rooms[roomName].router
//       peers = rooms[roomName].peers || []
//     } else {
//       router1 = await worker.createRouter({ mediaCodecs, })
//     }
    
//     console.log(`Router ID: ${router1.id}`, peers.length)

//     rooms[roomName] = {
//       router: router1,
//       peers: [...peers, socketId],
//     }

//     return router1
//   }

//   // socket.on('createRoom', async (callback) => {
//   //   if (router === undefined) {
//   //     // worker.createRouter(options)
//   //     // options = { mediaCodecs, appData }
//   //     // mediaCodecs -> defined above
//   //     // appData -> custom application data - we are not supplying any
//   //     // none of the two are required
//   //     router = await worker.createRouter({ mediaCodecs, })
//   //     console.log(`Router ID: ${router.id}`)
//   //   }

//   //   getRtpCapabilities(callback)
//   // })

//   // const getRtpCapabilities = (callback) => {
//   //   const rtpCapabilities = router.rtpCapabilities

//   //   callback({ rtpCapabilities })
//   // }

//   // Client emits a request to create server side Transport
//   // We need to differentiate between the producer and consumer transports
//   socket.on('createWebRtcTransport', async ({ consumer }, callback) => {
//     // get Room Name from Peer's properties
//     const roomName = peers[socket.id].roomName

//     // get Router (Room) object this peer is in based on RoomName
//     const router = rooms[roomName].router


//     createWebRtcTransport(router).then(
//       transport => {
//         callback({
//           params: {
//             id: transport.id,
//             iceParameters: transport.iceParameters,
//             iceCandidates: transport.iceCandidates,
//             dtlsParameters: transport.dtlsParameters,
//           }
//         })

//         // add transport to Peer's properties
//         addTransport(transport, roomName, consumer)
//       },
//       error => {
//         console.log(error)
//       })
//   })

//   const addTransport = (transport, roomName, consumer) => {

//     transports = [
//       ...transports,
//       { socketId: socket.id, transport, roomName, consumer, }
//     ]

//     peers[socket.id] = {
//       ...peers[socket.id],
//       transports: [
//         ...peers[socket.id].transports,
//         transport.id,
//       ]
//     }
//   }

//   const addProducer = (producer, roomName) => {
//     producers = [
//       ...producers,
//       { socketId: socket.id, producer, roomName, }
//     ]

//     peers[socket.id] = {
//       ...peers[socket.id],
//       producers: [
//         ...peers[socket.id].producers,
//         producer.id,
//       ]
//     }
//   }

//   const addConsumer = (consumer, roomName) => {
//     // add the consumer to the consumers list
//     consumers = [
//       ...consumers,
//       { socketId: socket.id, consumer, roomName, }
//     ]

//     // add the consumer id to the peers list
//     peers[socket.id] = {
//       ...peers[socket.id],
//       consumers: [
//         ...peers[socket.id].consumers,
//         consumer.id,
//       ]
//     }
//   }

//   socket.on('getProducers', callback => {
//     //return all producer transports
//     const { roomName } = peers[socket.id]

//     let producerList = []
//     producers.forEach(producerData => {
//       if (producerData.socketId !== socket.id && producerData.roomName === roomName) {
//         producerList = [...producerList, producerData.producer.id]
//       }
//     })

//     // return the producer list back to the client
//     callback(producerList)
//   })

//   const informConsumers = (roomName, socketId, id) => {
//     console.log(`just joined, id ${id} ${roomName}, ${socketId}`)
//     // A new producer just joined
//     // let all consumers to consume this producer
//     producers.forEach(producerData => {
//       if (producerData.socketId !== socketId && producerData.roomName === roomName) {
//         const producerSocket = peers[producerData.socketId].socket
//         // use socket to send producer id to producer
//         producerSocket.emit('new-producer', { producerId: id })
//       }
//     })
//   }

//   const getTransport = (socketId) => {
//     const [producerTransport] = transports.filter(transport => transport.socketId === socketId && !transport.consumer)
//     return producerTransport.transport
//   }

//   // see client's socket.emit('transport-connect', ...)
//   socket.on('transport-connect', ({ dtlsParameters }) => {
//     console.log('DTLS PARAMS... ', { dtlsParameters })
    
//     getTransport(socket.id).connect({ dtlsParameters })
//   })

//   // see client's socket.emit('transport-produce', ...)
//   socket.on('transport-produce', async ({ kind, rtpParameters, appData }, callback) => {
//     // call produce based on the prameters from the client
//     const producer = await getTransport(socket.id).produce({
//       kind,
//       rtpParameters,
//     })

//     // add producer to the producers array
//     const { roomName } = peers[socket.id]

//     addProducer(producer, roomName)

//     informConsumers(roomName, socket.id, producer.id)

//     console.log('Producer ID: ', producer.id, producer.kind)

//     producer.on('transportclose', () => {
//       console.log('transport for this producer closed ')
//       producer.close()
//     })

//     // Send back to the client the Producer's id
//     callback({
//       id: producer.id,
//       producersExist: producers.length>1 ? true : false
//     })
//   })

//   // see client's socket.emit('transport-recv-connect', ...)
//   socket.on('transport-recv-connect', async ({ dtlsParameters, serverConsumerTransportId }) => {
//     console.log(`DTLS PARAMS: ${dtlsParameters}`)
//     const consumerTransport = transports.find(transportData => (
//       transportData.consumer && transportData.transport.id == serverConsumerTransportId
//     )).transport
//     await consumerTransport.connect({ dtlsParameters })
//   })

//   socket.on('consume', async ({ rtpCapabilities, remoteProducerId, serverConsumerTransportId }, callback) => {
//     try {

//       const { roomName } = peers[socket.id]
//       const router = rooms[roomName].router
//       let consumerTransport = transports.find(transportData => (
//         transportData.consumer && transportData.transport.id == serverConsumerTransportId
//       )).transport

//       // check if the router can consume the specified producer
//       if (router.canConsume({
//         producerId: remoteProducerId,
//         rtpCapabilities
//       })) {
//         // transport can now consume and return a consumer
//         const consumer = await consumerTransport.consume({
//           producerId: remoteProducerId,
//           rtpCapabilities,
//           paused: true,
//         })

//         consumer.on('transportclose', () => {
//           console.log('transport close from consumer')
//         })

//         consumer.on('producerclose', () => {
//           console.log('producer of consumer closed')
//           socket.emit('producer-closed', { remoteProducerId })

//           consumerTransport.close([])
//           transports = transports.filter(transportData => transportData.transport.id !== consumerTransport.id)
//           consumer.close()
//           consumers = consumers.filter(consumerData => consumerData.consumer.id !== consumer.id)
//         })

//         addConsumer(consumer, roomName)

//         // from the consumer extract the following params
//         // to send back to the Client
//         const params = {
//           id: consumer.id,
//           producerId: remoteProducerId,
//           kind: consumer.kind,
//           rtpParameters: consumer.rtpParameters,
//           serverConsumerId: consumer.id,
//         }

//         // send the parameters to the client
//         callback({ params })
//       }
//     } catch (error) {
//       console.log(error.message)
//       callback({
//         params: {
//           error: error
//         }
//       })
//     }
//   })

//   socket.on('consumer-resume', async ({ serverConsumerId }) => {
//     console.log('consumer resume', serverConsumerId)
//     const { consumer } = consumers.find(consumerData => consumerData.consumer.id === serverConsumerId)
//     await consumer.resume()
//   })
// })

// const createWebRtcTransport = async (router) => {
//   return new Promise(async (resolve, reject) => {
//     try {
//       // https://mediasoup.org/documentation/v3/mediasoup/api/#WebRtcTransportOptions
//       const webRtcTransport_options = {
//         listenIps: [
//           {
//             ip: '0.0.0.0', // replace with relevant IP address
//             announcedIp: '13.209.73.162',
//           }   
//           // {
//           //   // ip: '0.0.0.0', // replace with relevant IP address
//           //   // port: '5000',
//           //   ip: '13.209.73.162',
//           //   // listenPort: 443,
//           //   announcedIp: null
//           // }
//         ],
//         enableUdp: true,
//         enableTcp: true,
//         preferUdp: true,
//       }

//       // https://mediasoup.org/documentation/v3/mediasoup/api/#router-createWebRtcTransport
//       let transport = await router.createWebRtcTransport(webRtcTransport_options)
//       console.log(`transport id: ${transport.id}`)

//       transport.on('dtlsstatechange', dtlsState => {
//         if (dtlsState === 'closed') {
//           transport.close()
//         }
//       })

//       transport.on('close', () => {
//         console.log('transport closed')
//       })

//       resolve(transport)

//     } catch (error) {
//       reject(error)
//     }
//   })
// }

///////////////////////












//  let socketList = {};
//   let participants = {};

//   // app.use(express.static(path.join(__dirname, 'public')));
  
//   // if (process.env.NODE_ENV === 'production') {
//   //   app.use(express.static(path.join(__dirname, '../client/build')));
  
//   //   app.get('/*', function (req, res) {
//   //     res.sendFile(path.join(__dirname, '../client/build/index.html'));
//   //   });
//   // }
  
//   // Route
//   app.get('/ping', (req, res) => {
//     res
//       .send({
//         success: true,
//       })
//       .status(200);
//   });
  
//   // Socket
//   io.on('connection', (socket) => {
//     // console.log(`New User connected: ${socket.id}`);
  
//     socket.on('disconnect', () => {
//       socket.disconnect();
//       console.log('User disconnected!');
//     });
//     // socket.on('disconnect', () => {
//     //   console.log("roomId : ", roomId, "userId : ", userId );
//     //   socket.to(roomId).broadcast.emit('user-disconnected', userId);
//     //   });
  
//     socket.on('check-user', ({ roomId, userName }) => {
//       let error = false;
  
//       io.sockets.in(roomId).clients((err, clients) => {
//         clients.forEach((client) => {
//           if (socketList[client] == userName) {
//             error = true;
//           }
//         });
//         socket.emit('error-user-exist', { error });
//       });
//     });
  
//     /**
//      * Join Room
//      */
//     socket.on('join-room', ({roomId, userName, userUniqueId}) => {
//       // Socket Join RoomName
//       socket.join(roomId);
//       participants[userUniqueId] =  socket.id;
//       console.log(userName, userUniqueId, "NEW JOINER TO", roomId );
//       // console.log(participants);
//       socketList[socket.id] = { userName, userUniqueId, video: true, audio: true };
//       // socketList[userUniqueId] = { userName, userUniqueId, video: true, audio: true };
//       console.log(socketList[socket.id], "socket: check socket!!!!");
//       // Set User List  
//       console.log(socketList, "******************************");
//       io.sockets.in(roomId).clients((err, clients) => {
//         // console.log(clients, "client_1");
//         try {
//           const users = [];
//           clients.forEach((client) => {
//             // Add User List
//             // console.log(client, "client_2");
//             users.push({ userId: client, info: socketList[client] });
//             // console.log(users, "****USERS****");
//           });
//           console.log(users, "users");
//           socket.broadcast.to(roomId).emit('user-join', users);
//         } catch (e) {
//           io.sockets.in(roomId).emit('error-user-exist', { err: true });
//         }
//       });
//     });

//     // socket.on('init-send', userId => {
//     //   console.log(`INIT SEND by ${socket.id} for ${userId}`);
//     //   console.log(socketList[userId].socket, "socket!!!___1")
//     //   console.log(socketList[userId][socket], "socket!!!!!!!!!!!!!!!!!!!!!!!!!!!2222222")
//     //   socketList[userId][socket].emit('init-send', socket.id);
//     //   // socketList[userId]는 소켓이어야함. 
//     // })


  
//     // socket.on('call-user', ({ userToCall, from, signal }) => {
//     //   io.to(userToCall).emit('receive-call', {
//     //     signal,
//     //     from,
//     //     info: socketList[socket.id],
//     //   });
//     // });
//     socket.on('call-user', ({ userToCall, from, signal }) => {
//       let user_info = socketList[from];
//       console.log(user_info, "user_info")
//       io.to(userToCall).emit('receive-call', {
//         signal,
//         from,
//         info: user_info
//       });
//     });
  
//     socket.on('accept-call', ({ signal, to }) => {
//       io.to(to).emit('call-accepted', {
//         signal,
//         answerId: socket.id,
//       });
//     });
  
//     socket.on('send-message', ({ roomId, msg, sender, senderId }) => {
//       console.log(sender, "sender");
//       console.log(socketList, "socketList");
//       console.log(participants, "participants")
//       io.sockets.in(roomId).emit('receive-message', { msg, sender, senderId }); 
//       // io.sockets.in(roomId).emit('receive-message', { msg, sender });
//     });

//     socket.on('siren', ({sender, senderId, receiver, receiverId}) => {
//       const caller_id = participants[senderId];
//       const callee_id = participants[receiverId];
//       console.log(`FROM ${sender} TO ${receiver}`);
//       io.sockets.to(callee_id).emit('siren-fire', sender);
//     })
//     // { roomId, leaver, leaverId }
//     socket.on('leave-room', ({ roomId, leaver, leaverId }) => {
//       console.log(socketList, "SOCKET LIST before");
//       if (socketList[leaverId] === undefined) {
//         console.log("empty socketlist")
//       } else {
//       // delete socketList[socket.id];
//       console.log(leaverId, "leaverId");
//       let leaver_nickname = socketList[leaverId]
//       console.log(leaver_nickname, "leaver_nickname_1");
//       leaver_nickname = leaver_nickname.userName;
//       console.log(leaver_nickname, "leaver_nickname_2");
//       delete socketList[leaverId];
//       // delete participants.find()
//       console.log(socketList, "SOCKET LIST after");
//       socket.broadcast
//         .to(roomId)
//         .emit('user-leave', { userId: socket.id, userName: leaver_nickname });
//       io.sockets.sockets[socket.id].leave(roomId);
//       }
//     });
  
//     // socket.on('toggle-camera-audio', ({ roomId, switchTarget }) => {
//     //   if (switchTarget === 'video') {
//     //     socketList[socket.id].video = !socketList[socket.id].video;
//     //   } else {
//     //     console.log(socketList, "== socketlist");
//     //     console.log(socketList[socket.id], "socket.id");
//     //     console.log(socketList[socket.id].audio, "audio!!!");
//     //     socketList[socket.id].audio = !socketList[socket.id].audio;
//     //   }
//     //   socket.broadcast
//     //     .to(roomId)
//     //     .emit('toggle-camera', { userId: socket.id, switchTarget });
//     // });
//   });






  ///////// mesh upgrade


//   let peers = {};
//   let socketList = {};
//   let participants = {};



  
//   // Socket
//   io.on('connect', (socket) => {
//     console.log(`New User connected: ${socket.id}`);

//     peers[socket.id] = socket

//     for (let id in peers) {
//       if (id === socket.id) continue
//       console.log('sending initReceive to ', socket.id)
//       peers[id].emit('initReceive', socket.id)
//     }

//     socket.on('signal', data => {
//       console.log('sending signal from ' + socket.id, ' to ', data)
//       if(!peers[data.socket_id])return
//       peers[data.socket_id].emit('signal', {
//         socket_id: socket.id,
//         signal: data.signal
//       })
//     })

//     socket.on('disconnect', () => {
//       console.log('socket disconnected ' + socket.id)
//       socket.broadcast.emit('removePeer', socket.id)
//       delete peers[socket.id]
//   })


//   socket.on('initSend', init_socket_id => {
//     console.log('INIT SEND by ' + socket.id + ' for ' + init_socket_id)
//     peers[init_socket_id].emit('initSend', socket.id)
// })
// })



  ////////////////////////////////////














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
    // console.log(`New User connected: ${socket.id}`);
  
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
    socket.on('join-room', ({roomId, userName, userUniqueId}) => {
      // Socket Join RoomName
      socket.join(roomId);
      participants[userUniqueId] =  socket.id;
      console.log(userName, userUniqueId, "NEW JOINER", roomId);
      // console.log(participants);
      socketList[socket.id] = { userName, userUniqueId, video: true, audio: true };
      // socketList[userUniqueId] = { userName, userUniqueId, video: true, audio: true };
      // console.log(socketList, "socket list");
      // Set User List  
      io.sockets.in(roomId).clients((err, clients) => {
        // console.log(clients, "client_1");
        try {
          const users = [];
          clients.forEach((client) => {
            // Add User List
            // console.log(client, "client_2");
            users.push({ userId: client, info: socketList[client] });
            // console.log(users, "****USERS****");
          });
          console.log(users, "users");
          socket.broadcast.to(roomId).emit('user-join', users);
        } catch (e) {
          io.sockets.in(roomId).emit('error-user-exist', { err: true });
        }
      });
    });
  
    // socket.on('call-user', ({ userToCall, from, signal }) => {
    //   io.to(userToCall).emit('receive-call', {
    //     signal,
    //     from,
    //     info: socketList[socket.id],
    //   });
    // });
    socket.on('call-user', ({ userToCall, from, signal }) => {
      let user_info = socketList[from];
      console.log(user_info, "user_info")
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
      console.log(sender, "sender");
      console.log(socketList, "socketList");
      console.log(participants, "participants")
      io.sockets.in(roomId).emit('receive-message', { msg, sender, senderId }); 
      // io.sockets.in(roomId).emit('receive-message', { msg, sender });
    });

    socket.on('siren', ({sender, senderId, receiver, receiverId}) => {
      const caller_id = participants[senderId];
      const callee_id = participants[receiverId];
      console.log(`FROM ${sender} TO ${receiver}`);
      io.sockets.to(callee_id).emit('siren-fire', sender);
    })
    // { roomId, leaver, leaverId }
    socket.on('leave-room', ({ roomId, leaver, leaverId }) => {
      console.log(socketList, "SOCKET LIST before");
      if (socketList[leaverId] === undefined) {
        console.log("empty socketlist")
      } else {
      // delete socketList[socket.id];
      console.log(leaverId, "leaverId");
      let leaver_nickname = socketList[leaverId]
      console.log(leaver_nickname, "leaver_nickname_1");
      leaver_nickname = leaver_nickname.userName;
      console.log(leaver_nickname, "leaver_nickname_2");
      delete socketList[leaverId];
      // delete participants.find()
      console.log(socketList, "SOCKET LIST after");
      socket.broadcast
        .to(roomId)
        .emit('user-leave', { userId: socket.id, userName: leaver_nickname });
      io.sockets.sockets[socket.id].leave(roomId);
      }
    });
  
    // socket.on('toggle-camera-audio', ({ roomId, switchTarget }) => {
    //   if (switchTarget === 'video') {
    //     socketList[socket.id].video = !socketList[socket.id].video;
    //   } else {
    //     console.log(socketList, "== socketlist");
    //     console.log(socketList[socket.id], "socket.id");
    //     console.log(socketList[socket.id].audio, "audio!!!");
    //     socketList[socket.id].audio = !socketList[socket.id].audio;
    //   }
    //   socket.broadcast
    //     .to(roomId)
    //     .emit('toggle-camera', { userId: socket.id, switchTarget });
    // });
  });


  



  

app.listen(port, () => {
    console.log('Express listening on port', port);
});

server.listen(443);