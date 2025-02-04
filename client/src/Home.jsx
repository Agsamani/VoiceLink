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
  const [channelsUpdated, setChannelsUpdated] = useState(false)


  const logout = async () => {
    if (!username) {
      navigate("/", { replace: true }); // Ensure navigation replaces history
      return;
    }
  
    try {
      await fetch("http://localhost:3000/logout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username }),
      });
  
      localStorage.removeItem("username");
      localStorage.removeItem("userid");
  
      // Ensure state updates before navigation
      setUsername("");
      setTimeout(() => navigate("/", { replace: true }), 100); 
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  const onChannelCLick = (channelId) => {
    prevChannelRef.current = selectedChannel;
    setSelectedChannel(channelId);
  }

  const onChannelLeft = (channelId) => {
    setSelectedChannel(-1);
    prevChannelRef.current = -1;
  }

  const onChannelCreate = () => {
    socketRef.current.emit("create-channel");
  }

  const onChannelDelete = (channelId) => {
    socketRef.current.emit("delete-channel", channelId);
  } 
  

  useEffect(() => {
    const storedUsername = localStorage.getItem("username");
  
    if (!storedUsername) {
      navigate("/", { replace: true });
      return;
    }
  
    setUsername(storedUsername);
    socketRef.current = io("http://localhost:3000");

    socketRef.current.on("channel-created", () => {
        setChannelsUpdated(true);
    })

    socketRef.current.on("channel-deleted", () => {
      setChannelsUpdated(true);
    });

  
    return () => {
      socketRef.current.disconnect();
    };
  }, [username, navigate]);

  return (
    <div>
      <h2>Welcome, {username}</h2>
      <button onClick={logout}>Logout</button>
      <Channels username={username} 
                onChannelCLick={onChannelCLick} 
                onChannelCreate = {onChannelCreate} 
                onChannelDelete = {onChannelDelete} 
                channelsUpdated={channelsUpdated} 
                setChannelsUpdated={setChannelsUpdated}/>
      <Channel 
                selectedChannel={selectedChannel} 
                prevChannelRef={prevChannelRef} 
                onChannelLeft={onChannelLeft} 
                socketRef={socketRef} 
                channelsUpdated={channelsUpdated} 
                setChannelsUpdated={setChannelsUpdated}/>
    </div>
  );
};

export default Home;
