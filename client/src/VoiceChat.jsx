import { useEffect, useRef, useState } from "react";
import io from "socket.io-client";

const socket = io("http://localhost:3000");

export default function VoiceChat() {
  const [joined, setJoined] = useState(false);
  const localStreamRef = useRef(null);
  const peersRef = useRef({});
  
  useEffect(() => {
    socket.on("user-joined", handleUserJoined);
    socket.on("signal", handleSignal);
    return () => {
      socket.off("user-joined", handleUserJoined);
      socket.off("signal", handleSignal);
    };
  }, []);

  const joinRoom = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    localStreamRef.current = stream;
    setJoined(true);
    socket.emit("join-channel", "voice-chat-room");
  };

  const handleUserJoined = async (userId) => {
    const peerConnection = new RTCPeerConnection();
    peersRef.current[userId] = peerConnection;

    localStreamRef.current.getTracks().forEach((track) => {
      peerConnection.addTrack(track, localStreamRef.current);
    });

    peerConnection.onicecandidate = (event) => {
      if (event.candidate) {
        socket.emit("signal", { to: userId, signal: event.candidate });
      }
    };

    peerConnection.ontrack = (event) => {
      const audio = new Audio();
      audio.srcObject = event.streams[0];
      audio.play();
    };

    const offer = await peerConnection.createOffer();
    await peerConnection.setLocalDescription(offer);
    socket.emit("signal", { to: userId, signal: offer });
  };

  const handleSignal = async (data) => {
    let peerConnection = peersRef.current[data.from];
    if (!peerConnection) {
      peerConnection = new RTCPeerConnection();
      peersRef.current[data.from] = peerConnection;

      localStreamRef.current.getTracks().forEach((track) => {
        peerConnection.addTrack(track, localStreamRef.current);
      });

      peerConnection.onicecandidate = (event) => {
        if (event.candidate) {
          socket.emit("signal", { to: data.from, signal: event.candidate });
        }
      };

      peerConnection.ontrack = (event) => {
        const audio = new Audio();
        audio.srcObject = event.streams[0];
        audio.play();
      };
    }

    if (data.signal.type === "offer") {
      await peerConnection.setRemoteDescription(new RTCSessionDescription(data.signal));
      const answer = await peerConnection.createAnswer();
      await peerConnection.setLocalDescription(answer);
      socket.emit("signal", { to: data.from, signal: answer });
    } else if (data.signal.type === "answer") {
      await peerConnection.setRemoteDescription(new RTCSessionDescription(data.signal));
    } else if (data.signal.candidate) {
      await peerConnection.addIceCandidate(new RTCIceCandidate(data.signal));
    }
  };

  return (
    <div className="p-4">
      <h1 className="text-xl font-bold">WebRTC Voice Chat</h1>
      {!joined && <button className="mt-4 p-2 bg-blue-500 text-white" onClick={joinRoom}>Join Chat</button>}
    </div>
  );
}
