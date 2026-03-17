import React, { useState, useEffect } from 'react';
import { useHistory } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';
import { hashPassword } from '../lib/crypto';
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
  const [progress, setProgress] = useState({ done: 0, total: 0 });
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    if (authLoading) return; // ⛔ wait for auth
    if (!isAdmin()) {
      history.push('/dashboard');
    }
  }, [authLoading, isAdmin, history]);

  const validateFiles = (selectedFiles) => {
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    const invalid = selectedFiles.filter(f => !allowedTypes.includes(f.type) || f.size > 10 * 1024 * 1024);
    return invalid.length === 0;
  };

  const handleFileChange = (e) => {
    const selectedFiles = Array.from(e.target.files);
    if (selectedFiles.length === 0) { setMessage('Please select at least one file'); setFiles([]); return; }
    if (!validateFiles(selectedFiles)) { setMessage('Files must be PDF or image (JPG, PNG, GIF, WEBP) and less than 10MB each'); setFiles([]); return; }
    setFiles(selectedFiles);
    setMessage('');
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const dropped = Array.from(e.dataTransfer.files);
    if (dropped.length === 0) return;
    if (!validateFiles(dropped)) { setMessage('Files must be PDF or image (JPG, PNG, GIF, WEBP) and less than 10MB each'); return; }
    setFiles(prev => [...prev, ...dropped]);
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
    setProgress({ done: 0, total: files.length });

    try {
      const timestamp = Date.now();
      const BATCH_SIZE = 10; // upload 10 at a time
      const uploadedFiles = new Array(files.length);

      for (let i = 0; i < files.length; i += BATCH_SIZE) {
        const batch = files.slice(i, i + BATCH_SIZE);
        await Promise.all(batch.map(async (file, batchIndex) => {
          const globalIndex = i + batchIndex;
          const fileName = `${folderName}/${timestamp}_${file.name}`;
          const { error } = await supabase.storage
            .from('office-forms')
            .upload(fileName, file, { cacheControl: '3600', upsert: false });
          if (error) throw new Error(`Upload failed for ${file.name}: ${error.message}`);
          uploadedFiles[globalIndex] = fileName;
          setProgress(p => ({ ...p, done: p.done + 1 }));
        }));
      }

      // Hash password before storing
      const hashedPassword = await hashPassword(folderPassword);

      const { error: dbError } = await supabase
        .from('folders')
        .insert({
          folder_name: folderName.trim(),
          folder_password: hashedPassword,
          classification,
          notes: notes.trim(),
          file_count: files.length,
          file_urls: uploadedFiles
        });

      if (dbError) throw new Error('Failed to save folder. Please try again.');

      setMessage(`Folder uploaded successfully! (${files.length} files)`);
      setFolderName('');
      setFolderPassword('');
      setNotes('');
      setFiles([]);
      setProgress({ done: 0, total: 0 });

      const fileInput = document.getElementById('file-input');
      if (fileInput) fileInput.value = '';

      setTimeout(() => {
        setMessage('');
        history.push('/files');
      }, 2000);
    } catch (error) {
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
              <label
                htmlFor="file-input"
                className={`file-input-label ${isDragging ? 'dragging' : ''}`}
                onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleDrop}
              >
                <div className="file-icon">{isDragging ? '📂' : '📁'}</div>
                <strong>{isDragging ? 'Drop files here' : 'Drag & drop or click to choose files'}</strong>
                <p>PDF or images (JPG, PNG, GIF, WEBP) — Max 10MB each</p>
                <input
                  id="file-input"
                  type="file"
                  accept=".pdf,application/pdf,image/*"
                  onChange={handleFileChange}
                  disabled={loading}
                  multiple
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

            {loading && progress.total > 0 && (
              <div style={{ margin: '12px 0' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: '#666', marginBottom: '6px' }}>
                  <span>Uploading files...</span>
                  <span>{progress.done} / {progress.total}</span>
                </div>
                <div style={{ background: '#e0e0e0', borderRadius: '99px', height: '8px', overflow: 'hidden' }}>
                  <div style={{
                    height: '100%',
                    borderRadius: '99px',
                    background: 'var(--primary, #3880ff)',
                    width: `${Math.round((progress.done / progress.total) * 100)}%`,
                    transition: 'width 0.2s ease'
                  }} />
                </div>
              </div>
            )}

            <button 
              type="submit" 
              className="btn-primary" 
              disabled={loading || files.length === 0}
            >
              {loading ? `Uploading... (${progress.done}/${progress.total})` : '☁️ Upload Folder'}
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
