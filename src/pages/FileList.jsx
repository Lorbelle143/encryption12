import React, { useEffect, useState, useCallback } from 'react';
import { useHistory } from 'react-router-dom';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import { supabase } from '../lib/supabase';
import { uploadFile, getFileUrl, deleteFileFromStorage, getFileName, decodeFileRef } from '../lib/storage';
import { useAuth } from '../hooks/useAuth';
import { verifyPassword, hashPassword } from '../lib/crypto';
import { addAuditEntry, getAuditLog, clearAuditLog } from '../lib/audit';
import './FileList.css';

const PAGE_SIZE = 12;

function FileList() {
  const { isAdmin, loading: authLoading } = useAuth();
  const history = useHistory();
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedFolder, setSelectedFolder] = useState(null);
  const [passwordInput, setPasswordInput] = useState('');
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editFolder, setEditFolder] = useState(null);
  const [editFolderName, setEditFolderName] = useState('');
  const [editNotes, setEditNotes] = useState('');
  const [editClassification, setEditClassification] = useState('');
  const [editNewPassword, setEditNewPassword] = useState('');
  const [editLoading, setEditLoading] = useState(false);
  const [addFiles, setAddFiles] = useState([]);
  const [addingFiles, setAddingFiles] = useState(false);
  const [viewMode, setViewMode] = useState('list');
  const [mainViewMode, setMainViewMode] = useState('list');
  const [searchTerm, setSearchTerm] = useState('');
  const [modalSearchTerm, setModalSearchTerm] = useState('');
  const [showArchived, setShowArchived] = useState(false);
  const [sortBy, setSortBy] = useState('date');
  const [sortDir, setSortDir] = useState('desc');
  const [page, setPage] = useState(1);
  // Preview
  const [previewUrl, setPreviewUrl] = useState(null);
  const [previewType, setPreviewType] = useState(null);
  const [previewName, setPreviewName] = useState('');
  const [previewLoading, setPreviewLoading] = useState(false);
  // ZIP download
  const [zipping, setZipping] = useState(false);
  // Audit log modal
  const [showAuditLog, setShowAuditLog] = useState(false);
  const [auditLog, setAuditLog] = useState([]);
  // Rename
  const [renamingFile, setRenamingFile] = useState(null);
  const [renameValue, setRenameValue] = useState('');
  // Bulk select
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [bulkLoading, setBulkLoading] = useState(false);
  // Edit modal show/hide password
  const [showEditPw, setShowEditPw] = useState(false);

  const fetchFiles = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('folders')
      .select('*')
      .order('created_at', { ascending: false });
    if (!error) setFiles(data);
    setLoading(false);
  };

  const activeFiles = files.filter(f => !f.is_archived);
  const archivedFiles = files.filter(f => f.is_archived);

  useEffect(() => {
    if (authLoading) return;
    if (!isAdmin()) { history.push('/dashboard'); } else { fetchFiles(); }
  }, [authLoading]);

  // Reset page when search/sort/archive changes
  useEffect(() => { setPage(1); }, [searchTerm, sortBy, sortDir, showArchived]);

  const getFileIcon = (fileName) => {
    const ext = fileName.split('.').pop().toLowerCase();
    if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext)) return '🖼️';
    return '📄';
  };

  const openFolder = (folder) => {
    setSelectedFolder(folder);
    setShowPasswordModal(true);
    setPasswordInput('');
    setPasswordError('');
    setIsUnlocked(false);
    setPreviewUrl(null);
    setPreviewType(null);
  };

  const openEditModal = (folder) => {
    setEditFolder(folder);
    setEditFolderName(folder.folder_name);
    setEditNotes(folder.notes || '');
    setEditClassification(folder.classification);
    setEditNewPassword('');
    setShowEditPw(false);
    setShowEditModal(true);
  };

  const handleEditSubmit = async () => {
    setEditLoading(true);
    try {
      const updates = { folder_name: editFolderName, notes: editNotes, classification: editClassification };
      if (editNewPassword.trim()) {
        updates.folder_password = await hashPassword(editNewPassword.trim());
      }
      const { error } = await supabase.from('folders').update(updates).eq('id', editFolder.id);
      if (error) throw error;
      addAuditEntry('Edit Folder', editFolder.folder_name);
      setShowEditModal(false);
      fetchFiles();
      alert('Folder updated successfully!');
    } catch (error) {
      alert('Error updating folder: ' + error.message);
    } finally {
      setEditLoading(false);
    }
  };

  const verifyFolderPassword = async () => {
    const isHash = /^[a-f0-9]{64}$/.test(selectedFolder.folder_password);
    const match = isHash
      ? await verifyPassword(passwordInput, selectedFolder.folder_password)
      : passwordInput === selectedFolder.folder_password;
    if (match) {
      setPasswordError('');
      setIsUnlocked(true);
      addAuditEntry('Opened Folder', selectedFolder.folder_name);
    } else {
      setPasswordError('Incorrect password');
      setIsUnlocked(false);
    }
  };

  const handleAddFiles = (e) => {
    const selectedFiles = Array.from(e.target.files);
    if (selectedFiles.length === 0) return;
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    const invalid = selectedFiles.filter(f => !allowedTypes.includes(f.type) || f.size > 10 * 1024 * 1024);
    if (invalid.length > 0) { alert('Files must be PDF or image and less than 10MB each'); return; }
    setAddFiles(selectedFiles);
  };

  const uploadAdditionalFiles = async () => {
    if (addFiles.length === 0) { alert('Please select files to add'); return; }
    setAddingFiles(true);
    try {
      const uploadedFiles = [];
      for (const file of addFiles) {
        const { ref } = await uploadFile(file, selectedFolder.folder_name);
        uploadedFiles.push(ref);
      }
      const updatedFileUrls = [...selectedFolder.file_urls, ...uploadedFiles];
      const { error: dbError } = await supabase.from('folders').update({ file_urls: updatedFileUrls, file_count: updatedFileUrls.length }).eq('id', selectedFolder.id);
      if (dbError) throw dbError;
      addAuditEntry('Added Files', `${addFiles.length} file(s) to "${selectedFolder.folder_name}"`);
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

  const downloadFile = async (fileUrl) => {
    try {
      const { url, isBlob } = await getFileUrl(fileUrl);
      const a = document.createElement('a');
      a.href = url;
      a.download = getFileName(fileUrl);
      a.target = '_blank';
      a.click();
      if (isBlob) URL.revokeObjectURL(url);
      addAuditEntry('Downloaded File', getFileName(fileUrl));
    } catch (error) {
      alert('Error downloading file: ' + error.message);
    }
  };

  const downloadAllAsZip = async () => {
    if (!selectedFolder || selectedFolder.file_urls.length === 0) return;
    setZipping(true);
    try {
      const zip = new JSZip();
      for (const fileUrl of selectedFolder.file_urls) {
        const { url, isBlob } = await getFileUrl(fileUrl);
        const res = await fetch(url);
        const blob = await res.blob();
        zip.file(getFileName(fileUrl), blob);
        if (isBlob) URL.revokeObjectURL(url);
      }
      const blob = await zip.generateAsync({ type: 'blob' });
      saveAs(blob, `${selectedFolder.folder_name}.zip`);
      addAuditEntry('Downloaded ZIP', selectedFolder.folder_name);
    } catch (error) {
      alert('Error creating ZIP: ' + error.message);
    } finally {
      setZipping(false);
    }
  };

  const viewFile = async (fileUrl) => {
    setPreviewLoading(true);
    setPreviewName(getFileName(fileUrl));
    try {
      const { url, isBlob } = await getFileUrl(fileUrl);
      if (previewUrl && previewUrl.startsWith('blob:')) URL.revokeObjectURL(previewUrl);
      setPreviewUrl(url);
      const name = getFileName(fileUrl);
      const ext = name.split('.').pop().toLowerCase();
      setPreviewType(['jpg','jpeg','png','gif','webp'].includes(ext) ? 'image' : 'pdf');
      addAuditEntry('Viewed File', name);
    } catch (error) {
      alert('Error loading file: ' + error.message);
    } finally {
      setPreviewLoading(false);
    }
  };

  const closePreview = () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
    setPreviewType(null);
    setPreviewName('');
  };

  // Get display name — uses custom_names map if set, else original filename
  const getDisplayName = (fileUrl) => {
    const customNames = selectedFolder?.custom_names || {};
    return customNames[fileUrl] || getFileName(fileUrl);
  };

  const getProviderBadge = (fileUrl) => {
    const ref = decodeFileRef(fileUrl);
    return ref.provider === 'cloudinary'
      ? <span style={{ fontSize: '10px', background: '#e0f2fe', color: '#0369a1', borderRadius: '4px', padding: '1px 5px', fontWeight: '600', marginLeft: '6px' }}>☁ CDN</span>
      : <span style={{ fontSize: '10px', background: '#f0fdf4', color: '#15803d', borderRadius: '4px', padding: '1px 5px', fontWeight: '600', marginLeft: '6px' }}>SB</span>;
  };

  const startRename = (fileUrl) => {
    setRenamingFile(fileUrl);
    setRenameValue(getDisplayName(fileUrl));
  };

  const submitRename = async (fileUrl) => {
    const newName = renameValue.trim();
    if (!newName || newName === getDisplayName(fileUrl)) { setRenamingFile(null); return; }
    try {
      const updatedNames = { ...(selectedFolder.custom_names || {}), [fileUrl]: newName };
      const { error } = await supabase.from('folders').update({ custom_names: updatedNames }).eq('id', selectedFolder.id);
      if (error) throw error;
      addAuditEntry('Renamed File', `"${fileUrl.split('/').pop()}" → "${newName}"`);
      setSelectedFolder({ ...selectedFolder, custom_names: updatedNames });
      fetchFiles();
    } catch (err) {
      alert('Error renaming file: ' + err.message);
    } finally {
      setRenamingFile(null);
    }
  };

  const filteredModalFiles = selectedFolder
    ? selectedFolder.file_urls.filter(u => u.split('/').pop().toLowerCase().includes(modalSearchTerm.toLowerCase()))
    : [];

  const deleteFile = async (folderId) => {
    if (!window.confirm('Archive this folder? You can restore it later.')) return;
    try {
      const { error } = await supabase.from('folders').update({ is_archived: true, archived_at: new Date().toISOString() }).eq('id', folderId);
      if (error) throw error;
      addAuditEntry('Archived Folder', files.find(f => f.id === folderId)?.folder_name || folderId);
      fetchFiles();
    } catch (error) { alert('Error archiving folder: ' + error.message); }
  };

  const restoreFolder = async (folderId) => {
    try {
      const { error } = await supabase.from('folders').update({ is_archived: false, archived_at: null }).eq('id', folderId);
      if (error) throw error;
      addAuditEntry('Restored Folder', files.find(f => f.id === folderId)?.folder_name || folderId);
      fetchFiles();
    } catch (error) { alert('Error restoring folder: ' + error.message); }
  };

  const permanentDelete = async (folderId, fileUrls) => {
    if (!window.confirm('Permanently delete this folder and all its files? This cannot be undone.')) return;
    try {
      if (fileUrls && fileUrls.length > 0) {
        for (const ref of fileUrls) await deleteFileFromStorage(ref);
      }
      const { error } = await supabase.from('folders').delete().eq('id', folderId);
      if (error) throw error;
      addAuditEntry('Permanently Deleted Folder', folderId);
      fetchFiles();
    } catch (error) { alert('Error deleting folder: ' + error.message); }
  };

  const deleteIndividualFile = async (fileUrl) => {
    if (!window.confirm(`Archive "${fileUrl.split('/').pop()}"? You can restore it later.`)) return;
    try {
      const updatedUrls = selectedFolder.file_urls.filter(u => u !== fileUrl);
      const updatedArchived = [...(selectedFolder.archived_file_urls || []), fileUrl];
      const { error } = await supabase.from('folders').update({ file_urls: updatedUrls, file_count: updatedUrls.length, archived_file_urls: updatedArchived }).eq('id', selectedFolder.id);
      if (error) throw error;
      addAuditEntry('Archived File', fileUrl.split('/').pop());
      setSelectedFolder({ ...selectedFolder, file_urls: updatedUrls, file_count: updatedUrls.length, archived_file_urls: updatedArchived });
      fetchFiles();
    } catch (error) { alert('Error archiving file: ' + error.message); }
  };

  const restoreIndividualFile = async (fileUrl) => {
    try {
      const updatedArchived = (selectedFolder.archived_file_urls || []).filter(u => u !== fileUrl);
      const updatedUrls = [...selectedFolder.file_urls, fileUrl];
      const { error } = await supabase.from('folders').update({ file_urls: updatedUrls, file_count: updatedUrls.length, archived_file_urls: updatedArchived }).eq('id', selectedFolder.id);
      if (error) throw error;
      addAuditEntry('Restored File', fileUrl.split('/').pop());
      setSelectedFolder({ ...selectedFolder, file_urls: updatedUrls, file_count: updatedUrls.length, archived_file_urls: updatedArchived });
      fetchFiles();
    } catch (error) { alert('Error restoring file: ' + error.message); }
  };

  const permanentDeleteIndividualFile = async (fileUrl) => {
    if (!window.confirm(`Permanently delete "${getFileName(fileUrl)}"? This cannot be undone.`)) return;
    try {
      await deleteFileFromStorage(fileUrl);
      const updatedArchived = (selectedFolder.archived_file_urls || []).filter(u => u !== fileUrl);
      const { error } = await supabase.from('folders').update({ archived_file_urls: updatedArchived }).eq('id', selectedFolder.id);
      if (error) throw error;
      addAuditEntry('Permanently Deleted File', getFileName(fileUrl));
      setSelectedFolder({ ...selectedFolder, archived_file_urls: updatedArchived });
      fetchFiles();
    } catch (error) { alert('Error deleting file: ' + error.message); }
  };

  const handleSort = (field) => {
    if (sortBy === field) { setSortDir(d => d === 'asc' ? 'desc' : 'asc'); }
    else { setSortBy(field); setSortDir('asc'); }
  };

  const toggleSelect = (id) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const selectAll = () => {
    if (selectedIds.size === pagedFiles.length) { setSelectedIds(new Set()); }
    else { setSelectedIds(new Set(pagedFiles.map(f => f.id))); }
  };

  const bulkArchive = async () => {
    if (selectedIds.size === 0) return;
    if (!window.confirm(`Archive ${selectedIds.size} folder(s)?`)) return;
    setBulkLoading(true);
    try {
      const ids = Array.from(selectedIds);
      const { error } = await supabase.from('folders')
        .update({ is_archived: true, archived_at: new Date().toISOString() })
        .in('id', ids);
      if (error) throw error;
      addAuditEntry('Bulk Archive', `${ids.length} folder(s)`);
      setSelectedIds(new Set());
      fetchFiles();
    } catch (err) { alert('Error: ' + err.message); }
    finally { setBulkLoading(false); }
  };

  const printManifest = (folder) => {
    const customNames = folder.custom_names || {};
    const lines = (folder.file_urls || []).map((u, i) =>
      `${i + 1}. ${customNames[u] || u.split('/').pop()}`
    ).join('\n');
    const win = window.open('', '_blank');
    win.document.write(`
      <html><head><title>${folder.folder_name} — File Manifest</title>
      <style>body{font-family:Arial,sans-serif;padding:32px;max-width:700px;margin:0 auto}
      h1{font-size:22px;margin-bottom:4px}p{color:#666;font-size:13px;margin:0 0 24px}
      pre{font-size:14px;line-height:2;white-space:pre-wrap}
      .meta{display:flex;gap:24px;margin-bottom:20px;font-size:13px;color:#555}
      </style></head><body>
      <h1>${folder.folder_name}</h1>
      <div class="meta">
        <span>Classification: <strong>${folder.classification}</strong></span>
        <span>Files: <strong>${folder.file_count}</strong></span>
        <span>Created: <strong>${new Date(folder.created_at).toLocaleDateString()}</strong></span>
      </div>
      ${folder.notes ? `<p>Notes: ${folder.notes}</p>` : ''}
      <pre>${lines}</pre>
      <p style="margin-top:32px;font-size:12px;color:#aaa">Printed: ${new Date().toLocaleString()}</p>
      <script>window.print();</script>
      </body></html>
    `);
    win.document.close();
  };

  const sortedFilteredFiles = [...(showArchived ? archivedFiles : activeFiles)]
    .filter(folder =>
      folder.folder_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (folder.notes && folder.notes.toLowerCase().includes(searchTerm.toLowerCase())) ||
      folder.classification.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => {
      let valA, valB;
      if (sortBy === 'name') { valA = a.folder_name.toLowerCase(); valB = b.folder_name.toLowerCase(); }
      else if (sortBy === 'classification') { valA = a.classification; valB = b.classification; }
      else if (sortBy === 'count') { valA = a.file_count; valB = b.file_count; }
      else { valA = new Date(a.created_at); valB = new Date(b.created_at); }
      if (valA < valB) return sortDir === 'asc' ? -1 : 1;
      if (valA > valB) return sortDir === 'asc' ? 1 : -1;
      return 0;
    });

  const totalPages = Math.ceil(sortedFilteredFiles.length / PAGE_SIZE);
  const pagedFiles = sortedFilteredFiles.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <div className="page">
      <header className="header">
        <button type="button" onClick={() => history.push('/dashboard')} className="btn-back">← Back</button>
        <h1>Files</h1>
        <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
          <button onClick={async () => { setAuditLog(await getAuditLog()); setShowAuditLog(true); }} className="btn-secondary btn-small" title="Audit Log">📋 Log</button>
          <button onClick={() => setShowArchived(!showArchived)} className="btn-secondary btn-small" style={{ marginRight: '8px' }}>
            {showArchived ? '📂 Active' : `🗄️ Archived${archivedFiles.length > 0 ? ` (${archivedFiles.length})` : ''}`}
          </button>
          <button onClick={() => setMainViewMode('list')} className={`btn-view-toggle ${mainViewMode === 'list' ? 'active' : ''}`} title="List View">☰</button>
          <button onClick={() => setMainViewMode('grid')} className={`btn-view-toggle ${mainViewMode === 'grid' ? 'active' : ''}`} title="Grid View">⊞</button>
        </div>
      </header>

      <div className="search-container">
        <div className="search-bar">
          <span className="search-icon">🔍</span>
          <input type="text" placeholder="Search folders by name, notes, or classification..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="search-input" />
          {searchTerm && <button onClick={() => setSearchTerm('')} className="search-clear">✕</button>}
        </div>
        <div className="sort-bar">
          <span style={{ fontSize: '13px', color: '#666', marginRight: '8px' }}>Sort:</span>
          {[['date','Date'],['name','Name'],['classification','Classification'],['count','Files']].map(([field, label]) => (
            <button key={field} onClick={() => handleSort(field)} className={`sort-btn ${sortBy === field ? 'active' : ''}`}>
              {label} {sortBy === field ? (sortDir === 'asc' ? '↑' : '↓') : ''}
            </button>
          ))}
        </div>
        {searchTerm && <div className="search-results-info">{sortedFilteredFiles.length} of {files.length} folders found</div>}
      </div>

      <div className="content">
        {loading ? (
          <div className="loading-container"><div className="spinner"></div></div>
        ) : pagedFiles.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📄</div>
            <h2>{searchTerm ? 'No Files Found' : (showArchived ? 'No Archived Files' : 'No Files Yet')}</h2>
            <p>{searchTerm ? `No folders match "${searchTerm}"` : (showArchived ? 'Deleted folders will appear here' : 'Upload your first document to get started')}</p>
          </div>
        ) : (
          <>
            <div className={`files-list ${mainViewMode}`}>
              {mainViewMode === 'list' ? (
                <>
                  {/* Bulk toolbar */}
                  {!showArchived && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 0', marginBottom: '4px' }}>
                      <input type="checkbox" checked={selectedIds.size === pagedFiles.length && pagedFiles.length > 0}
                        onChange={selectAll} style={{ width: '16px', height: '16px', cursor: 'pointer' }} />
                      <span style={{ fontSize: '13px', color: '#666' }}>{selectedIds.size > 0 ? `${selectedIds.size} selected` : 'Select all'}</span>
                      {selectedIds.size > 0 && (
                        <button onClick={bulkArchive} disabled={bulkLoading} className="btn-danger" style={{ padding: '5px 14px', fontSize: '12px' }}>
                          {bulkLoading ? 'Archiving...' : `🗄️ Archive (${selectedIds.size})`}
                        </button>
                      )}
                    </div>
                  )}
                  {pagedFiles.map((folder) => (
                  <div key={folder.id} className="file-item" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    {!showArchived && (
                      <input type="checkbox" checked={selectedIds.has(folder.id)}
                        onChange={() => toggleSelect(folder.id)}
                        style={{ width: '16px', height: '16px', cursor: 'pointer', flexShrink: 0 }} />
                    )}
                    <div className="file-info" style={{ flex: 1 }}>
                      <div className="file-header">
                        <span className="file-icon-large">📁</span>
                        <div>
                          <h3>{folder.folder_name}</h3>
                          <p>{folder.file_count} file(s){folder.archived_file_urls?.length > 0 ? ` · ${folder.archived_file_urls.length} archived` : ''}</p>
                        </div>
                      </div>
                      <div className="file-meta">
                        <span className="file-date">{new Date(folder.created_at).toLocaleDateString()}</span>
                      </div>
                      {folder.notes && <p className="folder-notes">{folder.notes}</p>}
                    </div>
                    <div className="file-actions">
                      <span className={`badge badge-${folder.classification.toLowerCase()}`}>{folder.classification}</span>
                      {showArchived ? (
                        <>
                          <button onClick={() => restoreFolder(folder.id)} className="btn-view">♻️ Restore</button>
                          <button onClick={() => permanentDelete(folder.id, folder.file_urls)} className="btn-danger">🗑️ Delete</button>
                        </>
                      ) : (
                        <>
                          <button onClick={() => openFolder(folder)} className="btn-view">🔓 Open</button>
                          <button onClick={() => printManifest(folder)} className="btn-secondary" title="Print manifest">🖨️</button>
                          <button onClick={() => openEditModal(folder)} className="btn-secondary">✏️ Edit</button>
                          <button onClick={() => deleteFile(folder.id)} className="btn-danger">🗑️</button>
                        </>
                      )}
                    </div>
                  </div>
                  ))}
                </>
              ) : (
                <div className="files-grid">
                  {pagedFiles.map((folder) => (
                    <div key={folder.id} className="file-card">
                      <div className="file-card-header">
                        <span className="file-icon-xl">📁</span>
                        <span className={`badge badge-${folder.classification.toLowerCase()}`}>{folder.classification}</span>
                      </div>
                      <div className="file-card-content">
                        <h3>{folder.folder_name}</h3>
                        <p className="file-count">{folder.file_count} file(s)</p>
                        <p className="file-date">{new Date(folder.created_at).toLocaleDateString()}</p>
                        {folder.notes && <p className="folder-notes-grid">{folder.notes}</p>}
                      </div>
                      <div className="file-card-actions">
                        {showArchived ? (
                          <div className="btn-group">
                            <button onClick={() => restoreFolder(folder.id)} className="btn-view btn-small">♻️</button>
                            <button onClick={() => permanentDelete(folder.id, folder.file_urls)} className="btn-danger btn-small">🗑️</button>
                          </div>
                        ) : (
                          <>
                            <button onClick={() => openFolder(folder)} className="btn-view btn-full">🔓 Open</button>
                            <div className="btn-group">
                              <button onClick={() => openEditModal(folder)} className="btn-secondary btn-small">✏️</button>
                              <button onClick={() => deleteFile(folder.id)} className="btn-danger btn-small">🗑️</button>
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="pagination">
                <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="page-btn">← Prev</button>
                <span className="page-info">Page {page} of {totalPages}</span>
                <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="page-btn">Next →</button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Folder Password / Files Modal */}
      {showPasswordModal && selectedFolder && (
        <div className="modal-overlay" onClick={() => { setShowPasswordModal(false); closePreview(); }}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>🔒 Enter Password</h2>
            <p>This folder is password protected</p>
            <p><strong>{selectedFolder.folder_name}</strong></p>

            {!isUnlocked && (
              <>
                <div className="form-group" style={{ marginTop: '20px' }}>
                  <input type="password" value={passwordInput} onChange={(e) => setPasswordInput(e.target.value)}
                    placeholder="Enter folder password" onKeyPress={(e) => e.key === 'Enter' && verifyFolderPassword()} autoFocus />
                </div>
                {passwordError && <div className="message" style={{ color: '#eb445a', marginTop: '10px' }}>{passwordError}</div>}
                <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
                  <button onClick={verifyFolderPassword} className="btn-primary">Unlock</button>
                  <button onClick={() => setShowPasswordModal(false)} className="btn-secondary">Cancel</button>
                </div>
              </>
            )}

            {isUnlocked && (
              <div style={{ marginTop: '20px', borderTop: '1px solid #ddd', paddingTop: '20px' }}>
                {/* Header row */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '8px' }}>
                  <h3>Files ({selectedFolder.file_urls.length})</h3>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <div style={{ display: 'flex', gap: '4px' }}>
                      <button onClick={() => setViewMode('list')} className={`btn-view-toggle ${viewMode === 'list' ? 'active' : ''}`}>☰</button>
                      <button onClick={() => setViewMode('grid')} className={`btn-view-toggle ${viewMode === 'grid' ? 'active' : ''}`}>⊞</button>
                    </div>
                    <button onClick={downloadAllAsZip} className="btn-primary" disabled={zipping} style={{ padding: '8px 16px', fontSize: '13px' }}>
                      {zipping ? 'Zipping...' : '⬇️ Download ZIP'}
                    </button>
                  </div>
                </div>

                {/* Modal search */}
                <div className="modal-search-container">
                  <div className="modal-search-bar">
                    <span className="search-icon">🔍</span>
                    <input type="text" placeholder="Search files..." value={modalSearchTerm} onChange={(e) => setModalSearchTerm(e.target.value)} className="search-input" />
                    {modalSearchTerm && <button onClick={() => setModalSearchTerm('')} className="search-clear">✕</button>}
                  </div>
                </div>

                {/* Inline preview panel */}
                {(previewUrl || previewLoading) && (
                  <div className="preview-panel">
                    <div className="preview-header">
                      <span className="preview-name">{previewName}</span>
                      <button onClick={closePreview} className="preview-close">✕ Close</button>
                    </div>
                    {previewLoading ? (
                      <div className="preview-loading"><div className="spinner"></div></div>
                    ) : previewType === 'image' ? (
                      <img src={previewUrl} alt={previewName} className="preview-image" />
                    ) : (
                      <iframe src={previewUrl} title={previewName} className="preview-pdf" />
                    )}
                  </div>
                )}

                {/* File list */}
                <div style={{ maxHeight: '400px', overflowY: 'auto', border: '1px solid #ddd', borderRadius: '8px', background: '#f9f9f9', marginBottom: '20px' }}>
                  {viewMode === 'list' ? (
                    filteredModalFiles.map((fileUrl, index) => (
                      <div key={index} style={{ padding: '12px 16px', borderBottom: index < filteredModalFiles.length - 1 ? '1px solid #e0e0e0' : 'none', background: 'white' }}
                        onMouseEnter={(e) => e.currentTarget.style.background = '#f5f5f5'}
                        onMouseLeave={(e) => e.currentTarget.style.background = 'white'}>
                        {renamingFile === fileUrl ? (
                          <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                            <input autoFocus value={renameValue} onChange={(e) => setRenameValue(e.target.value)}
                              onKeyDown={(e) => { if (e.key === 'Enter') submitRename(fileUrl); if (e.key === 'Escape') setRenamingFile(null); }}
                              style={{ flex: 1, padding: '6px 10px', border: '1.5px solid #3b82f6', borderRadius: '6px', fontSize: '13px' }} />
                            <button onClick={() => submitRename(fileUrl)} className="btn-view" style={{ padding: '6px 12px', fontSize: '12px' }}>Save</button>
                            <button onClick={() => setRenamingFile(null)} className="btn-secondary" style={{ padding: '6px 10px', fontSize: '12px' }}>✕</button>
                          </div>
                        ) : (
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontSize: '14px', fontWeight: '500' }}>{getFileIcon(getFileName(fileUrl))} {getDisplayName(fileUrl)}{getProviderBadge(fileUrl)}</span>
                            <div style={{ display: 'flex', gap: '6px' }}>
                              <button onClick={() => viewFile(fileUrl)} className="btn-view" style={{ padding: '6px 10px', fontSize: '12px' }}>👁️</button>
                              <button onClick={() => downloadFile(fileUrl)} className="btn-secondary" style={{ padding: '6px 10px', fontSize: '12px' }}>⬇️</button>
                              <button onClick={() => startRename(fileUrl)} className="btn-secondary" style={{ padding: '6px 10px', fontSize: '12px' }}>✏️</button>
                              <button onClick={() => deleteIndividualFile(fileUrl)} className="btn-danger" style={{ padding: '6px 10px', fontSize: '12px' }}>🗑️</button>
                            </div>
                          </div>
                        )}
                      </div>
                    ))
                  ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '12px', padding: '12px' }}>
                      {filteredModalFiles.map((fileUrl, index) => (
                        <div key={index} style={{ background: 'white', borderRadius: '8px', padding: '12px', textAlign: 'center', border: '1px solid #e0e0e0' }}>
                          <div style={{ fontSize: '40px', marginBottom: '8px' }}>{getFileIcon(getFileName(fileUrl))}</div>
                          <div style={{ fontSize: '12px', fontWeight: '500', marginBottom: '8px', wordBreak: 'break-word', lineHeight: '1.3' }}>{getDisplayName(fileUrl)}{getProviderBadge(fileUrl)}</div>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                            <button onClick={() => viewFile(fileUrl)} className="btn-view" style={{ padding: '5px', fontSize: '11px', width: '100%' }}>👁️ Preview</button>
                            <button onClick={() => downloadFile(fileUrl)} className="btn-secondary" style={{ padding: '5px', fontSize: '11px', width: '100%' }}>⬇️ Download</button>
                            <button onClick={() => startRename(fileUrl)} className="btn-secondary" style={{ padding: '5px', fontSize: '11px', width: '100%' }}>✏️ Rename</button>
                            <button onClick={() => deleteIndividualFile(fileUrl)} className="btn-danger" style={{ padding: '5px', fontSize: '11px', width: '100%' }}>🗑️ Archive</button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Archived files */}
                {selectedFolder.archived_file_urls && selectedFolder.archived_file_urls.length > 0 && (
                  <div style={{ borderTop: '1px solid #ddd', paddingTop: '16px', marginBottom: '16px' }}>
                    <h4 style={{ color: '#888', marginBottom: '10px' }}>🗄️ Archived Files ({selectedFolder.archived_file_urls.length})</h4>
                    {selectedFolder.archived_file_urls.map((fileUrl, index) => (
                      <div key={index} style={{ padding: '10px 14px', borderBottom: index < selectedFolder.archived_file_urls.length - 1 ? '1px solid #eee' : 'none', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#fafafa', borderRadius: '6px', marginBottom: '4px' }}>
                        <span style={{ fontSize: '13px', color: '#888' }}>{getFileIcon(getFileName(fileUrl))} {getFileName(fileUrl)}</span>
                        <div style={{ display: 'flex', gap: '6px' }}>
                          <button onClick={() => restoreIndividualFile(fileUrl)} className="btn-view" style={{ padding: '5px 10px', fontSize: '12px' }}>♻️ Restore</button>
                          <button onClick={() => permanentDeleteIndividualFile(fileUrl)} className="btn-danger" style={{ padding: '5px 10px', fontSize: '12px' }}>🗑️</button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Add more files */}
                <div style={{ borderTop: '1px solid #ddd', paddingTop: '16px' }}>
                  <h4>Add More Files:</h4>
                  <input type="file" accept=".pdf,application/pdf,image/*" multiple onChange={handleAddFiles} disabled={addingFiles} style={{ marginTop: '10px', marginBottom: '10px' }} />
                  {addFiles.length > 0 && <div style={{ fontSize: '13px', color: '#666', marginBottom: '10px' }}>{addFiles.length} file(s) selected</div>}
                  <button onClick={uploadAdditionalFiles} className="btn-primary" disabled={addingFiles || addFiles.length === 0} style={{ padding: '8px 16px', fontSize: '13px' }}>
                    {addingFiles ? 'Uploading...' : '➕ Add Files'}
                  </button>
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
              <input type="text" value={editFolderName} onChange={(e) => setEditFolderName(e.target.value)} disabled={editLoading} />
            </div>
            <div className="form-group">
              <label>Classification Level</label>
              <select value={editClassification} onChange={(e) => setEditClassification(e.target.value)} disabled={editLoading}>
                <option value="PUBLIC">Public</option>
                <option value="INTERNAL">Internal</option>
                <option value="CONFIDENTIAL">Confidential</option>
                <option value="RESTRICTED">Restricted</option>
              </select>
            </div>
            <div className="form-group">
              <label>Notes</label>
              <textarea value={editNotes} onChange={(e) => setEditNotes(e.target.value)} rows="4" disabled={editLoading} />
            </div>
            <div className="form-group">
              <label>Change Password <span style={{ fontWeight: 400, color: '#999', fontSize: '12px' }}>(leave blank to keep current)</span></label>
              <div style={{ position: 'relative' }}>
                <input type={showEditPw ? 'text' : 'password'} value={editNewPassword}
                  onChange={(e) => setEditNewPassword(e.target.value)}
                  placeholder="Enter new password" disabled={editLoading}
                  style={{ paddingRight: '60px' }} />
                <button type="button" onClick={() => setShowEditPw(v => !v)}
                  style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', fontSize: '12px', color: '#888', fontWeight: '600' }}>
                  {showEditPw ? 'Hide' : 'Show'}
                </button>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
              <button onClick={handleEditSubmit} className="btn-primary" disabled={editLoading}>{editLoading ? 'Saving...' : 'Save Changes'}</button>
              <button onClick={() => setShowEditModal(false)} className="btn-secondary" disabled={editLoading}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* Audit Log Modal */}
      {showAuditLog && (
        <div className="modal-overlay" onClick={() => setShowAuditLog(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2>📋 Audit Log</h2>
              <button onClick={() => setShowAuditLog(false)} className="btn-secondary" style={{ padding: '6px 12px' }}>Close</button>
            </div>
            {auditLog.length === 0 ? (
              <p style={{ color: '#888', textAlign: 'center', padding: '40px 0' }}>No activity recorded yet.</p>
            ) : (
              <div style={{ maxHeight: '500px', overflowY: 'auto' }}>
                {auditLog.map((entry, i) => (
                  <div key={i} style={{ padding: '12px 0', borderBottom: i < auditLog.length - 1 ? '1px solid #eee' : 'none' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px' }}>
                      <div>
                        <span style={{ fontWeight: '600', fontSize: '14px', color: '#333' }}>{entry.action}</span>
                        <p style={{ margin: '2px 0 0', fontSize: '13px', color: '#666' }}>{entry.detail}</p>
                      </div>
                      <span style={{ fontSize: '12px', color: '#999', whiteSpace: 'nowrap', flexShrink: 0 }}>
                        {new Date(entry.time).toLocaleString()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
            {auditLog.length > 0 && (
              <button onClick={async () => { await clearAuditLog(); setAuditLog([]); }} className="btn-danger" style={{ marginTop: '16px', padding: '8px 16px', fontSize: '13px' }}>
                Clear Log
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default FileList;
