// components/VirtualDrawer.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  FolderPlus, 
  File, 
  FileText, 
  Image, 
  Trash2, 
  ChevronRight, 
  ChevronDown, 
  Upload,
  FilePlus,
  MoreVertical
} from 'lucide-react';

const VirtualDrawer = ({ spaceId }) => {
  const [files, setFiles] = useState([]);
  const [folders, setFolders] = useState([]);
  const [expandedFolders, setExpandedFolders] = useState({});
  const [loading, setLoading] = useState(true);
  const [newFolderName, setNewFolderName] = useState('');
  const [showNewFolderInput, setShowNewFolderInput] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [fileUploadOpen, setFileUploadOpen] = useState(false);

  useEffect(() => {
    fetchFilesAndFolders();
  }, [spaceId]);

  const fetchFilesAndFolders = async () => {
    try {
      setLoading(true);
      // Mock data for demonstration - replace with actual API calls
      setFolders([
        { id: '1', name: 'Documents', parentId: null },
        { id: '2', name: 'Images', parentId: null },
        { id: '3', name: 'Shared Materials', parentId: null },
        { id: '4', name: 'Meeting Notes', parentId: '1' }
      ]);
      
      setFiles([
        { id: '1', name: 'Project Overview.docx', type: 'document', folderId: '1', size: '245 KB', updatedAt: '2025-03-15' },
        { id: '2', name: 'Budget.xlsx', type: 'spreadsheet', folderId: '1', size: '128 KB', updatedAt: '2025-03-20' },
        { id: '3', name: 'Team Photo.jpg', type: 'image', folderId: '2', size: '1.2 MB', updatedAt: '2025-03-10' },
        { id: '4', name: 'Design Mockup.png', type: 'image', folderId: '2', size: '789 KB', updatedAt: '2025-03-22' },
        { id: '5', name: 'Q1 Meeting.pdf', type: 'document', folderId: '4', size: '356 KB', updatedAt: '2025-03-25' }
      ]);
      
      setLoading(false);
    } catch (error) {
      console.error('Error fetching files and folders:', error);
      setLoading(false);
    }
  };

  const toggleFolder = (folderId) => {
    setExpandedFolders(prev => ({
      ...prev,
      [folderId]: !prev[folderId]
    }));
  };

  const handleCreateFolder = async () => {
    if (!newFolderName.trim()) return;
    
    try {
      // Mock implementation - replace with actual API call
      const newFolder = {
        id: `folder-${Date.now()}`,
        name: newFolderName,
        parentId: null
      };
      
      setFolders(prev => [...prev, newFolder]);
      setNewFolderName('');
      setShowNewFolderInput(false);
    } catch (error) {
      console.error('Error creating folder:', error);
    }
  };

  const handleFileUpload = (event) => {
    const files = event.target.files;
    if (files.length === 0) return;
    
    // Mock implementation - replace with actual upload logic
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const newFile = {
        id: `file-${Date.now()}-${i}`,
        name: file.name,
        type: getFileType(file.name),
        folderId: selectedItem && selectedItem.type === 'folder' ? selectedItem.id : null,
        size: formatFileSize(file.size),
        updatedAt: new Date().toISOString().split('T')[0]
      };
      
      setFiles(prev => [...prev, newFile]);
    }
    
    setFileUploadOpen(false);
  };

  const getFileType = (fileName) => {
    const extension = fileName.split('.').pop().toLowerCase();
    if (['jpg', 'jpeg', 'png', 'gif', 'svg'].includes(extension)) return 'image';
    if (['doc', 'docx', 'pdf', 'txt'].includes(extension)) return 'document';
    if (['xls', 'xlsx', 'csv'].includes(extension)) return 'spreadsheet';
    return 'other';
  };

  const formatFileSize = (bytes) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / 1048576).toFixed(1) + ' MB';
  };

  const getFileIcon = (fileType) => {
    switch (fileType) {
      case 'document':
        return <FileText size={18} className="text-blue-500" />;
      case 'spreadsheet':
        return <FileText size={18} className="text-green-500" />;
      case 'image':
        return <Image size={18} className="text-purple-500" />;
      default:
        return <File size={18} className="text-gray-500" />;
    }
  };

  const getChildFolders = (parentId) => {
    return folders.filter(folder => folder.parentId === parentId);
  };

  const getFilesInFolder = (folderId) => {
    return files.filter(file => file.folderId === folderId);
  };

  const selectItem = (item, type) => {
    setSelectedItem({ ...item, type });
  };

  const renderFolder = (folder) => {
    const isExpanded = expandedFolders[folder.id];
    const childFolders = getChildFolders(folder.id);
    const folderFiles = getFilesInFolder(folder.id);
    const isSelected = selectedItem?.id === folder.id && selectedItem?.type === 'folder';

    return (
      <div key={folder.id} className="select-none">
        <div 
          className={`flex items-center p-2 hover:bg-gray-100 rounded cursor-pointer ${isSelected ? 'bg-blue-50' : ''}`}
          onClick={() => {
            toggleFolder(folder.id);
            selectItem(folder, 'folder');
          }}
        >
          <span className="mr-1 text-gray-400">
            {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
          </span>
          <span className="mr-2 text-yellow-500">
            <FolderPlus size={18} />
          </span>
          <span className="text-sm truncate">{folder.name}</span>
        </div>
        
        {isExpanded && (
          <div className="pl-6 border-l border-gray-200 ml-2 mt-1">
            {childFolders.map(childFolder => renderFolder(childFolder))}
            
            {folderFiles.map(file => (
              <div 
                key={file.id}
                className={`flex items-center p-2 hover:bg-gray-100 rounded cursor-pointer ${
                  selectedItem?.id === file.id && selectedItem?.type === 'file' ? 'bg-blue-50' : ''
                }`}
                onClick={() => selectItem(file, 'file')}
              >
                <span className="mr-2">{getFileIcon(file.type)}</span>
                <span className="text-sm truncate">{file.name}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b flex items-center justify-between">
        <h2 className="font-semibold text-lg">Files</h2>
        <div className="flex gap-2">
          <button 
            onClick={() => setShowNewFolderInput(true)}
            className="p-1 rounded-full hover:bg-gray-100"
            title="New Folder"
          >
            <FolderPlus size={18} />
          </button>
          
          <button 
            onClick={() => setFileUploadOpen(true)}
            className="p-1 rounded-full hover:bg-gray-100"
            title="Upload Files"
          >
            <Upload size={18} />
          </button>
        </div>
      </div>

      {/* New Folder Input */}
      {showNewFolderInput && (
        <div className="p-3 bg-gray-50">
          <div className="flex items-center">
            <input
              type="text"
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              placeholder="Folder name"
              className="w-full p-2 border rounded text-sm"
              autoFocus
            />
            <button 
              onClick={handleCreateFolder}
              className="ml-2 p-2 bg-blue-500 text-white rounded text-sm"
            >
              Create
            </button>
          </div>
        </div>
      )}

      {/* File Upload (hidden input) */}
      <input
        type="file"
        id="file-upload"
        multiple
        className="hidden"
        onChange={handleFileUpload}
        onClick={(e) => e.target.value = null} // Allow selecting the same file again
      />

      {/* File List */}
      <div className="flex-1 overflow-y-auto p-2">
        {loading ? (
          <div className="flex justify-center p-4">
            <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        ) : (
          <>
            <div className="mb-2 text-xs text-gray-500 font-medium uppercase px-2">Root</div>
            {folders.filter(folder => !folder.parentId).map(folder => renderFolder(folder))}

            <div className="mb-2 mt-4 text-xs text-gray-500 font-medium uppercase px-2">Unorganized Files</div>
            {files.filter(file => !file.folderId).map(file => (
              <div 
                key={file.id}
                className={`flex items-center p-2 hover:bg-gray-100 rounded cursor-pointer ${
                  selectedItem?.id === file.id && selectedItem?.type === 'file' ? 'bg-blue-50' : ''
                }`}
                onClick={() => selectItem(file, 'file')}
              >
                <span className="mr-2">{getFileIcon(file.type)}</span>
                <span className="text-sm truncate">{file.name}</span>
              </div>
            ))}
          </>
        )}
      </div>

      {/* Bottom Actions */}
      <div className="p-3 border-t bg-gray-50">
        <button 
          onClick={() => document.getElementById('file-upload').click()}
          className="w-full py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-md shadow-sm flex items-center justify-center gap-2 transition-colors"
        >
          <Upload size={16} />
          <span>Upload Files</span>
        </button>
      </div>
    </div>
  );
};

export default VirtualDrawer;