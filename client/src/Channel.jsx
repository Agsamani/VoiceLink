import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import io from "socket.io-client";

const Channel = () => {
  const { channelId } = useParams();
  const navigate = useNavigate();
  const socketRef = useRef(null);
  const mediaStreamRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const [isTalking, setIsTalking] = useState(false);
  const mediaSourceRef = useRef(null);
  const sourceBufferRef = useRef(null);
  const audioQueueRef = useRef([]);

  useEffect(() => {
    const username = localStorage.getItem("username");
    if (!username) {
      navigate("/");
      return;
    }

    socketRef.current = io("http://localhost:3000");
    socketRef.current.emit("join-channel", channelId);

    socketRef.current.on("voice", (data) => {
      try {
        if (!sourceBufferRef.current || mediaSourceRef.current.readyState !== "open") {
          audioQueueRef.current.push(new Uint8Array(data));
        } else {
          sourceBufferRef.current.appendBuffer(new Uint8Array(data));
        }
      } catch (error) {
        console.error("Audio handling error:", error);
      }
    });

    return () => {
      socketRef.current.emit("leave-channel", channelId);
      socketRef.current.disconnect();
      mediaRecorderRef.current?.stop();
      mediaStreamRef.current?.getTracks().forEach((track) => track.stop());
    };
  }, [channelId, navigate]);

  const initializeMediaSource = () => {
    if (!mediaSourceRef.current) {
      mediaSourceRef.current = new MediaSource();
      const audio = new Audio();
      audio.src = URL.createObjectURL(mediaSourceRef.current);
      audio.play();

      mediaSourceRef.current.addEventListener("sourceopen", () => {
        sourceBufferRef.current = mediaSourceRef.current.addSourceBuffer("audio/webm; codecs=opus");
        sourceBufferRef.current.addEventListener("updateend", processQueue);
        processQueue();
      });
    }
  };

  const processQueue = () => {
    if (!sourceBufferRef.current || sourceBufferRef.current.updating || mediaSourceRef.current.readyState !== "open") {
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
        mimeType: "audio/webm; codecs=opus",
      });

      initializeMediaSource();

      mediaRecorderRef.current.ondataavailable = async (event) => {
        if (event.data.size > 0) {
          const buffer = await event.data.arrayBuffer();
          socketRef.current.emit("voice", { channel: channelId, data: buffer });
        }
      };

      mediaRecorderRef.current.start(100);
      setIsTalking(true);
    } catch (error) {
      console.error("Error accessing microphone:", error);
    }
  };

  const stopTalking = () => {
    mediaRecorderRef.current?.stop();
    mediaStreamRef.current?.getTracks().forEach((track) => track.stop());
    setIsTalking(false);
  };

  return (
    <div>
      <h2>Channel {channelId}</h2>
      <button onClick={startTalking} disabled={isTalking}>Start Talking</button>
      <button onClick={stopTalking} disabled={!isTalking}>Stop Talking</button>
      <button onClick={() => navigate("/home")}>Leave Channel</button>
    </div>
  );
};

export default Channel;
