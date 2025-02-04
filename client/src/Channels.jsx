import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

const Channels = ({ username, onChannelCLick }) => {
  const [channels, setChannels] = useState([]);
  const [newChannelName, setNewChannelName] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const fetchChannels = async () => {
      try {
        const response = await fetch("http://localhost:3000/channels");
        const data = await response.json();
        setChannels(data);
      } catch (error) {
        console.error("Error fetching channels:", error);
      }
    };

    fetchChannels();

    return () => socket.close();
  }, []);

  const createChannel = async () => {
    if (!newChannelName.trim()) return alert("Channel name cannot be empty");

    try {
      const response = await fetch("http://localhost:3000/channels", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newChannelName, creator: username }), // Store creator
      });

      if (!response.ok) throw new Error("Failed to create channel");

      setNewChannelName("");
    } catch (error) {
      alert(error.message);
    }
  };

  const deleteChannel = async (channelId) => {
    try {
      const response = await fetch(`http://localhost:3000/channels/${channelId}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username }), // Send username to verify creator
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to delete channel");
      }

      setChannels(channels.filter((channel) => channel.id !== channelId));
    } catch (error) {
      alert(error.message);
    }
  };

  return (
    <div>
      <h2>Channels</h2>

      <input
        type="text"
        placeholder="Enter channel name"
        value={newChannelName}
        onChange={(e) => setNewChannelName(e.target.value)}
      />
      <button onClick={createChannel}>Add Channel</button>

      <ul>
        {channels.map((channel) => (
          <li key={channel.id}>
            <span onClick={() => onChannelCLick(channel.id)}>{channel.name}</span>
            {channel.creator === username && (
              <button onClick={() => deleteChannel(channel.id)}>Delete</button>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default Channels;
