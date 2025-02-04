import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import io from "socket.io-client";
import Channels from "./Channels";

const Home = () => {
  const navigate = useNavigate();
  const socketRef = useRef(null);
  const [username, setUsername] = useState("");

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
  
      // Ensure state updates before navigation
      setUsername("");
      setTimeout(() => navigate("/", { replace: true }), 100); 
    } catch (error) {
      console.error("Logout error:", error);
    }
  };
  

  useEffect(() => {
    const storedUsername = localStorage.getItem("username");
  
    if (!storedUsername) {
      navigate("/", { replace: true });
      return;
    }
  
    setUsername(storedUsername);
    socketRef.current = io("http://localhost:3000");
  
    return () => {
      socketRef.current.disconnect();
    };
  }, [username, navigate]);

  return (
    <div>
      <h2>Welcome, {username}</h2>
      <button onClick={logout}>Logout</button>
      <Channels username={username} />
    </div>
  );
};

export default Home;
