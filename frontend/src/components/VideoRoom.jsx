import { useState, useEffect, useRef } from "react"
import axios from "axios"
import { useParams, Link } from "react-router-dom"
import { useAuth0 } from "@auth0/auth0-react"
import {
  Mic,
  MicOff,
  Video,
  VideoOff,
  Users,
  MessageSquare,
  X,
  Send,
  ChevronLeft,
  MoreVertical,
  Copy,
  Loader2,
  PhoneOff,
  ScreenShare,
  UserPlus,
  Settings,
} from "lucide-react"

// Mock WebRTC implementation - in a real app, you'd use a proper WebRTC library
const useMockVideoChat = (roomId) => {
  const [localStream, setLocalStream] = useState(null)
  const [remoteStreams, setRemoteStreams] = useState([])
  const [isMicOn, setIsMicOn] = useState(true)
  const [isVideoOn, setIsVideoOn] = useState(true)
  const [isScreenSharing, setIsScreenSharing] = useState(false)

  // Simulate getting local stream on component mount
  useEffect(() => {
    const getMedia = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true })
        setLocalStream(stream)
      } catch (err) {
        console.error("Error accessing media devices:", err)
      }
    }

    getMedia()

    // Cleanup function
    return () => {
      if (localStream) {
        localStream.getTracks().forEach((track) => track.stop())
      }
    }
  }, [])

  // Mock remote participants (in a real app, these would come from WebRTC connections)
  useEffect(() => {
    // Simulate 2-3 remote participants joining after a delay
    const timer = setTimeout(() => {
      // In a real implementation, these would be actual MediaStreams from peers
      setRemoteStreams([
        { id: "user1", name: "Alex Johnson", stream: null },
        { id: "user2", name: "Taylor Smith", stream: null },
      ])
    }, 2000)

    return () => clearTimeout(timer)
  }, [roomId])

  const toggleMic = () => {
    if (localStream) {
      localStream.getAudioTracks().forEach((track) => {
        track.enabled = !track.enabled
      })
      setIsMicOn(!isMicOn)
    }
  }

  const toggleVideo = () => {
    if (localStream) {
      localStream.getVideoTracks().forEach((track) => {
        track.enabled = !track.enabled
      })
      setIsVideoOn(!isVideoOn)
    }
  }

  const toggleScreenShare = async () => {
    if (isScreenSharing) {
      // Stop screen sharing and revert to camera
      if (localStream) {
        localStream.getTracks().forEach((track) => track.stop())
      }

      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true })
        setLocalStream(stream)
        setIsScreenSharing(false)
      } catch (err) {
        console.error("Error accessing media devices:", err)
      }
    } else {
      // Start screen sharing
      try {
        const stream = await navigator.mediaDevices.getDisplayMedia({ video: true })
        setLocalStream(stream)
        setIsScreenSharing(true)

        // When user stops screen sharing via browser UI
        stream.getVideoTracks()[0].onended = async () => {
          const newStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true })
          setLocalStream(newStream)
          setIsScreenSharing(false)
        }
      } catch (err) {
        console.error("Error sharing screen:", err)
      }
    }
  }

  return {
    localStream,
    remoteStreams,
    isMicOn,
    isVideoOn,
    isScreenSharing,
    toggleMic,
    toggleVideo,
    toggleScreenShare,
  }
}

// Mock chat implementation
const useMockChat = (roomId) => {
  const [messages, setMessages] = useState([])
  const [newMessage, setNewMessage] = useState("")

  // Simulate initial messages
  useEffect(() => {
    setMessages([
      {
        id: 1,
        sender: { name: "System", userId: "system" },
        text: "Welcome to the room!",
        timestamp: new Date(Date.now() - 3600000),
      },
      {
        id: 2,
        sender: { name: "Alex Johnson", userId: "user1" },
        text: "Hi everyone!",
        timestamp: new Date(Date.now() - 1800000),
      },
      {
        id: 3,
        sender: { name: "Taylor Smith", userId: "user2" },
        text: "Hello! Excited to be here.",
        timestamp: new Date(Date.now() - 900000),
      },
    ])
  }, [roomId])

  const sendMessage = (text, user) => {
    if (!text.trim()) return

    const newMsg = {
      id: Date.now(),
      sender: { name: user.name, userId: user.sub },
      text,
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, newMsg])
    setNewMessage("")
  }

  return {
    messages,
    newMessage,
    setNewMessage,
    sendMessage,
  }
}

