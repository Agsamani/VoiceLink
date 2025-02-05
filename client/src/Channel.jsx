import { useEffect, useImperativeHandle, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import io from "socket.io-client";
import User from "./User";

const Channel = ({ selectedChannel, prevChannelRef, onChannelLeft, socketRef, channelsUpdated, setChannelsUpdated, logoutCallbackRef }) => {
  const navigate = useNavigate();
  const localStreamRef = useRef(null);
  const peersRef = useRef({});
  const [users, setUsers] = useState([]);
  const socketMapRef = useRef({})

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

  const fetchUsers = async () => {
    try {
      const response = await fetch(`http://localhost:3000/channels/${selectedChannel}/users`);
      if (!response.ok) {
        throw new Error("Failed to fetch users");
      }
      const data = await response.json();
      console.log(data)
      setUsers(data);
    } catch (err) {
      console.error(err.message);
    } 

    try {
      const response = await fetch(`http://localhost:3000/socketmaps`);
      if (!response.ok) {
        throw new Error("Failed to fetch users");
      }
      const data = await response.json();
      console.log(data)
      socketMapRef.current = data;
    } catch (err) {
      console.error(err.message);
    } 
  };

  const onLogout = () => {
    onLeaveChannel(selectedChannel, true);
    onChannelLeft(selectedChannel);
  }

  useImperativeHandle(logoutCallbackRef, () => {
    return {
      fn: onLogout,
    }
  }, []);


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

    fetchUsers();

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
    fetchUsers();
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

  const onLeaveChannel = async (channelId, sendReq = false) => {
    Object.values(peersRef.current).forEach((peer) => peer.close());
    peersRef.current = {};
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => track.stop());
      localStreamRef.current = null;
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

    if(!sendReq) {
      await sendLeaveReq(channelId);
    }

    socketRef.current.emit("leave-channel", channelId);

  };

  const handleUserLeft = (userId) => {
    if (peersRef.current[userId]) {
      peersRef.current[userId].close();
      delete peersRef.current[userId];
    }
    fetchUsers()
  };

  const handleChannelDeletion = (channelId) => {
    setChannelsUpdated(true);

    if (channelId == selectedChannel) {
      onLeaveChannel(selectedChannel, true);
      onChannelLeft(selectedChannel);
    }
    
  }

  const muteUser = (userId) => {
    const socketId = socketMapRef.current[userId];
    if (peersRef.current[socketId]) {

      const audioTracks = peersRef.current[socketId].getReceivers()
        .map(receiver => receiver.track)
        .filter(track => track.kind === "audio");
  
      audioTracks.forEach(track => {
        track.enabled = !track.enabled; // Toggle mute
      });
    }
  };

  const muteSelf = () => {
    if (localStreamRef.current) {
      localStreamRef.current.getAudioTracks().forEach(track => {
        track.enabled = !track.enabled; // Toggle mute
      });
    }
  };  

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
        <h3>Users</h3>
        <ul>
          {users.map(user => (<li key={user.id}><User userid={user.id} username={user.username} onMuteUser={muteUser}/></li>))}
        </ul>
        <button onClick={() => {muteSelf()}}>Mute Me!</button>
      </div>
    );
  }
};

export default Channel;
