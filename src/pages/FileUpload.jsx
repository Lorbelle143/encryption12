import React, { useState, useEffect } from 'react';
import { useHistory } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';
import './FileUpload.css';

function FileUpload() {
  const { isAdmin, loading: authLoading } = useAuth();
  const history = useHistory();
  const [folderName, setFolderName] = useState('');
  const [folderPassword, setFolderPassword] = useState('');
  const [classification, setClassification] = useState('CONFIDENTIAL');
  const [notes, setNotes] = useState('');
  const [files, setFiles] = useState([]);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (authLoading) return; // ⛔ wait for auth
    if (!isAdmin()) {
      history.push('/dashboard');
    }
  }, [authLoading, isAdmin, history]);

  const handleFileChange = (e) => {
    const selectedFiles = Array.from(e.target.files);
    
    if (selectedFiles.length === 0) {
      setMessage('Please select at least one file');
      setFiles([]);
      return;
    }

    // Validate all files
    const invalidFiles = selectedFiles.filter(file => {
      if (file.type !== 'application/pdf') return true;
      if (file.size > 10 * 1024 * 1024) return true; // 10MB limit
      return false;
    });

    if (invalidFiles.length > 0) {
      setMessage('All files must be PDF and less than 10MB each');
      setFiles([]);
      return;
    }

    setFiles(selectedFiles);
    setMessage('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (files.length === 0) {
      setMessage('Please select files to upload');
      return;
    }
    
    setLoading(true);
    setMessage('');

    try {
      const timestamp = Date.now();
      const uploadedFiles = [];

      // Upload all files
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const fileName = `${folderName}/${timestamp}_${file.name}`;
        
        console.log(`Uploading file ${i + 1}/${files.length}:`, fileName);
        
        const { data, error } = await supabase.storage
          .from('office-forms')
          .upload(fileName, file, {
            cacheControl: '3600',
            upsert: false
          });
        
        if (error) {
          console.error('Upload error:', error);
          throw new Error(`Upload failed for ${file.name}: ${error.message}`);
        }
        
        uploadedFiles.push(fileName);
      }

      console.log('Saving to database...');
      const { error: dbError } = await supabase
        .from('folders')
        .insert({
          folder_name: folderName,
          folder_password: folderPassword,
          classification,
          notes,
          file_count: files.length,
          file_urls: uploadedFiles
        });

      if (dbError) {
        console.error('Database error:', dbError);
        throw new Error(`Database error: ${dbError.message}`);
      }

      console.log('Save successful!');
      setMessage(`Folder uploaded successfully! (${files.length} files)`);
      setFolderName('');
      setFolderPassword('');
      setNotes('');
      setFiles([]);
      
      // Reset file input
      const fileInput = document.getElementById('file-input');
      if (fileInput) fileInput.value = '';
      
      setTimeout(() => {
        setMessage('');
        history.push('/files');
      }, 2000);
    } catch (error) {
      console.error('Error:', error);
      setMessage(error.message || 'An error occurred during upload');
    } finally {
      setLoading(false);
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
        <h1>Upload File</h1>
      </header>

      <div className="content">
        <div className="form-card">
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Folder Name</label>
              <input
                type="text"
                value={folderName}
                onChange={(e) => setFolderName(e.target.value)}
                placeholder="Enter folder name"
                required
                disabled={loading}
              />
            </div>

            <div className="form-group">
              <label>Folder Password</label>
              <input
                type="password"
                value={folderPassword}
                onChange={(e) => setFolderPassword(e.target.value)}
                placeholder="Set a password to protect this folder"
                required
                disabled={loading}
              />
              <small style={{ color: '#666', fontSize: '12px' }}>
                This password will be required to view files in this folder
              </small>
            </div>

            <div className="form-group">
              <label>Classification Level</label>
              <select
                value={classification}
                onChange={(e) => setClassification(e.target.value)}
                disabled={loading}
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
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Add any additional notes"
                rows="4"
                disabled={loading}
              />
            </div>

            <div className="file-input-container">
              <label htmlFor="file-input" className="file-input-label">
                <div className="file-icon">📁</div>
                <strong>Choose PDF files (Multiple)</strong>
                <p>Select multiple PDF files (Max 10MB each)</p>
                <input
                  id="file-input"
                  type="file"
                  accept=".pdf,application/pdf"
                  onChange={handleFileChange}
                  disabled={loading}
                  multiple
                  webkitdirectory=""
                  directory=""
                />
              </label>
              {files.length > 0 && (
                <div className="selected-files">
                  <p><strong>{files.length} file(s) selected:</strong></p>
                  {files.map((file, index) => (
                    <div key={index} className="selected-file">
                      <span className="file-name">📄 {file.name}</span>
                      <span className="file-size">({(file.size / 1024).toFixed(2)} KB)</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {message && (
              <div className={`message ${message.includes('success') ? 'message-success' : 'message-error'}`}>
                {message}
              </div>
            )}

            <button 
              type="submit" 
              className="btn-primary" 
              disabled={loading || files.length === 0}
            >
              {loading ? 'Uploading...' : '☁️ Upload Folder'}
            </button>
            
            {files.length === 0 && (
              <p style={{ color: '#eb445a', fontSize: '14px', marginTop: '8px', textAlign: 'center' }}>
                Please select files before uploading
              </p>
            )}
          </form>
        </div>
      </div>
    </div>
  );
}

export default FileUpload;
