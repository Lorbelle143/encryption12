import React, { useState, useRef, useCallback } from 'react';
import { useHistory } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { uploadFile } from '../lib/storage';
import { hashPassword } from '../lib/crypto';
import { addAuditEntry } from '../lib/audit';
import './FileUpload.css';

const MAX_FILE_SIZE = 10 * 1024 * 1024;
const ALLOWED_TYPES = ['application/pdf', 'image/jpeg', 'image/png', 'image/gif', 'image/webp'];
const ALLOWED_EXTS = '.pdf,.jpg,.jpeg,.png,.gif,.webp';

function formatSize(bytes) {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
}

function FileUpload() {
  const history = useHistory();
  const [folderName, setFolderName] = useState('');
  const [classification, setClassification] = useState('PUBLIC');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [notes, setNotes] = useState('');
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('');
  const [dragging, setDragging] = useState(false);
  const fileInputRef = useRef(null);

  const addFiles = useCallback((newFiles) => {
    const valid = [];
    const errors = [];
    for (const file of newFiles) {
      if (!ALLOWED_TYPES.includes(file.type)) { errors.push(file.name + ': unsupported type'); continue; }
      if (file.size > MAX_FILE_SIZE) { errors.push(file.name + ': exceeds 10MB'); continue; }
      valid.push(file);
    }
    if (errors.length > 0) { setMessage(errors.join(', ')); setMessageType('error'); }
    setSelectedFiles(prev => {
      const existing = new Set(prev.map(f => f.name + f.size));
      return [...prev, ...valid.filter(f => !existing.has(f.name + f.size))];
    });
  }, []);

  const handleFileChange = (e) => { addFiles(Array.from(e.target.files)); e.target.value = ''; };
  const handleDragOver = (e) => { e.preventDefault(); setDragging(true); };
  const handleDragLeave = () => setDragging(false);
  const handleDrop = (e) => { e.preventDefault(); setDragging(false); addFiles(Array.from(e.dataTransfer.files)); };
  const removeFile = (index) => setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  const clearAll = () => { setSelectedFiles([]); if (fileInputRef.current) fileInputRef.current.value = ''; };
  const totalSize = selectedFiles.reduce((sum, f) => sum + f.size, 0);

  const handleUpload = async (e) => {
    e.preventDefault();
    setMessage(''); setMessageType('');
    if (!folderName.trim()) { setMessage('Folder name is required.'); setMessageType('error'); return; }
    if (!password.trim()) { setMessage('Password is required.'); setMessageType('error'); return; }
    if (selectedFiles.length === 0) { setMessage('Please select at least one file.'); setMessageType('error'); return; }
    setUploading(true);
    try {
      const uploadedUrls = [];
      let cloudinaryCount = 0;
      let supabaseCount = 0;
      for (const file of selectedFiles) {
        const { ref, provider } = await uploadFile(file, folderName.trim());
        uploadedUrls.push(ref);
        if (provider === 'cloudinary') cloudinaryCount++;
        else supabaseCount++;
      }
      const hashedPassword = await hashPassword(password.trim());
      const { error: dbError } = await supabase.from('folders').insert([{
        folder_name: folderName.trim(),
        classification,
        folder_password: hashedPassword,
        notes: notes.trim() || null,
        file_urls: uploadedUrls,
        file_count: uploadedUrls.length,
        is_archived: false,
        archived_file_urls: [],
        custom_names: {},
      }]);
      if (dbError) throw dbError;
      await addAuditEntry('Uploaded Folder', '"' + folderName.trim() + '" (' + uploadedUrls.length + ' file(s))');
      const providerNote = cloudinaryCount > 0 && supabaseCount > 0
        ? ` (${cloudinaryCount} via Cloudinary, ${supabaseCount} via Supabase)`
        : cloudinaryCount > 0 ? ' via Cloudinary' : ' via Supabase';
      setMessage('Successfully uploaded ' + uploadedUrls.length + ' file(s) to "' + folderName.trim() + '"!' + providerNote);
      setMessageType('success');
      setFolderName(''); setClassification('PUBLIC'); setPassword(''); setNotes(''); setSelectedFiles([]);
    } catch (err) {
      setMessage('Upload failed: ' + err.message);
      setMessageType('error');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="page">
      <header className="header">
        <button type="button" onClick={() => history.push('/dashboard')} className="btn-back">
          Back
        </button>
        <h1>Upload Document</h1>
        <div />
      </header>
      <div className="content">
        <div className="form-card">
          <form onSubmit={handleUpload}>

            <div className="form-group">
              <label htmlFor="folder-name">Folder Name *</label>
              <input
                id="folder-name"
                type="text"
                value={folderName}
                onChange={(e) => setFolderName(e.target.value)}
                placeholder="e.g. Student Records 2024"
                disabled={uploading}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="classification">Classification Level *</label>
              <select
                id="classification"
                value={classification}
                onChange={(e) => setClassification(e.target.value)}
                disabled={uploading}
              >
                <option value="PUBLIC">Public</option>
                <option value="INTERNAL">Internal</option>
                <option value="CONFIDENTIAL">Confidential</option>
                <option value="RESTRICTED">Restricted</option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="folder-password">Folder Password *</label>
              <div style={{ position: 'relative' }}>
                <input
                  id="folder-password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Set a password for this folder"
                  disabled={uploading}
                  style={{ paddingRight: '60px' }}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(v => !v)}
                  style={{
                    position: 'absolute', right: '12px', top: '50%',
                    transform: 'translateY(-50%)', background: 'none', border: 'none',
                    cursor: 'pointer', fontSize: '12px', color: '#888', fontWeight: '600'
                  }}
                >
                  {showPassword ? 'Hide' : 'Show'}
                </button>
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="notes">
                Notes{' '}
                <span style={{ fontWeight: 400, color: '#999', fontSize: '12px' }}>(optional)</span>
              </label>
              <textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Add any relevant notes..."
                rows="3"
                disabled={uploading}
              />
            </div>

            <div className="form-group">
              <label>
                Files *{' '}
                <span style={{ fontWeight: 400, color: '#999', fontSize: '12px' }}>
                  PDF, JPG, PNG, GIF, WEBP — max 10MB each
                </span>
              </label>
              <label
                className={dragging ? 'file-input-label dragging' : 'file-input-label'}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
              >
                <div className="file-icon">📂</div>
                <strong>Click to browse or drag and drop files here</strong>
                <p>Supports PDF and images (JPG, PNG, GIF, WEBP)</p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept={ALLOWED_EXTS}
                  multiple
                  onChange={handleFileChange}
                  disabled={uploading}
                />
              </label>
            </div>

            {selectedFiles.length > 0 && (
              <div style={{ marginBottom: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <span style={{ fontSize: '13px', fontWeight: '600', color: '#555' }}>
                    {selectedFiles.length} file(s) — {formatSize(totalSize)} total
                  </span>
                  <button
                    type="button"
                    onClick={clearAll}
                    disabled={uploading}
                    style={{ fontSize: '12px', color: '#eb445a', background: 'none', border: 'none', cursor: 'pointer', fontWeight: '600' }}
                  >
                    Clear all
                  </button>
                </div>
                <div style={{ border: '1px solid #e0e0e0', borderRadius: '8px', overflow: 'hidden' }}>
                  {selectedFiles.map((file, i) => (
                    <div
                      key={i}
                      className="selected-file"
                      style={{ borderBottom: i < selectedFiles.length - 1 ? '1px solid #f0f0f0' : 'none', borderRadius: 0 }}
                    >
                      <span className="file-name">
                        {file.type.startsWith('image/') ? '🖼️' : '📄'} {file.name}
                      </span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <span className="file-size">{formatSize(file.size)}</span>
                        <button
                          type="button"
                          onClick={() => removeFile(i)}
                          disabled={uploading}
                          style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#eb445a', fontSize: '18px', lineHeight: 1, padding: '0 2px' }}
                        >
                          x
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {message && (
              <div style={{
                padding: '12px 16px', borderRadius: '8px', marginBottom: '16px', fontSize: '14px',
                background: messageType === 'success' ? '#f0fdf4' : '#fef2f2',
                color: messageType === 'success' ? '#16a34a' : '#dc2626',
                border: '1px solid ' + (messageType === 'success' ? '#bbf7d0' : '#fecaca')
              }}>
                {message}
              </div>
            )}

            <button
              type="submit"
              className="btn-primary"
              disabled={uploading || selectedFiles.length === 0}
            >
              {uploading
                ? 'Uploading...'
                : 'Upload' + (selectedFiles.length > 0
                    ? ' (' + selectedFiles.length + ' file' + (selectedFiles.length > 1 ? 's' : '') + ')'
                    : '')}
            </button>

          </form>
        </div>
      </div>
    </div>
  );
}

export default FileUpload;
