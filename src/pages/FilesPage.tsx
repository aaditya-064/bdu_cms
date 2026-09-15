import { useState, useEffect, useCallback } from 'react';
import {
  FolderPlus,
  Upload,
  Download,
  Trash2,
  Folder,
  File,
  ChevronRight,
  Home,
} from 'lucide-react';
import api from '../services/api';
import type { FileItem, FolderItem } from '../types';

function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

export default function FilesPage() {
  const [files, setFiles] = useState<FileItem[]>([]);
  const [folders, setFolders] = useState<FolderItem[]>([]);
  const [currentFolder, setCurrentFolder] = useState<string | null>(null);
  const [folderPath, setFolderPath] = useState<Array<{ id: string | null; name: string }>>([{ id: null, name: 'Root' }]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showNewFolder, setShowNewFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [filesData, foldersData] = await Promise.all([
        api.getFiles(currentFolder || undefined),
        api.getFolders(currentFolder || undefined),
      ]);
      setFiles(filesData.files);
      setFolders(foldersData.folders);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load files');
    } finally {
      setLoading(false);
    }
  }, [currentFolder]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleCreateFolder = async () => {
    if (!newFolderName.trim()) return;
    try {
      await api.createFolder(newFolderName.trim(), currentFolder || undefined);
      setNewFolderName('');
      setShowNewFolder(false);
      loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create folder');
    }
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      await api.uploadFile(file, currentFolder || undefined);
      e.target.value = '';
      loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to upload file');
    }
  };

  const handleDownload = async (fileId: string) => {
    try {
      await api.downloadFile(fileId);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to download file');
    }
  };

  const handleDeleteFile = async (fileId: string, fileName: string) => {
    if (!confirm(`Delete "${fileName}"?`)) return;
    try {
      await api.deleteFile(fileId);
      loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete file');
    }
  };

  const handleDeleteFolder = async (folderId: string, folderName: string) => {
    if (!confirm(`Delete folder "${folderName}" and all its contents?`)) return;
    try {
      await api.deleteFolder(folderId);
      loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete folder');
    }
  };

  const navigateToFolder = (folderId: string | null, folderName: string) => {
    setCurrentFolder(folderId);
    if (folderId === null) {
      setFolderPath([{ id: null, name: 'Root' }]);
    } else {
      const existingIndex = folderPath.findIndex((f) => f.id === folderId);
      if (existingIndex >= 0) {
        setFolderPath(folderPath.slice(0, existingIndex + 1));
      } else {
        setFolderPath([...folderPath, { id: folderId, name: folderName }]);
      }
    }
  };

  if (loading && files.length === 0 && folders.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">File Manager</h1>
          <p className="text-gray-500 text-sm mt-1">Manage uploaded documents and files</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowNewFolder(true)}
            className="flex items-center gap-2 px-3 py-2 text-sm bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            <FolderPlus size={16} />
            New Folder
          </button>
          <label className="flex items-center gap-2 px-3 py-2 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 cursor-pointer">
            <Upload size={16} />
            Upload
            <input type="file" className="hidden" onChange={handleUpload} />
          </label>
        </div>
      </div>

      {/* Breadcrumb */}
      <div className="flex items-center gap-1 text-sm text-gray-500">
        <button
          onClick={() => navigateToFolder(null, 'Root')}
          className="flex items-center gap-1 hover:text-indigo-600"
        >
          <Home size={14} />
          Root
        </button>
        {folderPath.slice(1).map((item) => (
          <span key={item.id} className="flex items-center gap-1">
            <ChevronRight size={14} />
            <button
              onClick={() => navigateToFolder(item.id, item.name)}
              className="hover:text-indigo-600"
            >
              {item.name}
            </button>
          </span>
        ))}
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {showNewFolder && (
        <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg border">
          <input
            type="text"
            value={newFolderName}
            onChange={(e) => setNewFolderName(e.target.value)}
            placeholder="Folder name"
            className="flex-1 px-3 py-1.5 text-sm border border-gray-300 rounded-lg"
            autoFocus
            onKeyDown={(e) => e.key === 'Enter' && handleCreateFolder()}
          />
          <button onClick={handleCreateFolder} className="px-3 py-1.5 text-sm bg-indigo-600 text-white rounded-lg">
            Create
          </button>
          <button onClick={() => { setShowNewFolder(false); setNewFolderName(''); }} className="px-3 py-1.5 text-sm text-gray-600">
            Cancel
          </button>
        </div>
      )}

      {/* Folders */}
      {folders.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {folders.map((folder) => (
            <div
              key={folder._id}
              className="flex items-center gap-3 p-3 bg-white border border-gray-200 rounded-lg hover:border-indigo-300 transition-colors group"
            >
              <button
                onClick={() => navigateToFolder(folder._id, folder.name)}
                className="flex items-center gap-3 flex-1 min-w-0"
              >
                <Folder className="text-indigo-500 shrink-0" size={20} />
                <span className="text-sm font-medium text-gray-700 truncate">{folder.name}</span>
              </button>
              <button
                onClick={() => handleDeleteFolder(folder._id, folder.name)}
                className="opacity-0 group-hover:opacity-100 p-1 text-gray-400 hover:text-red-500 transition-all"
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Files */}
      {files.length > 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left text-xs font-medium text-gray-500 px-4 py-3">Name</th>
                <th className="text-left text-xs font-medium text-gray-500 px-4 py-3 hidden sm:table-cell">Size</th>
                <th className="text-left text-xs font-medium text-gray-500 px-4 py-3 hidden md:table-cell">Uploaded</th>
                <th className="text-right text-xs font-medium text-gray-500 px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {files.map((file) => (
                <tr key={file._id} className="border-b border-gray-50 hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <File size={16} className="text-gray-400 shrink-0" />
                      <span className="text-sm text-gray-700 truncate">{file.originalName}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500 hidden sm:table-cell">
                    {formatFileSize(file.size)}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500 hidden md:table-cell">
                    {new Date(file.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => handleDownload(file._id)}
                        className="p-1.5 text-gray-400 hover:text-indigo-600 rounded"
                        title="Download"
                      >
                        <Download size={14} />
                      </button>
                      <button
                        onClick={() => handleDeleteFile(file._id, file.originalName)}
                        className="p-1.5 text-gray-400 hover:text-red-500 rounded"
                        title="Delete"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : folders.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <div className="text-4xl mb-4">📁</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No files yet</h3>
          <p className="text-gray-500">Upload files to get started.</p>
        </div>
      ) : null}
    </div>
  );
}
