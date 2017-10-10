const io = require('socket.io')(require('express')().listen(process.env.PORT || 3000));

io.sockets.on('connection', socket => {
  if (io.engine.clientsCount > 2) {
    socket.emit('disconnect');
    socket.disconnect();
  }

  socket.on('message', data => {
    socket.broadcast.send(data);
  });
});
