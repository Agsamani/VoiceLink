const express = require('express');
const db = require("../db.js");

const router = express.Router();

// Get all users in a channel
router.get("/channels/:id/users", async (req, res) => {
    const { id } = req.params;

    try {
    const users = await db.any(
        "SELECT * FROM users u JOIN channel_participants cp ON u.id = cp.user_id WHERE cp.channel_id = $1",
        [id]
    );

    res.json(users);
    } catch (error) {
        console.error("Error getting users in channel:", error);
        res.status(500).json({ success: false, error: "Error fetching users from database" });
    }
});

// Join a channel
router.post("/channel/:id/join", async (req, res) => {
    const { id } = req.params;
    const { user_id } = req.body;

    if (!user_id) {
    return res.status(400).json({ error: "User ID is required" });
    }

    try {
    const user = await db.oneOrNone("SELECT id FROM users WHERE id = $1", [user_id]);
    if (!user) {
        return res.status(404).json({ error: "User not found" });
    }

    const channel = await db.oneOrNone("SELECT id FROM channels WHERE id = $1", [id]);
    if (!channel) {
        return res.status(404).json({ error: "Channel not found" });
    }

    await db.none(
        "INSERT INTO channel_participants (user_id, channel_id) VALUES ($1, $2)",
        [user.id, id]
    );

    res.status(200).json({ message: "User joined the channel" });
    } catch (error) {
        console.error("Error joining channel:", error);
        res.status(500).json({ error: "Failed to join channel" });
    }
});

// Leave a channel
router.post("/channel/:id/leave", async (req, res) => {
    const { id } = req.params;
    const { user_id } = req.body;

    if (!user_id) {
    return res.status(400).json({ error: "User ID is required" });
    }

    try {
    const user = await db.oneOrNone("SELECT id FROM users WHERE id = $1", [user_id]);
    if (!user) {
        return res.status(404).json({ error: "User not found" });
    }

    const channel = await db.oneOrNone("SELECT id FROM channels WHERE id = $1", [id]);
    if (!channel) {
        return res.status(404).json({ error: "Channel not found" });
    }

    const result = await db.none(
        "DELETE FROM channel_participants WHERE user_id = $1 AND channel_id = $2",
        [user.id, id]
    );

    if (result === 0) {
        return res.status(404).json({ error: "User is not part of this channel" });
    }

    res.status(200).json({ message: "User left the channel" });
    } catch (error) {
        console.error("Error leaving channel:", error);
        res.status(500).json({ error: "Failed to leave channel" });
    }
});

module.exports = router;