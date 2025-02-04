const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");
const db = require("./db.js");

const app = express();
app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  console.log("Hello there!");
  res.send("General Kenobi...");
});

// Login - Ensure user exists
app.post("/login", async (req, res) => {
  const { username } = req.body;

  if (!username) {
    return res.status(400).json({ success: false, error: "Username is required" });
  }

  try {
    let user = await db.oneOrNone("SELECT * FROM users WHERE username = $1", [username]);

    if (!user) {
      user = await db.one("INSERT INTO users (username) VALUES ($1) RETURNING *", [username]);
    }

    console.log({ message: "User logged in", username });
    res.status(200).json({ username: user.username });
  } catch (error) {
    console.error("Error logging in:", error);
    res.status(500).json({ success: false, error: "Database error" });
  }
});

// Logout - Remove from active channels
app.post("/logout", async (req, res) => {
  const { username } = req.body;

  if (!username) {
    return res.status(400).json({ success: false, error: "Username is required" });
  }

  try {
    const user = await db.oneOrNone("SELECT id FROM users WHERE username = $1", [username]);

    if (user) {
      await db.none("DELETE FROM channel_participants WHERE user_id = $1", [user.id]);
    }

    console.log({ message: "User logged out", username });
    res.status(200).json({ message: "User logged out successfully" });
  } catch (error) {
    console.error("Error logging out:", error);
    res.status(500).json({ success: false, error: "Database error" });
  }
});

// Get all channels
app.get("/channels", async (req, res) => {
  try {
    const channels = await db.any("SELECT * FROM channels");
    res.json(channels);
  } catch (error) {
    console.error("Error getting channels:", error);
    res.status(500).json({ success: false, error: "Error getting channels" });
  }
});

// Create a channel
app.post("/channels", async (req, res) => {
  const { name, creator } = req.body;

  if (!name || !creator) {
    return res.status(400).json({ error: "Missing data" });
  }

  try {
    const result = await db.one(
      "INSERT INTO channels (name, creator) VALUES ($1, $2) RETURNING *",
      [name, creator]
    );
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: "Failed to create channel" });
  }
});

// Delete a channel
app.delete("/channels/:id", async (req, res) => {
  const { id } = req.params;
  const { username } = req.body;

  try {
    const channel = await db.oneOrNone("SELECT * FROM channels WHERE id = $1", [id]);

    if (!channel) return res.status(404).json({ error: "Channel not found" });
    if (channel.creator !== username) return res.status(403).json({ error: "Not authorized" });

    await db.none("DELETE FROM channels WHERE id = $1", [id]);
    res.json({ message: "Channel deleted" });
  } catch (error) {
    res.status(500).json({ error: "Failed to delete channel" });
  }
});

// Join a channel
app.post("/join-channel", async (req, res) => {
  const { username, channelId } = req.body;

  if (!username || !channelId) {
    return res.status(400).json({ error: "Missing data" });
  }

  try {
    const user = await db.oneOrNone("SELECT id FROM users WHERE username = $1", [username]);
    if (!user) return res.status(404).json({ error: "User not found" });

    // Remove user from any previous channel before joining a new one
    await db.none("DELETE FROM channel_participants WHERE user_id = $1", [user.id]);

    await db.none("INSERT INTO channel_participants (user_id, channel_id) VALUES ($1, $2)", [
      user.id,
      channelId,
    ]);

    res.json({ message: "Joined channel" });
  } catch (error) {
    res.status(500).json({ error: "Failed to join channel" });
  }
});

// Socket initialization
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
  });

  socket.on('leave-channel', (channelId) => {
    socket.leave(channelId);
    console.log(`${socket.id} left channel: ${channelId}`);
    socket.broadcast.to(channelId).emit('user-left', socket.id);
  });

  socket.on('signal', (data) => {
    socket.broadcast.to(data.to).emit('signal', {
      from: socket.id,
      signal: data.signal,
    });
  });

  socket.on('disconnect', () => {
    console.log('A user disconnected');
  });
});


server.listen(3000, () => {
  console.log("Server running on port 3000");
});