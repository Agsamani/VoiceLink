const express = require('express');
const db = require("../db.js");

const router = express.Router();

// Get all channels
router.get("/channels", async (req, res) => {
    try {
        const channels = await db.any("SELECT * FROM channels");
        res.json(channels);
    } catch (error) {
        console.error("Error getting channels:", error);
        res.status(500).json({ success: false, error: "Error getting channels" });
    }
});
  
// Create a channel
router.post("/channels", async (req, res) => {
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
router.delete("/channels/:id", async (req, res) => {
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
  
module.exports = router;