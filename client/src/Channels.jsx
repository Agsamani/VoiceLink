import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import ChannelUsers from "./ChannelUsers";

const Channels = ({ onChannelCLick, onChannelCreate, onChannelDelete, channelsUpdated, setChannelsUpdated, usersUpdated, setUsersUpdated }) => {
  const [channels, setChannels] = useState([]);
  const [newChannelName, setNewChannelName] = useState("");
  const navigate = useNavigate();
  const username = localStorage.getItem("username")
  const userid = localStorage.getItem("userid")

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
    setChannelsUpdated(false)

  }, [channelsUpdated]);

  const createChannel = async () => {
    if (!newChannelName.trim()) return alert("Channel name cannot be empty");
    try {
      const response = await fetch("http://localhost:3000/channels", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newChannelName, creator_id: userid }), // Store creator
      });

      if (!response.ok) throw new Error("Failed to create channel");

      setNewChannelName("");

      onChannelCreate();
    } catch (error) {
      alert(error.message);
    }
  };

  const deleteChannel = async (channelId) => {
    try {
      const response = await fetch(`http://localhost:3000/channels/${channelId}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id:userid }), // Send userid to verify creator
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to delete channel");
      }

      setChannels(channels.filter((channel) => channel.id !== channelId));

      onChannelDelete(channelId);
    } catch (error) {
      alert(error.message);
    }
  };

  return (
    <div className="container mt-3">
      <h2 className="text-primary">Channels</h2>

      <div className="input-group mb-3">
        <input
          type="text"
          className="form-control"
          placeholder="Enter channel name"
          value={newChannelName}
          onChange={(e) => setNewChannelName(e.target.value)}
        />
        <button className="btn btn-success" onClick={createChannel}>Add Channel</button>
      </div>

      <ul className="list-group">
        {channels.map((channel) => (
          <li key={channel.id} className="list-group-item d-flex justify-content-between align-items-center">
            <span className="fw-bold text-primary" style={{ cursor: "pointer" }} onClick={() => onChannelCLick(channel.id)}>
              {channel.name}
            </span>
            <div>
              {channel.creator == userid && (
                <button className="btn btn-danger btn-sm ms-2" onClick={() => deleteChannel(channel.id)}>
                  Delete
                </button>
              )}
            </div>
            <ChannelUsers channelId={channel.id} usersUpdated={usersUpdated} setUsersUpdated={setUsersUpdated} />
          </li>
        ))}
      </ul>
    </div>
  );
};

export default Channels;
