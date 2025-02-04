import { useEffect, useState } from "react";

const Channels = ({ onChannelClick }) => {
  const [channels, setChannels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [newChannelName, setNewChannelName] = useState(""); 
  const [prevChannelId, setPrevChannelId] = useState(-1)

  useEffect(() => {
    fetchChannels();
  }, []);

  const fetchChannels = async () => {
    try {
        const response = await fetch("http://localhost:3000/channels");
        if (!response.ok) throw new Error("Failed to fetch channels");
        const data = await response.json();
        setChannels(data);
    } catch (err) {
        setError(err.message);
    } finally {
        setLoading(false);
    }
  };

  const deleteChannel = async (channelId) => {
    try {
        const response = await fetch(`http://localhost:3000/channels/${channelId}`, {
            method: "DELETE",
        });
        if (!response.ok) throw new Error("Failed to delete channel");
        setChannels(channels.filter((channel) => channel.id !== channelId));
    } catch (err) {
        alert(err.message);
    }
  };

  const createChannel = async () => {
    if (!newChannelName.trim()) {
        alert("Channel name cannot be empty");
        return;
    }

    try {
      const response = await fetch("http://localhost:3000/channels", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({ name: newChannelName }),
      });

      if (!response.ok) throw new Error("Failed to create channel");

      const newChannel = await response.json();
      setChannels([...channels, newChannel]);
      setNewChannelName(""); 
    } catch (err) {
      alert(err.message);
    }
  };

  if (loading) return <p>Loading...</p>;
  if (error) return <p>Error: {error}</p>;

  return (
    <div>
      <h2>Channels</h2>

      <div>
        <input
          type="text"
          placeholder="Enter channel name"
          value={newChannelName}
          onChange={(e) => setNewChannelName(e.target.value)}
        />
        <button onClick={createChannel}>Add Channel</button>
      </div>

      <ul>
        {channels.map((channel) => (
          <li key={channel.id}>
            <span onClick={() => {
              onChannelClick(channel.id, prevChannelId);
              setPrevChannelId(channel.id);
            }}>
              {channel.name}
            </span>
            <button onClick={() => deleteChannel(channel.id)}>Delete</button>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default Channels;