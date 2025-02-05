import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import ChannelUsers from "./ChannelUsers";

const Channels = ({ onChannelCLick, onChannelCreate, onChannelDelete, channelsUpdated, setChannelsUpdated, usersUpdated, setUsersUpdated, setSelectedChannelName }) => {
  const [channels, setChannels] = useState([]);
  const [newChannelName, setNewChannelName] = useState("");
  const username = localStorage.getItem("username")
  const userid = localStorage.getItem("userid")

  useEffect(() => {
    const fetchChannels = async () => {
      try {
        const response = await fetch(`${import.meta.env.VITE_SERVER_ADDRESS}/channels`);
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
      const response = await fetch(`${import.meta.env.VITE_SERVER_ADDRESS}/channels`, {
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
      const response = await fetch(`${import.meta.env.VITE_SERVER_ADDRESS}/channels/${channelId}`, {
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
      <h2 className="text-dark mt-3 mb-3">Channels</h2>

      <div className="input-group mb-3">
        <input
          type="text"
          className="form-control"
          placeholder="Enter channel name"
          value={newChannelName}
          onChange={(e) => setNewChannelName(e.target.value)}
        />
        <button className="btn my-purple" onClick={createChannel}>+</button>
      </div>

      <ul className="list-group">
        {channels.map((channel) => (
          <li key={channel.id} className="list-group-item d-flex justify-content-between align-items-center mb-3 border rounded">
            <div className="channel-name-li col-md-8">
              <span className="fw-bold text-primary" style={{ cursor: "pointer" }} onClick={() => {
                    onChannelCLick(channel.id);
                    setSelectedChannelName(channel.name);
                    }}>
                {channel.name}
              </span>
              {channel.creator == userid && (
                <button className="btn btn-danger btn-sm delete-btn mb-2" onClick={() => deleteChannel(channel.id)}>
                  Delete
                </button>
              )}
            </div>
            <div className="col-md-4">
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default Channels;
