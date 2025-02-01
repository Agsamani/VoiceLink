const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");

const db = require("./db.js")
const app = express();

app.use(cors());

app.get("/", (req, res) => {
  console.log("Hello there!");
  res.send("General Kenobi...");
});


const server = http.createServer(app);
const io = new Server(server, {cors: {
  origin: "*", 
  methods: ["GET", "POST"]
}});

io.on("connection", (socket) => {
  console.log("A user connected:", socket.id);

  socket.on("voice", (data) => {
      socket.emit("voice", data); // Send voice data to others
  });

  socket.on("disconnect", () => {
      console.log("A user disconnected:", socket.id);
  });
});

server.listen(3000, () => {
  console.log('Server running on port 3000');
});