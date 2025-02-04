import { useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import io from "socket.io-client";

const Channel = () => {
  const { channelId } = useParams();
  const navigate = useNavigate();
  const socketRef = useRef(null);
  const mediaStreamRef = useRef(null);
  const mediaRecorderRef = useRef(null);

  useEffect(() => {
    const username = localStorage.getItem("username");
    if (!username) {
      navigate("/");
      return;
    }

    socketRef.current = io("http://localhost:3000");

    socketRef.current.emit("join-channel", channelId);

    const startRecording = async () => {
      try {
        mediaStreamRef.current = await navigator.mediaDevices.getUserMedia({ audio: true });
        mediaRecorderRef.current = new MediaRecorder(mediaStreamRef.current, {
          mimeType: "audio/webm; codecs=opus",
        });

        mediaRecorderRef.current.ondataavailable = (event) => {
          if (event.data.size > 0) {
            socketRef.current.emit("voice", { channel: channelId, data: event.data });
          }
        };

        mediaRecorderRef.current.start(100);
      } catch (error) {
        console.error("Microphone error:", error);
      }
    };

    startRecording();

    return () => {
      socketRef.current.emit("leave-channel", channelId);
      socketRef.current.disconnect();
      mediaRecorderRef.current?.stop();
      mediaStreamRef.current?.getTracks().forEach((track) => track.stop());
    };
  }, [channelId, navigate]);

  return (
    <div>
      <h2>Channel {channelId}</h2>
      <button onClick={() => navigate("/home")}>Leave Channel</button>
    </div>
  );
};

export default Channel;
