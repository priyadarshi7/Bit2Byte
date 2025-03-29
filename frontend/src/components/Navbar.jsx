// components/Navbar.jsx
import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth0 } from '@auth0/auth0-react';

const Navbar = () => {
  const { user, isAuthenticated, loginWithRedirect, logout } = useAuth0();

  return (
    <nav className="bg-blue-600 text-white shadow-md">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center py-4">
          <Link to="/" className="text-xl font-bold">Meeting Rooms</Link>
          
          <div className="flex items-center space-x-4">
            {isAuthenticated ? (
              <>
                <div className="flex items-center">
                  <img 
                    src={user.picture} 
                    alt={user.name} 
                    className="h-8 w-8 rounded-full mr-2"
                  />
                  <span className="hidden md:inline">{user.name}</span>
                </div>
                
                <button 
                  onClick={() => logout({ returnTo: window.location.origin })}
                  className="bg-blue-700 hover:bg-blue-800 px-3 py-1 rounded-md text-sm"
                >
                  Logout
                </button>
              </>
            ) : (
              <button 
                onClick={() => loginWithRedirect()}
                className="bg-blue-700 hover:bg-blue-800 px-3 py-1 rounded-md"
              >
                Login
              </button>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;