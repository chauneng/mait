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