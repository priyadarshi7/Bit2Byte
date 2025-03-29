import React, { useContext, useState, useEffect } from 'react';
import ThemeContext from '../../context/ThemeContext';
import { useAuth0 } from '@auth0/auth0-react';
import { syncUserWithBackend } from '../../services/userService';

function Navbar() {
  const { darkMode, toggleTheme } = useContext(ThemeContext);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [backendUser, setBackendUser] = useState(null);

  const { user, isAuthenticated, loginWithRedirect, isLoading } = useAuth0();

  // Sync user with backend whenever auth status changes
  useEffect(() => {
    const syncUser = async () => {
      if (isAuthenticated && user && !isLoading) {
        try {
          // Sync user with backend
          const syncedUser = await syncUserWithBackend(user);
          setBackendUser(syncedUser);
          console.log('User synced with backend:', syncedUser);
        } catch (error) {
          console.error('Error syncing user with backend:', error);
        }
      }
    };

    syncUser();
  }, [isAuthenticated, user, isLoading]);

  return (
    <nav className="sticky top-0 z-50 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <div className="flex-shrink-0 flex items-center">
              <svg className="h-8 w-8 text-blue-600 dark:text-blue-500" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M12 8V16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M8 12H16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <span className="ml-2 text-xl font-bold text-gray-900 dark:text-white">MeetSync</span>
            </div>
            <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
              <a href="#" className="border-blue-500 text-gray-900 dark:text-white inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium">
                Home
              </a>
              <a href="#" className="border-transparent text-gray-500 dark:text-gray-300 hover:text-gray-700 dark:hover:text-white inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium">
                Meetingplace
              </a>
              <a href="#" className="border-transparent text-gray-500 dark:text-gray-300 hover:text-gray-700 dark:hover:text-white inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium">
                Playground
              </a>
              <a href="#" className="border-transparent text-gray-500 dark:text-gray-300 hover:text-gray-700 dark:hover:text-white inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium">
                Projects Summarizer
              </a>
            </div>
          </div>
          <div className="flex items-center">
            <button
              onClick={toggleTheme}
              className="p-2 rounded-full text-gray-500 dark:text-gray-300 hover:text-gray-700 dark:hover:text-white focus:outline-none"
            >
              {darkMode ? (
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              ) : (
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                </svg>
              )}
            </button>
            <div className="hidden sm:ml-6 sm:flex sm:items-center">
              {isLoading ? (
                <div className="animate-pulse h-10 w-10 bg-gray-200 rounded-full"></div>
              ) : isAuthenticated ? (
                <div className="flex items-center">
                  <img 
                    src={user.picture} 
                    alt={user.name}
                    className="h-10 w-10 rounded-full"
                  />
                  <span className="ml-2 text-sm font-medium text-gray-900 dark:text-white">
                    {backendUser ? backendUser.name : user.name}
                  </span>
                </div>
              ) : (
                <button 
                  onClick={loginWithRedirect} 
                  className="ml-4 px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-300"
                >
                  Sign In
                </button>
              )}
            </div>
            <div className="flex items-center sm:hidden">
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="inline-flex items-center justify-center p-2 rounded-md text-gray-500 dark:text-gray-300 hover:text-gray-700 dark:hover:text-white focus:outline-none"
              >
                <svg className={`${mobileMenuOpen ? 'hidden' : 'block'} h-6 w-6`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
                <svg className={`${mobileMenuOpen ? 'block' : 'hidden'} h-6 w-6`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className={`${mobileMenuOpen ? 'block' : 'hidden'} sm:hidden`}>
        <div className="pt-2 pb-3 space-y-1">
          <a href="#" className="bg-blue-50 dark:bg-gray-800 border-l-4 border-blue-500 text-blue-700 dark:text-white block pl-3 pr-4 py-2 text-base font-medium">
            Home
          </a>
          <a href="#" className="border-transparent text-gray-500 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 hover:border-gray-300 dark:hover:border-gray-700 block pl-3 pr-4 py-2 border-l-4 text-base font-medium">
            Meetingplace
          </a>
          <a href="#" className="border-transparent text-gray-500 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 hover:border-gray-300 dark:hover:border-gray-700 block pl-3 pr-4 py-2 border-l-4 text-base font-medium">
            Playground
          </a>
          <a href="#" className="border-transparent text-gray-500 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 hover:border-gray-300 dark:hover:border-gray-700 block pl-3 pr-4 py-2 border-l-4 text-base font-medium">
            Project Summarizer
          </a>
        </div>
        <div className="pt-4 pb-3 border-t border-gray-200 dark:border-gray-800">
          <div className="flex items-center px-4">
            <div className="flex-shrink-0">
              {isLoading ? (
                <div className="animate-pulse h-10 w-24 bg-gray-200 rounded-md"></div>
              ) : !isAuthenticated ? (
                <button 
                  onClick={loginWithRedirect}
                  className="w-full px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-300"
                >
                  Sign In
                </button>
              ) : (
                <div className="flex items-center">
                  <img 
                    src={user.picture} 
                    alt={user.name}
                    className="h-10 w-10 rounded-full"
                  />
                  <span className="ml-2 text-sm font-medium text-gray-900 dark:text-white">
                    {backendUser ? backendUser.name : user.name}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}

export default Navbar;

// import React from 'react';
// import { Link } from 'react-router-dom';
// import { useAuth } from '../../context/AuthContext';

// const Navbar = () => {
//   const { isAuthenticated, user, loginWithRedirect, logout } = useAuth();

//   return (
//     <nav className="bg-white shadow-md">
//       <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
//         <div className="flex justify-between h-16">
//           <div className="flex items-center">
//             <Link to="/" className="text-xl font-bold text-blue-600">
//               Meeting Rooms
//             </Link>
//           </div>
          
//           <div className="flex items-center">
//             {isAuthenticated ? (
//               <div className="flex items-center space-x-4">
//                 <div className="flex items-center space-x-2">
//                   {user?.picture ? (
//                     <img 
//                       src={user.picture} 
//                       alt="Profile"
//                       className="h-8 w-8 rounded-full" 
//                     />
//                   ) : (
//                     <div className="h-8 w-8 rounded-full bg-blue-500 flex items-center justify-center">
//                       <span className="text-white font-medium">
//                         {user?.name?.charAt(0) || 'U'}
//                       </span>
//                     </div>
//                   )}
//                   <span className="text-gray-700">{user?.name}</span>
//                 </div>
                
//                 <button 
//                   onClick={() => logout()}
//                   className="text-gray-600 hover:text-gray-900"
//                 >
//                   Logout
//                 </button>
//               </div>
//             ) : (
//               <button 
//                 onClick={() => loginWithRedirect()}
//                 className="bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700"
//               >
//                 Login
//               </button>
//             )}
//           </div>
//         </div>
//       </div>
//     </nav>
//   );
// };

// export default Navbar;