import { useEffect, useState, useRef } from 'react';
import { useNavigate } from "react-router-dom";
import io from 'socket.io-client';
import Channels from './Channels';


const Home = () => {
    const navigate = useNavigate();
    const mediaStreamRef = useRef(null);
    const mediaRecorderRef = useRef(null);
    const mediaSourceRef = useRef(null);
    const sourceBufferRef = useRef(null);
    const audioQueueRef = useRef([]);
    const socketRef = useRef(null);

    const onChannelClick = (channelId) => {
        console.log(channelId)
    }

    const logout = async (username) => {
        try {
            localStorage.setItem("username", "");

            const response = await fetch("http://localhost:3000/logout", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ username }),
            })

            const data = await response.json();
            if (!response.ok) {
                alert(data.error || "Logout failed");
            }


        } catch (error) {
            console.error("Logout error:", error);
        }
    };

    useEffect(() => {
        const username = localStorage.getItem("username");
        console.log("u" + username)

        if (!username) {
            navigate("/"); 
        }

        window.addEventListener("beforeunload", (e) => 
        {  
            logout(username)
        });

        socketRef.current = io("http://localhost:3000");

        socketRef.current.on("voice", (data) => {
            try {
                if (!sourceBufferRef.current || mediaSourceRef.current.readyState !== 'open') {
                    audioQueueRef.current.push(new Uint8Array(data));
                } else {
                    sourceBufferRef.current.appendBuffer(new Uint8Array(data));
                }
            } catch (error) {
                console.error("Audio handling error:", error);
            }
        });

        return () => {
            logout(username)
            socketRef.current.disconnect();
        };
    }, [navigate]);

    return (
        <div>
            <Channels onChannelClick={onChannelClick}/>
        </div>
    );
};

export default Home;
