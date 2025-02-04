const express = require('express');
const db = require("../db.js");

const router = express.Router();

// Login
// Login
router.post("/login", async (req, res) => {
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
        res.status(200).json({ user_id: user.id , username: user.username });
    } catch (error) {
        console.error("Error logging in:", error);
        res.status(500).json({ success: false, error: "Database error" });
}
});
  
// Logout
router.post("/logout", async (req, res) => {
    const { user_id } = req.body;

    if (!user_id) {
        return res.status(400).json({ success: false, error: "User ID is required" });
    }

    try {
        const user = await db.oneOrNone("SELECT id FROM users WHERE id = $1", [user_id]);

        if (user) {
            await db.none("DELETE FROM channel_participants WHERE user_id = $1", [user.id]);
        }

        console.log({ message: "User logged out", user_id });
        res.status(200).json({ message: "User logged out successfully" });
    } catch (error) {
        console.error("Error logging out:", error);
        res.status(500).json({ success: false, error: "Database error" });
    }
});
  
module.exports = router;