const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");

const db = require("./db.js")
const app = express();
app.use(cors());
app.use(express.json());

// test root page
app.get("/", (req, res) => {
  console.log("Hello there!");
  res.send("General Kenobi...");
});

// login API - adds user to the database
app.post("/login", async (req, res) => {
  const { username } = req.body;

  if (!username) {
    return res.status(400).json({ error: "Username is required" });
  }

  try {
    const userExists = await db.oneOrNone("SELECT * FROM users WHERE username = $1", [username]);

    if (!userExists) {
      await db.none("INSERT INTO users (username, channel_id) VALUES ($1, NULL)", [username]);
    }

    console.log({ message: "User logged in", username });
  } catch (error) {
    console.error("Error logging in:", error);
    res.status(500).json({ error: "Database error" });
  }
});


// logout API - removes user from the database
app.post("/logout", async (req, res) => {
  const { username } = req.body;

  if (!username) {
    return res.status(400).json({ error: "Username is required" });
  }

  try {
    await db.none("DELETE FROM users WHERE username = $1", [username]);
    console.log({ message: "User logged out" });
  } catch (error) {
    console.error("Error logging out:", error);
    res.status(500).json({ error: "Database error" });
  }
});

const server = http.createServer(app);
const io = new Server(server, {cors: {
  origin: "*", 
  methods: ["GET", "POST"]
}});

io.on("connection", (socket) => {
  console.log("A user connected:", socket.id);

  socket.on("voice", (data) => {
    socket.broadcast.emit("voice", data); // Send voice data to others except sender
  });

  socket.on("disconnect", () => {
    console.log("A user disconnected:", socket.id); // disconnect message
  });

});

server.listen(3000, () => {
  console.log('Server running on port 3000');
});