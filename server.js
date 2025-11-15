const express = require('express');
const http = require('http');
const socketIO = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = socketIO(server);

app.use(express.static(path.join(__dirname, 'public')));

const rooms = {};

io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  socket.on('join', ({ room, username }) => {
    if (!room || !username) {
      socket.emit('error', { message: 'Room and username are required' });
      return;
    }

    socket.join(room);

    if (!rooms[room]) {
      rooms[room] = { users: [], chatHistory: [] };
    }

    if (!rooms[room].users.find((user) => user.id === socket.id)) {
      rooms[room].users.push({ id: socket.id, username });
    }

    socket.emit('room-data', {
      room,
      users: rooms[room].users,
      chatHistory: rooms[room].chatHistory,
    });

    socket.to(room).emit('user-joined', { userId: socket.id, username });
  });

  socket.on('chat-message', ({ room, message, username }) => {
    const chatMessage = {
      sender: username,
      message,
      timestamp: new Date()
    };
    if (rooms[room]) {
      rooms[room].chatHistory.push(chatMessage);
    }
    io.to(room).emit('chat-message', chatMessage);
  });

  socket.on('offer', (data) => {
    socket.to(data.room).emit('offer', { offer: data.offer, sender: socket.id });
  });

  socket.on('answer', (data) => {
    socket.to(data.room).emit('answer', { answer: data.answer, sender: socket.id });
  });

  socket.on('candidate', (data) => {
    socket.to(data.room).emit('candidate', { candidate: data.candidate, sender: socket.id });
  });

  socket.on('disconnect', () => {
    for (const room in rooms) {
      const user = rooms[room].users.find((u) => u.id === socket.id);
      if (user) {
        rooms[room].users = rooms[room].users.filter((u) => u.id !== socket.id);
        socket.to(room).emit('user-left', { userId: socket.id });
        if (rooms[room].users.length === 0) {
          delete rooms[room];
        }
      }
    }
  });
});

server.listen(3002, () => {
  console.log('Server running at http://localhost:3002');
});
