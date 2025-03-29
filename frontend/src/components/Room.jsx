import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { NavLink, useParams } from 'react-router-dom';
import { useAuth0 } from '@auth0/auth0-react';

const Room = () => {
  const [space, setSpace] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { id } = useParams();
  const { user } = useAuth0();
  
  // Virtual drawer states
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [files, setFiles] = useState([]);
  const [folders, setFolders] = useState([]);
  const [currentFolder, setCurrentFolder] = useState(null);
  const [newItemName, setNewItemName] = useState('');
  const [isCreatingFile, setIsCreatingFile] = useState(false);
  const [isCreatingFolder, setIsCreatingFolder] = useState(false);

  useEffect(() => {
    const fetchSpace = async () => {
      try {
        const response = await axios.get(`http://localhost:5000/api/spaces/${id}`);
        setSpace(response.data);
        
        // Initialize files and folders or fetch them from API
        // This is just placeholder logic - you would fetch these from your backend
        try {
          const filesResponse = await axios.get(`http://localhost:5000/api/spaces/${id}/files`);
          setFiles(filesResponse.data.files || []);
          setFolders(filesResponse.data.folders || []);
        } catch (err) {
          console.error('Error fetching files and folders:', err);
          // Initialize with empty arrays if fetch fails
          setFiles([]);
          setFolders([]);
        }
      } catch (err) {
        console.error('Error fetching space:', err);
        setError('Failed to load room data');
      } finally {
        setLoading(false);
      }
    };

    fetchSpace();
  }, [id]);

  const toggleDrawer = () => {
    setIsDrawerOpen(!isDrawerOpen);
  };

  const navigateToFolder = (folderId) => {
    setCurrentFolder(folderId);
  };

  const navigateUp = () => {
    if (currentFolder) {
      const parentFolder = folders.find(f => f.id === currentFolder)?.parentId || null;
      setCurrentFolder(parentFolder);
    }
  };

  const startCreatingFile = () => {
    setIsCreatingFile(true);
    setIsCreatingFolder(false);
    setNewItemName('');
  };

  const startCreatingFolder = () => {
    setIsCreatingFolder(true);
    setIsCreatingFile(false);
    setNewItemName('');
  };

  const cancelCreating = () => {
    setIsCreatingFile(false);
    setIsCreatingFolder(false);
    setNewItemName('');
  };

  const createNewItem = async () => {
    if (!newItemName.trim()) return;

    try {
      if (isCreatingFile) {
        // Create new file
        const newFile = {
          id: Date.now().toString(), // temporary ID, your API should provide a real one
          name: newItemName,
          folderId: currentFolder,
          type: 'file',
          createdAt: new Date().toISOString(),
          createdBy: user.sub
        };
        
        // API call to save the file
        await axios.post(`http://localhost:5000/api/spaces/${id}/files`, newFile);
        setFiles([...files, newFile]);
      } 
      else if (isCreatingFolder) {
        // Create new folder
        const newFolder = {
          id: Date.now().toString(), // temporary ID, your API should provide a real one
          name: newItemName,
          parentId: currentFolder,
          createdAt: new Date().toISOString(),
          createdBy: user.sub
        };
        
        // API call to save the folder
        await axios.post(`http://localhost:5000/api/spaces/${id}/folders`, newFolder);
        setFolders([...folders, newFolder]);
      }
      
      // Reset states after creation
      setNewItemName('');
      setIsCreatingFile(false);
      setIsCreatingFolder(false);
    } catch (err) {
      console.error('Error creating item:', err);
    }
  };

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);
    formData.append('folderId', currentFolder);
    formData.append('userId', user.sub);

    try {
      const response = await axios.post(`http://localhost:5000/api/spaces/${id}/upload`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      
      setFiles([...files, response.data]);
    } catch (err) {
      console.error('Error uploading file:', err);
    }
  };

  const deleteItem = async (itemId, isFolder) => {
    try {
      if (isFolder) {
        await axios.delete(`http://localhost:5000/api/spaces/${id}/folders/${itemId}`);
        setFolders(folders.filter(folder => folder.id !== itemId));
      } else {
        await axios.delete(`http://localhost:5000/api/spaces/${id}/files/${itemId}`);
        setFiles(files.filter(file => file.id !== itemId));
      }
    } catch (err) {
      console.error('Error deleting item:', err);
    }
  };

  // Get current folder's files and subfolders
  const currentFiles = files.filter(file => file.folderId === currentFolder);
  const currentSubfolders = folders.filter(folder => folder.parentId === currentFolder);
  const currentFolderName = currentFolder 
    ? folders.find(f => f.id === currentFolder)?.name 
    : 'Root';

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-3xl mx-auto mt-8 p-4 bg-red-100 text-red-700 rounded-lg">
        <h2 className="text-xl font-bold mb-2">Error</h2>
        <p>{error}</p>
      </div>
    );
  }

  if (!space) {
    return (
      <div className="max-w-3xl mx-auto mt-8 p-4 bg-yellow-100 text-yellow-700 rounded-lg">
        <h2 className="text-xl font-bold mb-2">Room Not Found</h2>
        <p>The room you're looking for doesn't exist or you don't have access.</p>
      </div>
    );
  }

  const isCurrentUserMember = space.members.some(member => member.userId === user.sub);

  if (!isCurrentUserMember) {
    return (
      <div className="max-w-3xl mx-auto mt-8 p-4 bg-yellow-100 text-yellow-700 rounded-lg">
        <h2 className="text-xl font-bold mb-2">Access Denied</h2>
        <p>You are not a member of this room.</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-4">
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="p-6 border-b">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold">{space.name}</h1>
            <div className="bg-gray-100 text-gray-800 font-semibold py-1 px-3 rounded-md">
              Access Code: {space.accessCode}
            </div>
          </div>
        </div>
        <div className="p-6 flex flex-wrap gap-3">
            <NavLink to="http://localhost:5173/video">
          <button 
            style={{backgroundColor:"black", color:"white", borderRadius:"8px", padding:"10px"}}
          >
            Video Chat
          </button></NavLink>
          <button 
            onClick={toggleDrawer}
            className="bg-blue-600 text-white rounded-md px-4 py-2"
          >
            {isDrawerOpen ? 'Close Files' : 'Open Files'}
          </button>
        </div>
        
        {/* Virtual Drawer */}
        {isDrawerOpen && (
          <div className="border-t p-6">
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">Files & Folders</h2>
                <div className="flex gap-2">
                  <input
                    type="file"
                    id="fileUpload"
                    className="hidden"
                    onChange={handleFileUpload}
                  />
                  <label 
                    htmlFor="fileUpload" 
                    className="bg-green-600 text-white rounded-md px-3 py-1 cursor-pointer text-sm"
                  >
                    Upload File
                  </label>
                  <button
                    onClick={startCreatingFile}
                    className="bg-blue-600 text-white rounded-md px-3 py-1 text-sm"
                  >
                    New File
                  </button>
                  <button
                    onClick={startCreatingFolder}
                    className="bg-purple-600 text-white rounded-md px-3 py-1 text-sm"
                  >
                    New Folder
                  </button>
                </div>
              </div>
              
              {/* Path navigation */}
              <div className="flex items-center gap-2 mb-4 p-2 bg-gray-100 rounded">
                <button
                  onClick={() => setCurrentFolder(null)}
                  className={`px-2 py-1 ${!currentFolder ? 'font-bold' : 'text-blue-600 hover:underline'}`}
                >
                  Root
                </button>
                
                {currentFolder && (
                  <>
                    <span>/</span>
                    <button 
                      className="font-bold"
                      onClick={navigateUp}
                    >
                      {currentFolderName}
                    </button>
                    <button
                      onClick={navigateUp}
                      className="ml-auto text-blue-600 text-sm"
                    >
                      ↑ Up
                    </button>
                  </>
                )}
              </div>

              {/* Create new item form */}
              {(isCreatingFile || isCreatingFolder) && (
                <div className="mb-4 p-3 border rounded-md bg-white">
                  <div className="text-sm font-medium mb-2">
                    {isCreatingFile ? 'Create new file' : 'Create new folder'}
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newItemName}
                      onChange={(e) => setNewItemName(e.target.value)}
                      placeholder={isCreatingFile ? "File name" : "Folder name"}
                      className="flex-1 border rounded-md px-3 py-1 text-sm"
                    />
                    <button
                      onClick={createNewItem}
                      className="bg-green-600 text-white rounded-md px-3 py-1 text-sm"
                    >
                      Create
                    </button>
                    <button
                      onClick={cancelCreating}
                      className="bg-gray-400 text-white rounded-md px-3 py-1 text-sm"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              {/* Folders */}
              {currentSubfolders.length > 0 && (
                <div className="mb-4">
                  <h3 className="text-md font-medium mb-2">Folders</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {currentSubfolders.map(folder => (
                      <div key={folder.id} className="border rounded-md p-3 bg-white flex justify-between items-center">
                        <div 
                          className="flex items-center gap-2 cursor-pointer"
                          onClick={() => navigateToFolder(folder.id)}
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-yellow-500" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M2 6a2 2 0 012-2h4l2 2h4a2 2 0 012 2v1H8a3 3 0 00-3 3v1.5a1.5 1.5 0 01-3 0V6z" clipRule="evenodd" />
                            <path d="M6 12a2 2 0 012-2h8a2 2 0 012 2v2a2 2 0 01-2 2H8a2 2 0 01-2-2v-2z" />
                          </svg>
                          <span>{folder.name}</span>
                        </div>
                        <button
                          onClick={() => deleteItem(folder.id, true)}
                          className="text-red-500 hover:text-red-700"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Files */}
              {currentFiles.length > 0 ? (
                <div>
                  <h3 className="text-md font-medium mb-2">Files</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {currentFiles.map(file => (
                      <div key={file.id} className="border rounded-md p-3 bg-white flex justify-between items-center">
                        <div className="flex items-center gap-2">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-500" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
                          </svg>
                          <span>{file.name}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <a
                            href={file.url || '#'}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-500 hover:text-blue-700"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                            </svg>
                          </a>
                          <button
                            onClick={() => deleteItem(file.id, false)}
                            className="text-red-500 hover:text-red-700"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                currentSubfolders.length === 0 && (
                  <div className="text-center py-4 text-gray-500">
                    No files or folders found in this location
                  </div>
                )
              )}
            </div>
          </div>
        )}
        
        <div className="p-6">
          <div className="mb-6">
            <h2 className="text-xl font-semibold mb-3">Members ({space.members.length})</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {space.members.map((member) => (
                <div key={member.userId} className="flex items-center space-x-3 p-3 border rounded-lg">
                  <div className="h-10 w-10 rounded-full overflow-hidden">
                    <img 
                      src={member.picture || 'https://via.placeholder.com/40'} 
                      alt={member.name} 
                      className="h-full w-full object-cover"
                    />
                  </div>
                  <div>
                    <div className="font-semibold">{member.name}</div>
                    <div className="text-sm text-gray-500">Points: {member.points}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-gray-50 p-4 rounded-lg">
            <h2 className="text-xl font-semibold mb-3">Room Details</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <div className="text-sm text-gray-500">Created By</div>
                <div className="font-medium">
                  {space.members.find(member => member.userId === space.author)?.name || 'Unknown'}
                </div>
              </div>
              <div>
                <div className="text-sm text-gray-500">Created On</div>
                <div className="font-medium">
                  {new Date(space.createdAt).toLocaleDateString()}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Room;