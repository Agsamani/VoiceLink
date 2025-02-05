import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import io from "socket.io-client";
import Channels from "./Channels";
import Channel from "./Channel";

const Home = () => {
  const navigate = useNavigate();
  const socketRef = useRef(null);
  const [username, setUsername] = useState("");
  const [selectedChannel, setSelectedChannel] = useState(-1);
  const prevChannelRef = useRef(-1);
  const [channelsUpdated, setChannelsUpdated] = useState(false);
  const [usersUpdated, setUsersUpdated] = useState(false);

  const logoutCallbackRef = useRef(null);
  

  const userid = localStorage.getItem("userid")

  const logout = async () => {
    if (!username) {
      navigate("/", { replace: true }); // Ensure navigation replaces history
      return;
    }
  
    try {
      await fetch(`${import.meta.env.VITE_SERVER_ADDRESS}/logout`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id:userid }),
      });

      
      if(logoutCallbackRef.current) {
        logoutCallbackRef.current.fn(selectedChannel);
      }
  
      localStorage.removeItem("username");
      localStorage.removeItem("userid");
  
      setUsername("");
      setTimeout(() => navigate("/", { replace: true }), 100); 
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  const onChannelCLick = async (channelId) => {
    prevChannelRef.current = selectedChannel;
    setSelectedChannel(channelId);
  };

  const onChannelLeft = async (channelId) => {
    setSelectedChannel(-1);
    prevChannelRef.current = -1;
  };

  const onChannelCreate = () => {
    socketRef.current.emit("create-channel");
  };

  const onChannelDelete = (channelId) => {
    socketRef.current.emit("delete-channel", channelId);
  };

  useEffect(() => {
    const storedUsername = localStorage.getItem("username");
  
    if (!storedUsername) {
      navigate("/", { replace: true });
      return;
    }
  
    setUsername(storedUsername);
    socketRef.current = io(`${import.meta.env.VITE_SERVER_ADDRESS}`);

    socketRef.current.on("channel-created", () => {
        setChannelsUpdated(true);
    });

    socketRef.current.on("channel-deleted", () => {
      setChannelsUpdated(true);
    });

    socketRef.current.on("users-updated", () => {
    console.log(usersUpdated)

      setUsersUpdated(true);
    });

    socketRef.current.emit("logged-in", userid);
  
    return () => {
      socketRef.current.disconnect();
    };
  }, [username, navigate]);

  return (
    <div className="container mt-5">
      <div style={{
        display: "flex",
        flexDirection: "row",
        justifyContent: "space-between"
      }}>
        <h2 className="mb-4">Welcome, {username}</h2>
      
        <button className="btn btn-danger mb-3" onClick={logout}>
          Logout
        </button>
      </div>

      <div className="row">
        <div className="col-md-4">
          <Channels
            username={username}
            onChannelCLick={onChannelCLick}
            onChannelCreate={onChannelCreate}
            onChannelDelete={onChannelDelete}
            channelsUpdated={channelsUpdated}
            setChannelsUpdated={setChannelsUpdated}
            usersUpdated={usersUpdated}
            setUsersUpdated={setUsersUpdated}
          />
        </div>
        <div className="col-md-8 mt-10">
          <Channel
            selectedChannel={selectedChannel}
            prevChannelRef={prevChannelRef}
            onChannelLeft={onChannelLeft}
            socketRef={socketRef}
            channelsUpdated={channelsUpdated}
            setChannelsUpdated={setChannelsUpdated}
            logoutCallbackRef={logoutCallbackRef}
          />
        </div>
      </div>
    </div>
  );
};

export default Home;
