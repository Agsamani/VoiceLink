import { useEffect, useImperativeHandle, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import io, { Socket } from "socket.io-client";
import User from "./User";

const Channel = ({ selectedChannel, prevChannelRef, onChannelLeft, socketRef, channelsUpdated, setChannelsUpdated, logoutCallbackRef }) => {
  const navigate = useNavigate();
  const localStreamRef = useRef(null);
  const peersRef = useRef({});
  const [users, setUsers] = useState([]);
  const socketMapRef = useRef({});
  const [usersVolume, setUsersVolume] = useState({});

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
      const response = await fetch(`${import.meta.env.VITE_SERVER_ADDRESS}/channels/${selectedChannel}/users`);
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
      const response = await fetch(`${import.meta.env.VITE_SERVER_ADDRESS}/socketmaps`);
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

  const onLogout = (channelId) => {
    onLeaveChannel(channelId, true);
    onChannelLeft(channelId);
  }

  useImperativeHandle(logoutCallbackRef, () => {
    return {
      fn: onLogout,
    }
  }, []);


  const onJoinChannel = async (channelId) => {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    localStreamRef.current = stream;

    const audioContext = new AudioContext();
    const source = audioContext.createMediaStreamSource(localStreamRef.current);
    const analyser = audioContext.createAnalyser();
    source.connect(analyser);
    analyser.fftSize = 512;
    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    
    const checkVolume = () => {
      analyser.getByteFrequencyData(dataArray);
      const volume = dataArray.reduce((sum, value) => sum + value, 0) / bufferLength;

      setUsersVolume(prev => ({
        ...prev,
        [socketRef.current.id]: volume
      }));
      requestAnimationFrame(checkVolume);
    };

    checkVolume();

    const sendJoinReq = async (channelId) => {
      try {
        const response = await fetch(`${import.meta.env.VITE_SERVER_ADDRESS}/channel/${channelId}/join`, {
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
    const peerConnection = new RTCPeerConnection({
      iceServers: [{ urls: "stun:stun.l.google.com:19302" },  {
        url: 'turn:turn.anyfirewall.com:443?transport=tcp',
        credential: 'webrtc',
        username: 'webrtc'
    }]
    });
    
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

      const audioContext = new AudioContext();
        const source = audioContext.createMediaStreamSource(event.streams[0]);
        const analyser = audioContext.createAnalyser();
        source.connect(analyser);
        analyser.fftSize = 512;
        const bufferLength = analyser.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);
        
        const checkVolume = () => {
          analyser.getByteFrequencyData(dataArray);
          const volume = dataArray.reduce((sum, value) => sum + value, 0) / bufferLength;

          setUsersVolume(prev => ({
            ...prev,
            [userId]: volume
          }));
          requestAnimationFrame(checkVolume);
        };

        checkVolume();
    };

    const offer = await peerConnection.createOffer();
    await peerConnection.setLocalDescription(offer);
    socketRef.current.emit("signal", { to: userId, signal: offer });
    fetchUsers();
  };

  const handleSignal = async (data) => {
    let peerConnection = peersRef.current[data.from];
    if (!peerConnection) {
      peerConnection = new RTCPeerConnection({
        iceServers: [{ urls: "stun:stun.l.google.com:19302" },  {
          url: 'turn:turn.anyfirewall.com:443?transport=tcp',
          credential: 'webrtc',
          username: 'webrtc'
      }]
      });
      
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

        const audioContext = new AudioContext();
        const source = audioContext.createMediaStreamSource(event.streams[0]);
        const analyser = audioContext.createAnalyser();
        source.connect(analyser);
        analyser.fftSize = 512;
        const bufferLength = analyser.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);
        
        const checkVolume = () => {
          analyser.getByteFrequencyData(dataArray);
          const volume = dataArray.reduce((sum, value) => sum + value, 0) / bufferLength;

          setUsersVolume(prev => ({
            ...prev,
            [data.from]: volume
          }));
          requestAnimationFrame(checkVolume);
        };

        checkVolume();
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
        const response = await fetch(`${import.meta.env.VITE_SERVER_ADDRESS}/channel/${channelId}/leave`, {
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
    return <div className="card mt-3 border border-dark rounded">
      <div className="card-header bg-primary text-white">
          <h2 className="mb-0"> Channel </h2>
      </div>
      <div className="alert alert-info text-center m-5">Select a channel</div>
    </div>
  } else {
    return (
      <div className="card mt-3 border border-dark rounded">
        <div className="card-header bg-primary text-white">
          <h2 className="mb-0"> Channel: {selectedChannel}</h2>
        </div>
        <div className="card-body">
          <button className="btn btn-warning" onClick={() => {
            onLeaveChannel(selectedChannel);
            onChannelLeft(selectedChannel);
          }}>
            Leave Channel
          </button>

          <h3 className="mt-3">Users</h3>
          <ul className="list-group">
            {users.map(user => (
              <li key={user.id} className="list-group-item d-flex justify-content-between align-items-center">
                <User userid={user.id} username={user.username} onMuteUser={muteUser} volume={usersVolume[socketMapRef.current[user.id]]} />
              </li>
            ))}
          </ul>

          <button className="btn btn-dark mt-3" onClick={() => muteSelf()}>
            Mute Me!
          </button>
        </div>
      </div>
    );
  }
};

export default Channel;
