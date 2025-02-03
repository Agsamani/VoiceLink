import { useEffect, useState } from "react";

const Channels = () => {
  const [channels, setChannels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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

  if (loading) return <p>Loading...</p>;
  if (error) return <p>Error: {error}</p>;

  return (
    <div>
      <h2>Channels</h2>
      <ul>
        {channels.map((channel) => (
          <li key={channel.id}>
            {channel.name}
            <button onClick={() => deleteChannel(channel.id)}>Delete</button>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default Channels;
