// app.get('/cam', (req, res) => {
//   res.redirect(`/cam/${uuidV4()}`);
// });

// app.get('/cam/:room', (req, res) => {
//   const room_id = req.params.room
//   res.render('room', { roomId: room_id });
// });

// io.on('connection', (socket) => {
// socket.on('join-room', (roomId, userId) => {
//   socket.join(roomId);
//   socket.to(roomId).broadcast.emit('user-connected', userId);
//   socket.on('disconnect', () => {
//   socket.to(roomId).broadcast.emit('user-disconnected', userId);
//   });
// });
// });

app.get('/', verifyToken, (req, res) => {
    const room_id = uuidV4().substring(0, 23);
    const user_id = req.decoded.userInfo.id;
    const sql = `SELECT nickname from users WHERE id = ${user_id}`;
    con.query(sql, (err, result) => {
      if (err) throw err;
      res.send( {message: "SUCCESS", roomid: `${room_id}`, userName: `${result[0].nickname}`, userId: `${user_id}`} );
    });
});

app.get('/:room', verifyToken, (req, res) => {
    const user_id = req.decoded.userInfo.id;
    const room_id = req.params.room
    const sql = `SELECT nickname from users WHERE id = ${user_id}`;
    con.query(sql, (err, result) => {
      if (err) throw err;
      res.send({message: "SUCCESS", userName: `${result[0].nickname}`, userId: `${user_id}`})
    });
  });