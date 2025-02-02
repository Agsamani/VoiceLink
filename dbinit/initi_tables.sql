CREATE TABLE channels (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) UNIQUE NOT NULL
);

CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(255) UNIQUE NOT NULL,
    channel_id INT REFERENCES channels(id)      -- added 1 to n relation
);

-- CREATE TABLE user_channels (
--     user_id INT REFERENCES users(id),
--     channel_id INT REFERENCES channels(id),
--     PRIMARY KEY (user_id, channel_id)
-- );