const VideoParticipant = ({ stream, name, isLocal = false, isVideoOn = true }) => {
  const videoRef = useRef(null)

  useEffect(() => {
    if (stream && videoRef.current) {
      videoRef.current.srcObject = stream
    }
  }, [stream])

  return (
    <div className="relative rounded-xl overflow-hidden bg-gray-800 aspect-video">
      {stream && isVideoOn ? (
        <video ref={videoRef} autoPlay playsInline muted={isLocal} className="w-full h-full object-cover" />
      ) : (
        <div className="w-full h-full flex items-center justify-center bg-indigo-900">
          <div className="h-20 w-20 rounded-full bg-indigo-700 flex items-center justify-center text-white text-3xl font-semibold">
            {name ? name.charAt(0).toUpperCase() : "?"}
          </div>
        </div>
      )}
      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-3">
        <div className="flex items-center justify-between">
          <span className="text-white font-medium text-sm">
            {name} {isLocal && "(You)"}
          </span>
          {isLocal && !isVideoOn && (
            <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">Video Off</span>
          )}
        </div>
      </div>
    </div>
  )
}

const VideoRoom = () => {
  const [space, setSpace] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [activeTab, setActiveTab] = useState("video") // 'video', 'chat', 'people'
  const [isCopied, setIsCopied] = useState(false)
  const { id } = useParams()
  const { user } = useAuth0()

  // Video chat hooks
  const { localStream, remoteStreams, isMicOn, isVideoOn, isScreenSharing, toggleMic, toggleVideo, toggleScreenShare } =
    useMockVideoChat(id)

  // Chat hooks
  const { messages, newMessage, setNewMessage, sendMessage } = useMockChat(id)

  // Refs
  const chatContainerRef = useRef(null)

  useEffect(() => {
    const fetchSpace = async () => {
      try {
        const response = await axios.get(`http://localhost:5000/api/spaces/${id}`)
        setSpace(response.data)
      } catch (err) {
        console.error("Error fetching space:", err)
        setError("Failed to load room data")
      } finally {
        setLoading(false)
      }
    }

    fetchSpace()
  }, [id])

  // Auto-scroll chat to bottom when new messages arrive
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight
    }
  }, [messages])

  const copyAccessCode = () => {
    if (space?.accessCode) {
      navigator.clipboard.writeText(space.accessCode)
      setIsCopied(true)
      setTimeout(() => setIsCopied(false), 2000)
    }
  }

  const handleSendMessage = (e) => {
    e.preventDefault()
    if (user && newMessage.trim()) {
      sendMessage(newMessage, user)
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col justify-center items-center h-screen bg-gray-50">
        <Loader2 className="h-12 w-12 text-indigo-600 animate-spin mb-4" />
        <p className="text-gray-600 font-medium">Loading room...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="max-w-3xl mx-auto mt-12 p-8 bg-red-50 border border-red-200 text-red-700 rounded-xl shadow-sm">
        <div className="flex items-start">
          <div className="flex-shrink-0 mr-3">
            <svg className="h-6 w-6 text-red-500" viewBox="0 0 20 20" fill="currentColor">
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                clipRule="evenodd"
              />
            </svg>
          </div>
          <div>
            <h2 className="text-xl font-bold mb-2">Error Loading Room</h2>
            <p className="mb-2">{error}</p>
            <Link to="/dashboard" className="inline-flex items-center text-red-700 hover:text-red-800 font-medium">
              <ChevronLeft className="h-4 w-4 mr-1" />
              Return to Dashboard
            </Link>
          </div>
        </div>
      </div>
    )
  }

  if (!space) {
    return (
      <div className="max-w-3xl mx-auto mt-12 p-8 bg-yellow-50 border border-yellow-200 text-yellow-800 rounded-xl shadow-sm">
        <h2 className="text-xl font-bold mb-3">Room Not Found</h2>
        <p className="mb-4">The room you're looking for doesn't exist or you don't have access.</p>
        <Link
          to="/dashboard"
          className="inline-flex items-center px-4 py-2 bg-yellow-100 hover:bg-yellow-200 text-yellow-800 rounded-lg transition-colors"
        >
          <ChevronLeft className="h-4 w-4 mr-2" />
          Back to Dashboard
        </Link>
      </div>
    )
  }

  const isCurrentUserMember = space.members.some((member) => member.userId === user.sub)

  if (!isCurrentUserMember) {
    return (
      <div className="max-w-3xl mx-auto mt-12 p-8 bg-yellow-50 border border-yellow-200 text-yellow-800 rounded-xl shadow-sm">
        <h2 className="text-xl font-bold mb-3">Access Denied</h2>
        <p className="mb-4">You are not a member of this room. Please request access from the room owner.</p>
        <Link
          to="/dashboard"
          className="inline-flex items-center px-4 py-2 bg-yellow-100 hover:bg-yellow-200 text-yellow-800 rounded-lg transition-colors"
        >
          <ChevronLeft className="h-4 w-4 mr-2" />
          Back to Dashboard
        </Link>
      </div>
    )
  }

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between shadow-sm">
        <div className="flex items-center">
          <Link
            to="/dashboard"
            className="mr-4 p-2 rounded-full hover:bg-gray-100 transition-colors"
            title="Back to Dashboard"
          >
            <ChevronLeft className="h-5 w-5 text-gray-600" />
          </Link>
          <h1 className="text-xl font-bold text-gray-800">{space.name}</h1>
        </div>

        <div className="flex items-center space-x-2">
          <div
            className="flex items-center bg-indigo-50 text-indigo-700 px-3 py-1.5 rounded-lg cursor-pointer hover:bg-indigo-100 transition-colors"
            onClick={copyAccessCode}
          >
            <span className="text-sm font-medium mr-2">
              {isCopied ? "Copied!" : `Access Code: ${space.accessCode}`}
            </span>
            <Copy className="h-4 w-4" />
          </div>

          <button className="p-2 rounded-full hover:bg-gray-100 transition-colors">
            <MoreVertical className="h-5 w-5 text-gray-600" />
          </button>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Main Video/Chat Area */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Video Grid */}
          {activeTab === "video" && (
            <div className="flex-1 p-4 overflow-y-auto bg-gray-100">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 max-w-6xl mx-auto">
                {/* Local Video (You) */}
                <div className={`${remoteStreams.length <= 1 ? "lg:col-span-2" : ""}`}>
                  <VideoParticipant
                    stream={localStream}
                    name={user?.name || "You"}
                    isLocal={true}
                    isVideoOn={isVideoOn}
                  />
                </div>

                {/* Remote Participants */}
                {remoteStreams.map((participant) => (
                  <VideoParticipant key={participant.id} stream={participant.stream} name={participant.name} />
                ))}
              </div>
            </div>
          )}

          {/* Chat Messages */}
          {activeTab === "chat" && (
            <div className="flex-1 flex flex-col bg-white">
              <div ref={chatContainerRef} className="flex-1 p-4 overflow-y-auto">
                <div className="max-w-3xl mx-auto space-y-4">
                  {messages.map((message) => {
                    const isCurrentUser = message.sender.userId === user?.sub

                    return (
                      <div key={message.id} className={`flex ${isCurrentUser ? "justify-end" : "justify-start"}`}>
                        <div
                          className={`max-w-[80%] rounded-2xl px-4 py-2 ${
                            isCurrentUser
                              ? "bg-indigo-600 text-white rounded-tr-none"
                              : message.sender.userId === "system"
                                ? "bg-gray-200 text-gray-800"
                                : "bg-gray-100 text-gray-800 rounded-tl-none"
                          }`}
                        >
                          {!isCurrentUser && message.sender.userId !== "system" && (
                            <div className="font-medium text-xs mb-1 text-gray-600">{message.sender.name}</div>
                          )}
                          <p>{message.text}</p>
                          <div className={`text-xs mt-1 ${isCurrentUser ? "text-indigo-200" : "text-gray-500"}`}>
                            {message.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Message Input */}
              <div className="border-t border-gray-200 p-4 bg-white">
                <form onSubmit={handleSendMessage} className="max-w-3xl mx-auto">
                  <div className="flex items-center space-x-2">
                    <input
                      type="text"
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      placeholder="Type a message..."
                      className="flex-1 border border-gray-300 rounded-full px-4 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    />
                    <button
                      type="submit"
                      disabled={!newMessage.trim()}
                      className="bg-indigo-600 text-white rounded-full p-2 hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Send className="h-5 w-5" />
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* People/Members List */}
          {activeTab === "people" && (
            <div className="flex-1 p-6 overflow-y-auto bg-white">
              <div className="max-w-3xl mx-auto">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-bold text-gray-800">Room Members ({space.members.length})</h2>
                  <button className="flex items-center text-sm font-medium text-indigo-600 hover:text-indigo-800 transition-colors">
                    <UserPlus className="h-4 w-4 mr-1" />
                    Invite
                  </button>
                </div>

                <div className="space-y-3">
                  {space.members.map((member) => (
                    <div
                      key={member.userId}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors"
                    >
                      <div className="flex items-center space-x-3">
                        <div className="h-10 w-10 rounded-full overflow-hidden bg-indigo-100 flex items-center justify-center">
                          {member.picture ? (
                            <img
                              src={member.picture || "/placeholder.svg"}
                              alt={member.name}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <span className="text-lg font-semibold text-indigo-600">
                              {member.name.charAt(0).toUpperCase()}
                            </span>
                          )}
                        </div>
                        <div>
                          <div className="font-medium">
                            {member.name}
                            {member.userId === space.author && (
                              <span className="ml-2 text-xs bg-indigo-100 text-indigo-800 px-2 py-0.5 rounded-full">
                                Host
                              </span>
                            )}
                            {member.userId === user.sub && (
                              <span className="ml-2 text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded-full">
                                You
                              </span>
                            )}
                          </div>
                          <div className="text-sm text-gray-500">Points: {member.points}</div>
                        </div>
                      </div>

                      {space.author === user.sub && member.userId !== user.sub && (
                        <button className="text-gray-400 hover:text-red-500 transition-colors">
                          <X className="h-5 w-5" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>

                <div className="mt-8 p-4 bg-gray-50 rounded-xl border border-gray-200">
                  <h3 className="font-semibold mb-3">Room Details</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <div className="text-gray-500">Created By</div>
                      <div className="font-medium">
                        {space.members.find((member) => member.userId === space.author)?.name || "Unknown"}
                      </div>
                    </div>
                    <div>
                      <div className="text-gray-500">Created On</div>
                      <div className="font-medium">
                        {new Date(space.createdAt).toLocaleDateString(undefined, {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Bottom Controls */}
      <div className="bg-gray-900 text-white py-4 px-6">
        <div className="max-w-6xl mx-auto flex flex-wrap items-center justify-between">
          <div className="flex items-center space-x-2 sm:space-x-4">
            <button
              onClick={toggleMic}
              className={`p-3 rounded-full ${isMicOn ? "bg-gray-700 hover:bg-gray-600" : "bg-red-500 hover:bg-red-600"} transition-colors`}
              title={isMicOn ? "Mute microphone" : "Unmute microphone"}
            >
              {isMicOn ? <Mic className="h-5 w-5" /> : <MicOff className="h-5 w-5" />}
            </button>

            <button
              onClick={toggleVideo}
              className={`p-3 rounded-full ${isVideoOn ? "bg-gray-700 hover:bg-gray-600" : "bg-red-500 hover:bg-red-600"} transition-colors`}
              title={isVideoOn ? "Turn off camera" : "Turn on camera"}
            >
              {isVideoOn ? <Video className="h-5 w-5" /> : <VideoOff className="h-5 w-5" />}
            </button>

            <button
              onClick={toggleScreenShare}
              className={`p-3 rounded-full ${isScreenSharing ? "bg-indigo-600 hover:bg-indigo-700" : "bg-gray-700 hover:bg-gray-600"} transition-colors`}
              title={isScreenSharing ? "Stop sharing screen" : "Share screen"}
            >
              <ScreenShare className="h-5 w-5" />
            </button>
          </div>

          <div className="flex mt-4 sm:mt-0">
            <Link
              to="/dashboard"
              className="flex items-center justify-center bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg transition-colors"
            >
              <PhoneOff className="h-5 w-5 mr-2" />
              <span>Leave Room</span>
            </Link>
          </div>

          <div className="flex items-center space-x-1 mt-4 sm:mt-0">
            <button
              onClick={() => setActiveTab("video")}
              className={`p-2 rounded-lg ${activeTab === "video" ? "bg-gray-700" : "hover:bg-gray-800"} transition-colors`}
              title="Video view"
            >
              <Video className="h-5 w-5" />
            </button>

            <button
              onClick={() => setActiveTab("chat")}
              className={`p-2 rounded-lg ${activeTab === "chat" ? "bg-gray-700" : "hover:bg-gray-800"} transition-colors`}
              title="Chat"
            >
              <MessageSquare className="h-5 w-5" />
            </button>

            <button
              onClick={() => setActiveTab("people")}
              className={`p-2 rounded-lg ${activeTab === "people" ? "bg-gray-700" : "hover:bg-gray-800"} transition-colors`}
              title="People"
            >
              <Users className="h-5 w-5" />
            </button>

            <button className="p-2 rounded-lg hover:bg-gray-800 transition-colors" title="Settings">
              <Settings className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default VideoRoom

