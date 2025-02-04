import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import io from "socket.io-client";

const Channel = ({ selectedChannel, prevChannelRef, onChannelLeft, socketRef, channelsUpdated, setChannelsUpdated }) => {
  const navigate = useNavigate();
  const localStreamRef = useRef(null);
  const peersRef = useRef({});

  const username = localStorage.getItem("username")
  const userid = localStorage.getItem("userid")


  useEffect(() => {
    const username = localStorage.getItem("username");
    if (!username) {
      navigate("/");
      return;
    }

    if (selectedChannel == -1) {
      return;
    }

    if (prevChannelRef.current != -1) {
      onLeaveChannel(prevChannelRef.current);
    }

    socketRef.current.on("user-joined", handleUserJoined);
    socketRef.current.on("signal", handleSignal);
    socketRef.current.on("user-left", handleUserLeft);
    socketRef.current.on("channel-deleted", handleChannelDeletion);

    onJoinChannel(selectedChannel).catch(console.error)
    return () => {
      socketRef.current.off("user-joined", handleUserJoined);
      socketRef.current.off("signal", handleSignal);
      socketRef.current.off("user-left", handleUserLeft);
      socketRef.current.off("channel-deleted", handleChannelDeletion);

    };
  }, [selectedChannel, navigate]);

  const onJoinChannel = async (channelId) => {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    localStreamRef.current = stream;

    const sendJoinReq = async (channelId) => {
      try {
        const response = await fetch(`http://localhost:3000/channel/${channelId}/join`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ user_id: userid })
        });
        if (!response.ok) {
          throw new Error("Failed to join channel");
        }
      } catch (error) {
        console.error("Error joining channel:", error);
      }
    }

    await sendJoinReq(channelId);

    socketRef.current.emit("join-channel", channelId);

  };

  const handleUserJoined = async (userId) => {
    const peerConnection = new RTCPeerConnection();
    peersRef.current[userId] = peerConnection;

    localStreamRef.current.getTracks().forEach((track) => {
      peerConnection.addTrack(track, localStreamRef.current);
    });

    peerConnection.onicecandidate = (event) => {
      if (event.candidate) {
        socketRef.current.emit("signal", { to: userId, signal: event.candidate });
      }
    };

    peerConnection.ontrack = (event) => {
      const audio = new Audio();
      audio.srcObject = event.streams[0];
      audio.play();
    };

    const offer = await peerConnection.createOffer();
    await peerConnection.setLocalDescription(offer);
    socketRef.current.emit("signal", { to: userId, signal: offer });
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
          socketRef.current.emit("signal", { to: data.from, signal: event.candidate });
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
      socketRef.current.emit("signal", { to: data.from, signal: answer });
    } else if (data.signal.type === "answer") {
      await peerConnection.setRemoteDescription(new RTCSessionDescription(data.signal));
    } else if (data.signal.candidate) {
      await peerConnection.addIceCandidate(new RTCIceCandidate(data.signal));
    }
  };

  const onLeaveChannel = async (channelId, gotDeleted = false) => {
    Object.values(peersRef.current).forEach((peer) => peer.close());
    peersRef.current = {};
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => track.stop());
    }

    const sendLeaveReq = async (channelId) => {
      try {
        const response = await fetch(`http://localhost:3000/channel/${channelId}/leave`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ user_id: userid })
        });
        if (!response.ok) {
          throw new Error("Failed to leave channel");
        }
      } catch (error) {
        console.error("Error leaving channel:", error);
      }
    }

    if(!gotDeleted) {
      await sendLeaveReq(channelId);
    }

    socketRef.current.emit("leave-channel", channelId);

  };

  const handleUserLeft = (userId) => {
    if (peersRef.current[userId]) {
      peersRef.current[userId].close();
      delete peersRef.current[userId];
    }
  };

  const handleChannelDeletion = (channelId) => {
    setChannelsUpdated(true);

    if (channelId == selectedChannel) {
      onLeaveChannel(selectedChannel, true);
      onChannelLeft(selectedChannel);
    }
    
  }

  if (selectedChannel == -1) {
    return <div>Select a channel</div>
  } else {
    return (
      <div>
        <h2>Channel {selectedChannel}</h2>
        <button onClick={() => {
          onLeaveChannel(selectedChannel);
          onChannelLeft(selectedChannel)}
          }>Leave Channel</button>
      </div>
    );
  }
};

export default Channel;
