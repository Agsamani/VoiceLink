const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

const authRoutes = require('./routes/auth.js');
const homeRoutes = require('./routes/home.js');
const channelRoutes = require('./routes/channel.js');

const socketIdMap = {};

// Test route
app.get("/", (req, res) => {
  console.log("Hello there!");
  res.send("General Kenobi...");
});

app.get("/socketmaps", (req, res) => {
  res.json(socketIdMap)
});

app.use('', authRoutes);
app.use('', homeRoutes);
app.use('', channelRoutes);

// ======================================= Socket Connection =======================================
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: "*", methods: ["GET", "POST"] },
});


io.on('connection', (socket) => {
  console.log('A user connected');

  socket.on('join-channel', (channelId) => {
    socket.join(channelId);
    console.log(`${socket.id} joined channel: ${channelId}`);
    socket.broadcast.to(channelId).emit('user-joined', socket.id);
    io.emit('users-updated');
  });

  socket.on('leave-channel', (channelId) => {
    socket.leave(channelId);
    console.log(`${socket.id} left channel: ${channelId}`);
    socket.broadcast.to(channelId).emit('user-left', socket.id);
    io.emit('users-updated');
  });

  socket.on('signal', (data) => {
    socket.broadcast.to(data.to).emit('signal', {
      from: socket.id,
      signal: data.signal,
    });
  });

  socket.on('create-channel', () => {
    io.emit('channel-created');
  })

  socket.on('delete-channel', (channelId) => {
    io.emit('channel-deleted', channelId);
  })

  socket.on('logged-in', (userId) => {
    socketIdMap[userId] = socket.id;
  })

  socket.on('disconnect', () => {
    console.log('A user disconnected');
  });
});


server.listen(3000, () => {
  console.log("Server running on port 3000");
});