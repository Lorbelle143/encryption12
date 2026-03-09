import React, { useEffect, useState } from 'react';
import { useHistory } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';
import './FileList.css';

function FileList() {
  const { isAdmin, loading: authLoading } = useAuth();
  const history = useHistory();
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedFolder, setSelectedFolder] = useState(null);
  const [passwordInput, setPasswordInput] = useState('');
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const [showEditModal, setShowEditModal] = useState(false);
  const [editFolder, setEditFolder] = useState(null);
  const [editFolderName, setEditFolderName] = useState('');
  const [editNotes, setEditNotes] = useState('');
  const [editClassification, setEditClassification] = useState('');
  const [editLoading, setEditLoading] = useState(false);
  const [addFiles, setAddFiles] = useState([]);
  const [addingFiles, setAddingFiles] = useState(false);
  const [viewMode, setViewMode] = useState('list'); // 'list' or 'grid'
  const [mainViewMode, setMainViewMode] = useState('list'); // 'list' or 'grid' for main files

  const fetchFiles = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('folders')
      .select('*')
      .order('created_at', { ascending: false });

    if (!error) {
      setFiles(data);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (authLoading) return; // ⛔ wait for auth
    
    console.log('FileList useEffect - isAdmin:', isAdmin());
    
    if (!isAdmin()) {
      console.log('Not admin, redirecting to dashboard');
      history.push('/dashboard');
    } else {
      console.log('Is admin, fetching files');
      fetchFiles();
    }
  }, [authLoading]);

  const getFileIcon = (fileName) => {
    return '📕';
  };

  const getFileType = (fileName) => {
    return 'PDF';
  };

  const openFolder = (folder) => {
    setSelectedFolder(folder);
    setShowPasswordModal(true);
    setPasswordInput('');
    setPasswordError('');
  };

  const openEditModal = (folder) => {
    setEditFolder(folder);
    setEditFolderName(folder.folder_name);
    setEditNotes(folder.notes || '');
    setEditClassification(folder.classification);
    setShowEditModal(true);
  };

  const handleEditSubmit = async () => {
    setEditLoading(true);
    try {
      const { error } = await supabase
        .from('folders')
        .update({
          folder_name: editFolderName,
          notes: editNotes,
          classification: editClassification
        })
        .eq('id', editFolder.id);

      if (error) throw error;

      setShowEditModal(false);
      fetchFiles();
      alert('Folder updated successfully!');
    } catch (error) {
      alert('Error updating folder: ' + error.message);
    } finally {
      setEditLoading(false);
    }
  };

  const verifyPassword = () => {
    if (passwordInput === selectedFolder.folder_password) {
      setPasswordError('');
      // Password is correct, modal stays open to show files
    } else {
      setPasswordError('Incorrect password');
    }
  };

  const handleAddFiles = (e) => {
    const selectedFiles = Array.from(e.target.files);
    
    if (selectedFiles.length === 0) return;

    const invalidFiles = selectedFiles.filter(file => {
      if (file.type !== 'application/pdf') return true;
      if (file.size > 10 * 1024 * 1024) return true;
      return false;
    });

    if (invalidFiles.length > 0) {
      alert('All files must be PDF and less than 10MB each');
      return;
    }

    setAddFiles(selectedFiles);
  };

  const uploadAdditionalFiles = async () => {
    if (addFiles.length === 0) {
      alert('Please select files to add');
      return;
    }

    setAddingFiles(true);
    try {
      const timestamp = Date.now();
      const uploadedFiles = [];

      for (let i = 0; i < addFiles.length; i++) {
        const file = addFiles[i];
        const fileName = `${selectedFolder.folder_name}/${timestamp}_${file.name}`;
        
        const { data, error } = await supabase.storage
          .from('office-forms')
          .upload(fileName, file, {
            cacheControl: '3600',
            upsert: false
          });
        
        if (error) throw error;
        uploadedFiles.push(fileName);
      }

      // Update folder with new files
      const updatedFileUrls = [...selectedFolder.file_urls, ...uploadedFiles];
      const { error: dbError } = await supabase
        .from('folders')
        .update({
          file_urls: updatedFileUrls,
          file_count: updatedFileUrls.length
        })
        .eq('id', selectedFolder.id);

      if (dbError) throw dbError;

      alert(`Successfully added ${addFiles.length} file(s)!`);
      setAddFiles([]);
      setShowPasswordModal(false);
      fetchFiles();
    } catch (error) {
      alert('Error adding files: ' + error.message);
    } finally {
      setAddingFiles(false);
    }
  };

  const downloadAllFiles = async () => {
    if (!selectedFolder || selectedFolder.file_urls.length === 0) return;

    try {
      for (let i = 0; i < selectedFolder.file_urls.length; i++) {
        const fileUrl = selectedFolder.file_urls[i];
        await downloadFile(fileUrl);
        // Small delay between downloads
        await new Promise(resolve => setTimeout(resolve, 500));
      }
      alert(`Downloaded all ${selectedFolder.file_urls.length} files!`);
    } catch (error) {
      alert('Error downloading files: ' + error.message);
    }
  };

  const downloadFile = async (fileUrl) => {
    try {
      const { data, error } = await supabase.storage
        .from('office-forms')
        .download(fileUrl);

      if (error) throw error;

      const url = URL.createObjectURL(data);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileUrl.split('/').pop();
      a.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      alert('Error downloading file: ' + error.message);
    }
  };

  const viewFile = async (fileUrl) => {
    try {
      const { data, error } = await supabase.storage
        .from('office-forms')
        .download(fileUrl);

      if (error) throw error;

      const blob = new Blob([data], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      
      window.open(url, '_blank');
      
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (error) {
      alert('Error viewing file: ' + error.message);
    }
  };

  const deleteFile = async (folderId, fileUrls) => {
    if (!window.confirm('Are you sure you want to delete this folder and all its files?')) {
      return;
    }

    try {
      // Delete all files in the folder
      if (fileUrls && fileUrls.length > 0) {
        await supabase.storage.from('office-forms').remove(fileUrls);
      }

      const { error } = await supabase
        .from('folders')
        .delete()
        .eq('id', folderId);

      if (error) throw error;
      fetchFiles();
    } catch (error) {
      alert('Error deleting folder: ' + error.message);
    }
  };

  return (
    <div className="page">
      <header className="header">
        <button 
          type="button"
          onClick={() => history.push('/dashboard')} 
          className="btn-back"
        >
          ← Back
        </button>
        <h1>Files</h1>
        <div style={{ display: 'flex', gap: '4px' }}>
          <button
            onClick={() => setMainViewMode('list')}
            className={`btn-view-toggle ${mainViewMode === 'list' ? 'active' : ''}`}
            title="List View"
          >
            ☰
          </button>
          <button
            onClick={() => setMainViewMode('grid')}
            className={`btn-view-toggle ${mainViewMode === 'grid' ? 'active' : ''}`}
            title="Grid View"
          >
            ⊞
          </button>
        </div>
      </header>

      <div className="content">
        {loading ? (
          <div className="loading-container">
            <div className="spinner"></div>
          </div>
        ) : files.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📄</div>
            <h2>No Files Yet</h2>
            <p>Upload your first document to get started</p>
          </div>
        ) : (
          <div className={`files-list ${mainViewMode}`}>
            {mainViewMode === 'list' ? (
              // List View for main files
              files.map((folder) => (
                <div key={folder.id} className="file-item">
                  <div className="file-info">
                    <div className="file-header">
                      <span className="file-icon-large">📁</span>
                      <div>
                        <h3>{folder.folder_name}</h3>
                        <p>{folder.file_count} file(s)</p>
                      </div>
                    </div>
                    <div className="file-meta">
                      <span className="file-date">
                        {new Date(folder.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    {folder.notes && (
                      <p className="folder-notes">{folder.notes}</p>
                    )}
                  </div>
                  <div className="file-actions">
                    <span className={`badge badge-${folder.classification.toLowerCase()}`}>
                      {folder.classification}
                    </span>
                    <button
                      onClick={() => openFolder(folder)}
                      className="btn-view"
                      title="Open Folder"
                    >
                      🔓 Open
                    </button>
                    <button
                      onClick={() => openEditModal(folder)}
                      className="btn-secondary"
                      title="Edit Folder"
                    >
                      ✏️ Edit
                    </button>
                    <button
                      onClick={() => deleteFile(folder.id, folder.file_urls)}
                      className="btn-danger"
                      title="Delete Folder"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              ))
            ) : (
              // Grid View for main files
              <div className="files-grid">
                {files.map((folder) => (
                  <div key={folder.id} className="file-card">
                    <div className="file-card-header">
                      <span className="file-icon-xl">📁</span>
                      <span className={`badge badge-${folder.classification.toLowerCase()}`}>
                        {folder.classification}
                      </span>
                    </div>
                    <div className="file-card-content">
                      <h3>{folder.folder_name}</h3>
                      <p className="file-count">{folder.file_count} file(s)</p>
                      <p className="file-date">
                        {new Date(folder.created_at).toLocaleDateString()}
                      </p>
                      {folder.notes && (
                        <p className="folder-notes-grid">{folder.notes}</p>
                      )}
                    </div>
                    <div className="file-card-actions">
                      <button
                        onClick={() => openFolder(folder)}
                        className="btn-view btn-full"
                        title="Open Folder"
                      >
                        🔓 Open
                      </button>
                      <div className="btn-group">
                        <button
                          onClick={() => openEditModal(folder)}
                          className="btn-secondary btn-small"
                          title="Edit Folder"
                        >
                          ✏️
                        </button>
                        <button
                          onClick={() => deleteFile(folder.id, folder.file_urls)}
                          className="btn-danger btn-small"
                          title="Delete Folder"
                        >
                          🗑️
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Password Modal */}
      {showPasswordModal && selectedFolder && (
        <div className="modal-overlay" onClick={() => setShowPasswordModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>🔒 Enter Password</h2>
            <p>This folder is password protected</p>
            <p><strong>{selectedFolder.folder_name}</strong></p>
            
            <div className="form-group" style={{ marginTop: '20px' }}>
              <input
                type="password"
                value={passwordInput}
                onChange={(e) => setPasswordInput(e.target.value)}
                placeholder="Enter folder password"
                onKeyPress={(e) => e.key === 'Enter' && verifyPassword()}
                autoFocus
              />
            </div>

            {passwordError && (
              <div className="message" style={{ color: '#eb445a', marginTop: '10px' }}>
                {passwordError}
              </div>
            )}

            <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
              <button onClick={verifyPassword} className="btn-primary">
                Unlock
              </button>
              <button onClick={() => setShowPasswordModal(false)} className="btn-secondary">
                Cancel
              </button>
            </div>

            {/* Show files after unlock */}
            {passwordInput === selectedFolder.folder_password && (
              <div style={{ marginTop: '20px', borderTop: '1px solid #ddd', paddingTop: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                  <h3>Files in folder ({selectedFolder.file_urls.length}):</h3>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <div style={{ display: 'flex', gap: '4px', marginRight: '12px' }}>
                      <button
                        onClick={() => setViewMode('list')}
                        className={`btn-view-toggle ${viewMode === 'list' ? 'active' : ''}`}
                        title="List View"
                      >
                        ☰
                      </button>
                      <button
                        onClick={() => setViewMode('grid')}
                        className={`btn-view-toggle ${viewMode === 'grid' ? 'active' : ''}`}
                        title="Grid View"
                      >
                        ⊞
                      </button>
                    </div>
                    <button
                      onClick={downloadAllFiles}
                      className="btn-primary"
                      style={{ padding: '8px 16px', fontSize: '13px' }}
                    >
                      ⬇️ Download All
                    </button>
                  </div>
                </div>

                <div style={{ 
                  maxHeight: '500px', 
                  overflowY: 'auto', 
                  marginBottom: '20px',
                  border: '1px solid #ddd',
                  borderRadius: '8px',
                  background: '#f9f9f9'
                }}>
                  {viewMode === 'list' ? (
                    // List View
                    selectedFolder.file_urls.map((fileUrl, index) => (
                      <div key={index} style={{ 
                        padding: '16px', 
                        borderBottom: index < selectedFolder.file_urls.length - 1 ? '1px solid #e0e0e0' : 'none',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        background: 'white',
                        transition: 'background 0.2s'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.background = '#f5f5f5'}
                      onMouseLeave={(e) => e.currentTarget.style.background = 'white'}
                      >
                        <span style={{ fontSize: '15px', fontWeight: '500' }}>📄 {fileUrl.split('/').pop()}</span>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <button
                            onClick={() => viewFile(fileUrl)}
                            className="btn-view"
                            style={{ padding: '8px 14px', fontSize: '13px' }}
                          >
                            👁️ View
                          </button>
                          <button
                            onClick={() => downloadFile(fileUrl)}
                            className="btn-secondary"
                            style={{ padding: '8px 14px', fontSize: '13px' }}
                          >
                            ⬇️ Download
                          </button>
                        </div>
                      </div>
                    ))
                  ) : (
                    // Grid View
                    <div style={{ 
                      display: 'grid', 
                      gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', 
                      gap: '16px', 
                      padding: '16px' 
                    }}>
                      {selectedFolder.file_urls.map((fileUrl, index) => (
                        <div key={index} style={{ 
                          background: 'white',
                          borderRadius: '8px',
                          padding: '16px',
                          textAlign: 'center',
                          border: '1px solid #e0e0e0',
                          transition: 'all 0.2s',
                          cursor: 'pointer'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.transform = 'translateY(-2px)';
                          e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.transform = 'translateY(0)';
                          e.currentTarget.style.boxShadow = 'none';
                        }}
                        >
                          <div style={{ fontSize: '48px', marginBottom: '12px' }}>📄</div>
                          <div style={{ 
                            fontSize: '13px', 
                            fontWeight: '500', 
                            marginBottom: '12px',
                            wordBreak: 'break-word',
                            lineHeight: '1.3'
                          }}>
                            {fileUrl.split('/').pop()}
                          </div>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                            <button
                              onClick={() => viewFile(fileUrl)}
                              className="btn-view"
                              style={{ padding: '6px 12px', fontSize: '12px', width: '100%' }}
                            >
                              👁️ View
                            </button>
                            <button
                              onClick={() => downloadFile(fileUrl)}
                              className="btn-secondary"
                              style={{ padding: '6px 12px', fontSize: '12px', width: '100%' }}
                            >
                              ⬇️ Download
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Add more files section */}
                <div style={{ borderTop: '1px solid #ddd', paddingTop: '20px' }}>
                  <h4>Add More Files:</h4>
                  <div style={{ marginTop: '12px' }}>
                    <input
                      type="file"
                      accept=".pdf,application/pdf"
                      multiple
                      onChange={handleAddFiles}
                      disabled={addingFiles}
                      style={{ marginBottom: '12px' }}
                    />
                    {addFiles.length > 0 && (
                      <div style={{ marginBottom: '12px', fontSize: '13px', color: '#666' }}>
                        {addFiles.length} file(s) selected
                      </div>
                    )}
                    <button
                      onClick={uploadAdditionalFiles}
                      className="btn-primary"
                      disabled={addingFiles || addFiles.length === 0}
                      style={{ padding: '8px 16px', fontSize: '13px' }}
                    >
                      {addingFiles ? 'Uploading...' : '➕ Add Files'}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && editFolder && (
        <div className="modal-overlay" onClick={() => setShowEditModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>✏️ Edit Folder</h2>
            
            <div className="form-group" style={{ marginTop: '20px' }}>
              <label>Folder Name</label>
              <input
                type="text"
                value={editFolderName}
                onChange={(e) => setEditFolderName(e.target.value)}
                placeholder="Enter folder name"
                disabled={editLoading}
              />
            </div>

            <div className="form-group">
              <label>Classification Level</label>
              <select
                value={editClassification}
                onChange={(e) => setEditClassification(e.target.value)}
                disabled={editLoading}
              >
                <option value="PUBLIC">Public</option>
                <option value="INTERNAL">Internal</option>
                <option value="CONFIDENTIAL">Confidential</option>
                <option value="RESTRICTED">Restricted</option>
              </select>
            </div>

            <div className="form-group">
              <label>Notes</label>
              <textarea
                value={editNotes}
                onChange={(e) => setEditNotes(e.target.value)}
                placeholder="Add any additional notes"
                rows="4"
                disabled={editLoading}
              />
            </div>

            <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
              <button 
                onClick={handleEditSubmit} 
                className="btn-primary"
                disabled={editLoading}
              >
                {editLoading ? 'Saving...' : 'Save Changes'}
              </button>
              <button 
                onClick={() => setShowEditModal(false)} 
                className="btn-secondary"
                disabled={editLoading}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default FileList;
