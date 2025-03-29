"use client"

import { useState, useEffect } from "react"
import axios from "axios"
import { useAuth0 } from "@auth0/auth0-react"
import { Link } from "react-router-dom"
import { Plus, Users, Calendar, ArrowRight, Loader2, LogIn, Video, UserPlus } from "lucide-react"

const Dashboard = () => {
  const [spaces, setSpaces] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const { user, isAuthenticated } = useAuth0()

  useEffect(() => {
    if (isAuthenticated && user) {
      const fetchUserSpaces = async () => {
        try {
          const response = await axios.get(`http://localhost:5000/api/spaces/user/${user.sub}`)

          // Ensure spaces is always an array
          if (Array.isArray(response.data)) {
            setSpaces(response.data)
          } else if (response.data && typeof response.data === "object") {
            // If response.data is an object but not an array, check if it has spaces property
            if (Array.isArray(response.data.spaces)) {
              setSpaces(response.data.spaces)
            } else {
              // If there's no spaces array property, create an empty array
              console.warn("API response did not contain a valid spaces array:", response.data)
              setSpaces([])
            }
          } else {
            // Default to empty array for any unexpected response
            console.warn("Unexpected API response format:", response.data)
            setSpaces([])
          }
        } catch (err) {
          console.error("Error fetching spaces:", err)
          setError("Failed to load your rooms")
          setSpaces([]) // Ensure spaces is an array even on error
        } finally {
          setLoading(false)
        }
      }

      fetchUserSpaces()
    }
  }, [user, isAuthenticated])

  if (!isAuthenticated) {
    return (
      <div className="max-w-3xl mx-auto mt-12 p-8 bg-gradient-to-br from-indigo-50 to-blue-50 rounded-xl shadow-sm border border-indigo-100">
        <div className="flex flex-col items-center text-center">
          <LogIn className="h-12 w-12 text-indigo-500 mb-4" />
          <h2 className="text-2xl font-bold text-gray-800 mb-3">Authentication Required</h2>
          <p className="text-gray-600 mb-6">Please login to access your meeting rooms and dashboard.</p>
          <button className="px-6 py-3 bg-indigo-600 text-white font-medium rounded-lg shadow-md hover:bg-indigo-700 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2">
            Sign In
          </button>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex flex-col justify-center items-center h-96">
        <Loader2 className="h-12 w-12 text-indigo-500 animate-spin mb-4" />
        <p className="text-gray-500 font-medium">Loading your meeting rooms...</p>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100">
        <div className="p-8 border-b bg-gradient-to-r from-indigo-500 to-purple-600 text-white">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold">Your Meeting Rooms</h1>
              <p className="mt-2 text-indigo-100">Manage and join your virtual meeting spaces</p>
            </div>
            {user && (
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                  {user.picture ? (
                    <img
                      src={user.picture || "/placeholder.svg"}
                      alt={user.name}
                      className="w-9 h-9 rounded-full object-cover"
                    />
                  ) : (
                    <span className="text-xl font-semibold">
                      {user.name?.charAt(0) || user.email?.charAt(0) || "?"}
                    </span>
                  )}
                </div>
                <div className="hidden md:block">
                  <p className="font-medium">{user.name}</p>
                  <p className="text-xs text-indigo-100">{user.email}</p>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="p-8">
          <div className="flex flex-wrap gap-4 mb-10">
            <Link
              to="/create-room"
              className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-3 rounded-lg font-medium transition-all shadow-md hover:shadow-lg"
            >
              <Plus className="h-5 w-5" />
              <span>Create New Room</span>
            </Link>
            <Link
              to="/join-room"
              className="flex items-center gap-2 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white px-5 py-3 rounded-lg font-medium transition-all shadow-md hover:shadow-lg"
            >
              <UserPlus className="h-5 w-5" />
              <span>Join a Room</span>
            </Link>
          </div>

          {error && (
            <div className="bg-red-50 border-l-4 border-red-500 text-red-700 p-5 rounded-lg mb-8 flex items-start">
              <div className="flex-shrink-0 mr-3">
                <svg className="h-5 w-5 text-red-500" viewBox="0 0 20 20" fill="currentColor">
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div>
                <p className="font-medium">{error}</p>
                <p className="text-sm mt-1">Please try refreshing the page or contact support if the issue persists.</p>
              </div>
            </div>
          )}

          {spaces.length === 0 ? (
            <div className="text-center p-12 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-indigo-100 rounded-full mb-4">
                <Video className="h-8 w-8 text-indigo-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-800 mb-2">No meeting rooms yet</h3>
              <p className="text-gray-500 max-w-md mx-auto mb-6">
                You haven't created or joined any meeting rooms. Create your first room to get started!
              </p>
              <Link
                to="/create-room"
                className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-lg font-medium transition-all"
              >
                <Plus className="h-5 w-5" />
                <span>Create Your First Room</span>
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {spaces.map((space) => (
                <Link
                  key={space.id}
                  to={`/room/${space.id}`}
                  className="group bg-white border border-gray-200 rounded-xl overflow-hidden hover:shadow-lg transition-all duration-300 flex flex-col h-full transform hover:-translate-y-1"
                >
                  <div className="h-36 bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center relative overflow-hidden">
                    <div className="absolute inset-0 bg-black opacity-0 group-hover:opacity-10 transition-opacity"></div>
                    <span className="text-5xl font-bold text-white">{space.name.charAt(0).toUpperCase()}</span>
                  </div>
                  <div className="p-5 flex-grow flex flex-col">
                    <h3 className="font-bold text-xl text-gray-800 mb-2 group-hover:text-indigo-600 transition-colors">
                      {space.name}
                    </h3>
                    <div className="flex items-center text-gray-500 text-sm mb-3">
                      <Calendar className="h-4 w-4 mr-1.5" />
                      <span>
                        Created{" "}
                        {new Date(space.createdAt).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </span>
                    </div>
                    <div className="flex items-center text-gray-500 text-sm mt-auto">
                      <Users className="h-4 w-4 mr-1.5" />
                      <span>{space.members ? space.members.length : 0} members</span>
                    </div>
                  </div>
                  <div className="px-5 py-3 bg-gray-50 border-t border-gray-100 flex justify-between items-center">
                    <span className="text-sm font-medium text-gray-600">Join meeting</span>
                    <span className="h-8 w-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                      <ArrowRight className="h-4 w-4" />
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default Dashboard

