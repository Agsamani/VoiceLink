DROP TABLE IF EXISTS channel_participants, users, channels CASCADE;

-- Users table
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(255) UNIQUE NOT NULL
);

-- Channels table
CREATE TABLE channels (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) UNIQUE NOT NULL,
    creator VARCHAR(255) REFERENCES users(username) ON DELETE CASCADE
);

-- Join table to track user participation in channels - each user only one channel
CREATE TABLE channel_participants (
    user_id INT UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    channel_id INT REFERENCES channels(id) ON DELETE CASCADE,
    PRIMARY KEY (user_id)
);