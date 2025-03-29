import React, { useEffect, useRef, useState } from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import io from 'socket.io-client';
import Peer from 'simple-peer';

const VideoCall = ({ roomId }) => {
  const { user } = useAuth0();
  const [peers, setPeers] = useState({});
  const [socket, setSocket] = useState(null);
  const [stream, setStream] = useState(null);
  const [screenShareStream, setScreenShareStream] = useState(null);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [chatMessages, setChatMessages] = useState([]);
  const [messageInput, setMessageInput] = useState('');
  const [participantsList, setParticipantsList] = useState([]);
  
  const userVideo = useRef();
  const peersRef = useRef({});
  const socketRef = useRef();
  const chatContainerRef = useRef();

  // Initialize connection
  useEffect(() => {
    socketRef.current = io('http://localhost:5000');
    setSocket(socketRef.current);
    
    // Request access to user's camera and microphone
    navigator.mediaDevices.getUserMedia({ video: true, audio: true })
      .then(stream => {
        setStream(stream);
        if (userVideo.current) {
          userVideo.current.srcObject = stream;
        }
        
        // Join the room after getting the stream
        socketRef.current.emit('join-room', {
          roomId,
          userId: user.sub,
          userName: user.name,
          userPicture: user.picture
        });
        
        // Setup socket event listeners
        socketRef.current.on('user-connected', handleUserConnected);
        socketRef.current.on('user-disconnected', handleUserDisconnected);
        socketRef.current.on('room-users', handleRoomUsers);
        socketRef.current.on('chat-history', handleChatHistory);
        socketRef.current.on('new-message', handleNewMessage);
        socketRef.current.on('user-screen-share', handleUserScreenShare);
        socketRef.current.on('signal', handleSignal);
      })
      .catch(err => {
        console.error('Error accessing media devices:', err);
      });
      
    return () => {
      // Clean up
      if (socketRef.current) {
        socketRef.current.emit('leave-room', { roomId });
        socketRef.current.disconnect();
      }
      
      // Stop all tracks in the stream
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
      
      if (screenShareStream) {
        screenShareStream.getTracks().forEach(track => track.stop());
      }
      
      // Close all peer connections
      Object.values(peersRef.current).forEach(peer => {
        if (peer.peer) {
          peer.peer.destroy();
        }
      });
    };
  }, [roomId, user]);
  
  // Scroll to bottom of chat when new messages arrive
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [chatMessages]);
  
  // Handle when a new user connects to the room
  const handleUserConnected = ({ socketId, userId, userName, userPicture }) => {
    console.log(`User connected: ${userName}`);
    
    // Create a new peer connection
    const peer = createPeer(socketId, socketRef.current.id, stream);
    
    peersRef.current[socketId] = {
      peer,
      userId,
      userName,
      userPicture
    };
    
    setPeers(prevPeers => ({
      ...prevPeers,
      [socketId]: {
        peer,
        userId,
        userName,
        userPicture
      }
    }));
  };
  
  // Handle when a user disconnects from the room
  const handleUserDisconnected = (socketId) => {
    console.log(`User disconnected: ${socketId}`);
    
    if (peersRef.current[socketId]) {
      peersRef.current[socketId].peer.destroy();
      const peersCopy = { ...peersRef.current };
      delete peersCopy[socketId];
      peersRef.current = peersCopy;
      
      setPeers(prevPeers => {
        const newPeers = { ...prevPeers };
        delete newPeers[socketId];
        return newPeers;
      });
    }
  };
  
  // Handle receiving the list of users already in the room
  const handleRoomUsers = (users) => {
    console.log('Room users:', users);
    setParticipantsList(users);
    
    users.forEach(user => {
      if (user.socketId !== socketRef.current.id && !peersRef.current[user.socketId]) {
        const peer = createPeer(user.socketId, socketRef.current.id, stream);
        
        peersRef.current[user.socketId] = {
          peer,
          userId: user.userId,
          userName: user.userName,
          userPicture: user.userPicture
        };
        
        setPeers(prevPeers => ({
          ...prevPeers,
          [user.socketId]: {
            peer,
            userId: user.userId,
            userName: user.userName,
            userPicture: user.userPicture
          }
        }));
      }
    });
  };
  
  // Handle chat history
  const handleChatHistory = (messages) => {
    setChatMessages(messages);
  };
  
  // Handle new chat message
  const handleNewMessage = (message) => {
    setChatMessages(prevMessages => [...prevMessages, message]);
  };
  
  // Handle user screen share status change
  const handleUserScreenShare = ({ socketId, isSharing }) => {
    // Update UI to show which user is sharing their screen
    console.log(`User ${socketId} is ${isSharing ? 'sharing' : 'not sharing'} their screen`);
  };
  
  // Handle WebRTC signaling
  const handleSignal = ({ from, signal }) => {
    if (peersRef.current[from]) {
      peersRef.current[from].peer.signal(signal);
    } else {
      // If not already connected, create a new peer to receive the signal
      const peer = addPeer(from, signal, stream);
      
      // Since we don't know user details yet, we'll just use socketId for now
      peersRef.current[from] = {
        peer,
        userId: null,
        userName: `User (${from.substring(0, 6)})`,
        userPicture: null
      };
      
      setPeers(prevPeers => ({
        ...prevPeers,
        [from]: {
          peer,
          userId: null,
          userName: `User (${from.substring(0, 6)})`,
          userPicture: null
        }
      }));
    }
  };
  
  // Create a peer (initiator) to connect to another user
  const createPeer = (userToSignal, callerId, stream) => {
    const peer = new Peer({
      initiator: true,
      trickle: false,
      stream
    });
    
    peer.on('signal', signal => {
      socketRef.current.emit('signal', {
        to: userToSignal,
        from: callerId,
        signal
      });
    });
    
    peer.on('stream', remoteStream => {
      // Handle remote stream (will be updated in the rendered video elements)
      setPeers(prevPeers => {
        if (prevPeers[userToSignal]) {
          return {
            ...prevPeers,
            [userToSignal]: {
              ...prevPeers[userToSignal],
              stream: remoteStream
            }
          };
        }
        return prevPeers;
      });
    });
    
    return peer;
  };
  
  // Add a peer (non-initiator) when receiving a signal
  const addPeer = (callerId, incomingSignal, stream) => {
    const peer = new Peer({
      initiator: false,
      trickle: false,
      stream
    });
    
    peer.on('signal', signal => {
      socketRef.current.emit('signal', {
        to: callerId,
        from: socketRef.current.id,
        signal
      });
    });
    
    peer.on('stream', remoteStream => {
      // Handle remote stream
      setPeers(prevPeers => {
        if (prevPeers[callerId]) {
          return {
            ...prevPeers,
            [callerId]: {
              ...prevPeers[callerId],
              stream: remoteStream
            }
          };
        }
        return prevPeers;
      });
    });
    
    peer.signal(incomingSignal);
    
    return peer;
  };
  
  // Toggle screen sharing
  const toggleScreenShare = () => {
    if (isScreenSharing) {
      // Stop screen sharing
      screenShareStream.getTracks().forEach(track => track.stop());
      setScreenShareStream(null);
      
      // Replace all peer connections with camera stream
      Object.values(peersRef.current).forEach(peerObj => {
        stream.getTracks().forEach(track => {
          peerObj.peer.replaceTrack(
            peerObj.peer._senderMap.get(track.kind).track,
            track,
            stream
          );
        });
      });
      
      socketRef.current.emit('screen-share-status', {
        roomId,
        isSharing: false
      });
      
      setIsScreenSharing(false);
    } else {
      // Start screen sharing
      navigator.mediaDevices.getDisplayMedia({ cursor: true })
        .then(displayStream => {
          setScreenShareStream(displayStream);
          
          // Replace all video tracks with screen share
          Object.values(peersRef.current).forEach(peerObj => {
            // Replace just the video track
            const videoTrack = displayStream.getVideoTracks()[0];
            const videoSender = peerObj.peer._senderMap.get('video');
            
            if (videoSender) {
              videoSender.replaceTrack(videoTrack);
            }
          });
          
          // Listen for the user ending screen sharing
          displayStream.getVideoTracks()[0].onended = () => {
            toggleScreenShare();
          };
          
          socketRef.current.emit('screen-share-status', {
            roomId,
            isSharing: true
          });
          
          setIsScreenSharing(true);
        })
        .catch(err => {
          console.error('Error sharing screen:', err);
        });
    }
  };
  
  // Send a chat message
  const sendMessage = (e) => {
    e.preventDefault();
    
    if (messageInput.trim() === '') return;
    
    const message = {
      id: Date.now().toString(),
      sender: {
        id: user.sub,
        name: user.name,
        picture: user.picture
      },
      text: messageInput.trim(),
      timestamp: new Date().toISOString()
    };
    
    socketRef.current.emit('send-message', {
      roomId,
      message
    });
    
    setMessageInput('');
  };
  
  // Toggle mute
  const toggleMute = () => {
    if (stream) {
      const audioTrack = stream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setStream(prevStream => {
          // This triggers a re-render to update the mute button UI
          return new MediaStream([
            ...prevStream.getVideoTracks(),
            audioTrack
          ]);
        });
      }
    }
  };
  
  // Toggle video
  const toggleVideo = () => {
    if (stream) {
      const videoTrack = stream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setStream(prevStream => {
          // This triggers a re-render to update the video button UI
          return new MediaStream([
            videoTrack,
            ...prevStream.getAudioTracks()
          ]);
        });
      }
    }
  };
  
  // Check if audio is muted
  const isAudioMuted = () => {
    if (stream) {
      const audioTrack = stream.getAudioTracks()[0];
      return audioTrack && !audioTrack.enabled;
    }
    return false;
  };
  
  // Check if video is disabled
  const isVideoDisabled = () => {
    if (stream) {
      const videoTrack = stream.getVideoTracks()[0];
      return videoTrack && !videoTrack.enabled;
    }
    return false;
  };

  return (
    <div className="flex flex-col h-full">
      {/* Video Grid */}
      <div className="flex-1 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4 overflow-y-auto">
        {/* Current User's Video */}
        <div className="relative bg-gray-800 rounded-lg aspect-video">
          <video
            className="w-full h-full object-cover rounded-lg"
            muted
            ref={userVideo}
            autoPlay
            playsInline
          />
          <div className="absolute bottom-2 left-2 bg-black bg-opacity-50 text-white px-2 py-1 rounded">
            You ({user.name})
          </div>
        </div>
        
        {/* Peer Videos */}
        {Object.entries(peers).map(([socketId, peerData]) => (
          <div key={socketId} className="relative bg-gray-800 rounded-lg aspect-video">
            <Video peer={peerData.peer} />
            <div className="absolute bottom-2 left-2 bg-black bg-opacity-50 text-white px-2 py-1 rounded">
              {peerData.userName || `User (${socketId.substring(0, 6)})`}
            </div>
          </div>
        ))}
      </div>
      
      {/* Controls */}
      <div className="flex justify-center items-center gap-4 p-4 bg-gray-100 border-t">
        <button
          onClick={toggleMute}
          className={`p-3 rounded-full ${isAudioMuted() ? 'bg-red-500 text-white' : 'bg-gray-200'}`}
        >
          {isAudioMuted() ? 'Unmute' : 'Mute'}
        </button>
        
        <button
          onClick={toggleVideo}
          className={`p-3 rounded-full ${isVideoDisabled() ? 'bg-red-500 text-white' : 'bg-gray-200'}`}
        >
          {isVideoDisabled() ? 'Start Video' : 'Stop Video'}
        </button>
        
        <button
          onClick={toggleScreenShare}
          className={`p-3 rounded-full ${isScreenSharing ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
        >
          {isScreenSharing ? 'Stop Sharing' : 'Share Screen'}
        </button>
      </div>
      
      {/* Chat Panel (Can be made collapsible) */}
      <div className="fixed right-0 top-0 h-full w-80 bg-white border-l shadow-lg transform transition-transform duration-300">
        <div className="flex flex-col h-full">
          <div className="p-3 border-b font-medium">Chat</div>
          
          {/* Messages */}
          <div ref={chatContainerRef} className="flex-1 overflow-y-auto p-3 space-y-3">
            {chatMessages.map(message => (
              <div 
                key={message.id} 
                className={`flex ${message.sender.id === user.sub ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`max-w-xs rounded-lg px-3 py-2 ${
                  message.sender.id === user.sub 
                    ? 'bg-blue-500 text-white' 
                    : 'bg-gray-200'
                }`}>
                  <div className="text-xs mb-1">
                    {message.sender.id === user.sub ? 'You' : message.sender.name}
                  </div>
                  <div>{message.text}</div>
                </div>
              </div>
            ))}
          </div>
          
          {/* Message Input */}
          <form onSubmit={sendMessage} className="p-3 border-t">
            <div className="flex gap-2">
              <input
                type="text"
                value={messageInput}
                onChange={(e) => setMessageInput(e.target.value)}
                className="flex-1 border rounded px-3 py-2"
                placeholder="Type a message..."
              />
              <button 
                type="submit"
                className="bg-blue-500 text-white px-4 py-2 rounded"
              >
                Send
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

// Component to display a peer's video
const Video = ({ peer }) => {
  const ref = useRef();
  
  useEffect(() => {
    if (peer.stream) {
      ref.current.srcObject = peer.stream;
    } else {
      peer.on('stream', stream => {
        ref.current.srcObject = stream;
      });
    }
  }, [peer]);
  
  return (
    <video className="w-full h-full object-cover rounded-lg" ref={ref} autoPlay playsInline />
  );
};

export default VideoCall;