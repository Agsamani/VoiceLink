import { useEffect, useState, useRef } from 'react';
import io from 'socket.io-client';
import PropTypes from 'prop-types';

const VoiceChat = ({ username, onLogout }) => {
    const [isTalking, setIsTalking] = useState(false);
    const mediaStreamRef = useRef(null);
    const mediaRecorderRef = useRef(null);
    const mediaSourceRef = useRef(null);
    const sourceBufferRef = useRef(null);
    const audioQueueRef = useRef([]);
    const socketRef = useRef(null);

    useEffect(() => {
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
            socketRef.current.disconnect();
        };
    }, []);

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
        if (!sourceBufferRef.current || sourceBufferRef.current.updating || mediaSourceRef.current.readyState !== 'open') {
            return;
        }

        if (audioQueueRef.current.length > 0) {
            const data = audioQueueRef.current.shift();
            sourceBufferRef.current.appendBuffer(data);
        }
    };

    const startTalking = async () => {
        try {
            mediaStreamRef.current = await navigator.mediaDevices.getUserMedia({ audio: true });
            mediaRecorderRef.current = new MediaRecorder(mediaStreamRef.current, {
                mimeType: 'audio/webm; codecs=opus'
            });

            initializeMediaSource();

            mediaRecorderRef.current.ondataavailable = async (event) => {
                if (event.data.size > 0) {
                    const buffer = await event.data.arrayBuffer();
                    socketRef.current.emit("voice", buffer);
                }
            };

            mediaRecorderRef.current.start(100);
            setIsTalking(true);
        } catch (error) {
            console.error("Error accessing microphone:", error);
        }
    };

    const stopTalking = () => {
        mediaRecorderRef.current.stop();
        mediaStreamRef.current.getTracks().forEach(track => track.stop());
        setIsTalking(false);
    };

    const handleLogout = async () => {
        try {
            await fetch("http://localhost:3000/logout", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ username }),
            });

            onLogout(); // Notify parent component
        } catch (error) {
            console.error("Logout error:", error);
        }
    };

    return (
        <div>
            <h1>Live Voice Chat</h1>
            <p>Logged in as: <strong>{username}</strong></p>
            <button onClick={startTalking} disabled={isTalking}>Start Talking</button>
            <button onClick={stopTalking} disabled={!isTalking}>Stop Talking</button>
            <button onClick={handleLogout}>Logout</button>
        </div>
    );
};

VoiceChat.propTypes = {
    username: PropTypes.string.isRequired,
    onLogout: PropTypes.func.isRequired
};

export default VoiceChat;
