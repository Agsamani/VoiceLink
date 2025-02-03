const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");

const db = require("./db.js")
const app = express();
app.use(cors());
app.use(express.json());
app.use(express.urlencoded());


app.get("/", (req, res) => {
  console.log("Hello there!");
  res.send("General Kenobi...");
});

app.post("/login", async (req, res) => {
  const { username } = req.body;

  if (!username) {
    return res.status(400).json({ success: false, error: "Username is required" });
  }

  try {
    const userExists = await db.oneOrNone("SELECT * FROM users WHERE username = $1", [username]);

    if (!userExists) {
      await db.none("INSERT INTO users (username, channel_id) VALUES ($1, NULL)", [username]);
    }

    console.log({ message: "User logged in", username });
    res.json({ success: true }); 
  } catch (error) {
    console.error("Error logging in:", error);
    res.status(500).json({ success: false, error: "Database error" });
  }
});


app.post("/logout", async (req, res) => {
  const { username } = req.body;

  if (!username) {
    return res.status(400).json({ success: false, error: "Username is required" });
  }

  try {
    await db.none("DELETE FROM users WHERE username = $1", [username]);
    console.log({ message: "User logged out" });
    res.json({ success: true }); 
  } catch (error) {
    console.error("Error logging out:", error);
    res.status(500).json({ success: false, error: "Database error" });
  }
});


app.get("/channels", async (req, res) => {
  try {
    const channels = await db.any("SELECT * FROM channels");
    console.log({ channels: channels });
    res.json(channels); 
  } catch (error) {
    console.error("Error getting channels:", error);
    res.status(500).json({ success: false, error: "Error getting channels" });
  }
})


app.post("/channels", async (req, res) => {
  data = req.body

  try {
    await db.none("INSERT INTO channels(name) VALUES($1)", [data.name]);
    console.log("New channel inserted: " + data.name);
    res.send({ success: true }); 
  } catch (error) {
    console.error("Error inserting channels:", error);
    res.status(500).json({ success: false, error: "Error creating channel" });
  }
})


app.delete("/channels/:channelId", async (req, res) => {
  const { channelId } = req.params;

  try {
    const result = await db.result("DELETE FROM channels WHERE id = $1", [channelId]);

    if (result.rowCount === 0) {
      res.status(404).json({ success: false, error: "Channel not found" });
    } else {
      console.log(`Channel deleted: ${channelId}`);
      res.json({ success: true });
    }
  } catch (error) {
    console.error("Error deleting channel:", error);
  }
});

// Socket initialization
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