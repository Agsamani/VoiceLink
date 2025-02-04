import { useEffect, useState, useRef } from 'react';
import { useNavigate } from "react-router-dom";
import io, { Socket } from 'socket.io-client';
import Channels from './Channels';


const Home = () => {
    const navigate = useNavigate();
    const mediaStreamRef = useRef(null);
    const mediaRecorderRef = useRef(null);
    const mediaSourceRef = useRef(null);
    const sourceBufferRef = useRef(null);
    const audioQueueRef = useRef([]);
    const socketRef = useRef(null);

    const onChannelClick = async (channelId, prevChannelId) => {

        if (prevChannelId != -1) {
            await shutdown()
            socketRef.current.emit("leave-channel", prevChannelId)
        }
        init(channelId)
        socketRef.current.emit("join-channel", channelId)

        // TODO: send request to server to change users channel in db
        console.log("user joined channel: " + channelId)
    }

    const initializeMediaSource = () => {
        if (!mediaSourceRef.current) {
            mediaSourceRef.current = new MediaSource();
            const audio = new Audio();
            audio.src = URL.createObjectURL(mediaSourceRef.current);
            audio.play();

            mediaSourceRef.current.addEventListener('sourceopen', () => {
                sourceBufferRef.current = mediaSourceRef.current.addSourceBuffer('audio/webm; codecs=opus');
                sourceBufferRef.current.addEventListener('updateend', processQueue);
                processQueue();
            });
        }
    };

    const processQueue = () => {
        if (!sourceBufferRef.current || 
            sourceBufferRef.current.updating || 
            mediaSourceRef.current?.readyState !== 'open' ||
            audioQueueRef.current.length === 0
        ) {
            return;
        }

        if (audioQueueRef.current.length > 0) {
            const data = audioQueueRef.current.shift();
            try {
                sourceBufferRef.current.appendBuffer(data);
            } catch (error) {
                console.error("Buffer append error:", error);
                audioQueueRef.current.unshift(data);
            }
        }
    };

    const init = async (channelId) => {
        try {

            initializeMediaSource();

            mediaStreamRef.current = await navigator.mediaDevices.getUserMedia({ audio: true });
            mediaRecorderRef.current = new MediaRecorder(mediaStreamRef.current, {
                mimeType: 'audio/webm; codecs=opus'
            });

            mediaRecorderRef.current.ondataavailable = async (event) => {
                if (event.data.size > 0) {
                    const buffer = await event.data.arrayBuffer();
                    socketRef.current.emit("voice", { channel: channelId, data: buffer });
                }
            };

            mediaRecorderRef.current.start(100);
        } catch (error) {
            console.error("Error accessing microphone:", error);
        }
    };

    const shutdown = async () => {
        mediaRecorderRef.current.stop();
        mediaStreamRef.current.getTracks().forEach(track => track.stop());

        audioQueueRef.current = [];
        
        if (sourceBufferRef.current && mediaSourceRef.current?.readyState === 'open') {
            try {
                sourceBufferRef.current.abort();
                mediaSourceRef.current.endOfStream();
            } catch (error) {
                console.error("Cleanup error:", error);
            }
        }
    };

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
                // Always add to queue first
                const buffer = new Uint8Array(data);
                audioQueueRef.current.push(buffer);
                
                // Trigger processing only if not already updating
                if (sourceBufferRef.current && !sourceBufferRef.current.updating) {
                    processQueue();
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
