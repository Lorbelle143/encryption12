import React, { useEffect, useState } from 'react';
import { useHistory } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';
import './Masterlist.css';

const EMPTY_ROW = {
  records_title: '',
  code: '',
  type_of_records: 'Non-Confidential',
  mode_of_filing: 'Hard Copy',
  responsible_controller: '',
  storage_location: '',
  retention_active: '',
  retention_archive: '',
  retention_year: '',
  disposition_method: 'Recommendation from NAP thru the Records Office',
};

function Masterlist() {
  const { isAdmin, loading: authLoading } = useAuth();
  const history = useHistory();
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dbError, setDbError] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingRecord, setEditingRecord] = useState(null);
  const [form, setForm] = useState(EMPTY_ROW);
  const [saving, setSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  // Sorting
  const [sortBy, setSortBy] = useState('record_number');
  const [sortDir, setSortDir] = useState('asc');

  useEffect(() => {
    if (authLoading) return;
    if (!isAdmin()) history.push('/dashboard');
    else fetchRecords();
  }, [authLoading]);

  const fetchRecords = async () => {
    setLoading(true);
    setDbError(false);
    try {
      const { data, error } = await supabase
        .from('masterlist')
        .select('*')
        .order('record_number', { ascending: true });
      if (error) throw error;
      setRecords(data || []);
    } catch {
      setDbError(true);
    } finally {
      setLoading(false);
    }
  };

  const openAdd = () => {
    setEditingRecord(null);
    setForm(EMPTY_ROW);
    setShowModal(true);
  };

  const openEdit = (record) => {
    setEditingRecord(record);
    setForm({ ...record });
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingRecord(null);
  };

  const handleChange = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    if (!form.records_title.trim()) {
      alert('Records Title is required');
      return;
    }
    setSaving(true);
    try {
      if (editingRecord) {
        const { error } = await supabase
          .from('masterlist')
          .update({ ...form, updated_at: new Date().toISOString() })
          .eq('id', editingRecord.id);
        if (error) throw error;
      } else {
        const maxNo = records.length > 0 ? Math.max(...records.map(r => r.record_number || 0)) : 0;
        const { error } = await supabase
          .from('masterlist')
          .insert({ ...form, record_number: maxNo + 1 });
        if (error) throw error;
      }
      closeModal();
      fetchRecords();
    } catch (error) {
      alert('Error saving record: ' + error.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      const { error } = await supabase.from('masterlist').delete().eq('id', id);
      if (error) throw error;
      setDeleteConfirm(null);
      fetchRecords();
    } catch (error) {
      alert('Error deleting record: ' + error.message);
    }
  };

  const handleSort = (field) => {
    if (sortBy === field) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortBy(field); setSortDir('asc'); }
  };

  const SortIcon = ({ field }) => {
    if (sortBy !== field) return <span style={{ opacity: 0.3, fontSize: '10px' }}> ↕</span>;
    return <span style={{ fontSize: '10px' }}> {sortDir === 'asc' ? '↑' : '↓'}</span>;
  };

  const filtered = records
    .filter(r =>
      r.records_title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.type_of_records?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.storage_location?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.code?.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => {
      let va = a[sortBy] ?? '';
      let vb = b[sortBy] ?? '';
      if (typeof va === 'string') va = va.toLowerCase();
      if (typeof vb === 'string') vb = vb.toLowerCase();
      if (va < vb) return sortDir === 'asc' ? -1 : 1;
      if (va > vb) return sortDir === 'asc' ? 1 : -1;
      return 0;
    });

  // Print the masterlist table
  const handlePrint = () => {
    const rows = filtered.map((rec, i) => `
      <tr style="background:${i % 2 === 0 ? '#fff' : '#f8fafc'}">
        <td style="text-align:center;padding:8px 6px;border:1px solid #e2e8f0">${rec.record_number ?? ''}</td>
        <td style="padding:8px 6px;border:1px solid #e2e8f0;font-weight:600">${rec.records_title ?? ''}</td>
        <td style="text-align:center;padding:8px 6px;border:1px solid #e2e8f0">${rec.code ?? ''}</td>
        <td style="text-align:center;padding:8px 6px;border:1px solid #e2e8f0">${rec.type_of_records ?? ''}</td>
        <td style="text-align:center;padding:8px 6px;border:1px solid #e2e8f0">${rec.mode_of_filing ?? ''}</td>
        <td style="padding:8px 6px;border:1px solid #e2e8f0">${rec.responsible_controller ?? ''}</td>
        <td style="text-align:center;padding:8px 6px;border:1px solid #e2e8f0">${rec.storage_location ?? ''}</td>
        <td style="text-align:center;padding:8px 6px;border:1px solid #e2e8f0">${rec.retention_active ?? ''}</td>
        <td style="text-align:center;padding:8px 6px;border:1px solid #e2e8f0">${rec.retention_archive ?? ''}</td>
        <td style="text-align:center;padding:8px 6px;border:1px solid #e2e8f0">${rec.retention_year ?? ''}</td>
        <td style="padding:8px 6px;border:1px solid #e2e8f0">${rec.disposition_method ?? ''}</td>
      </tr>
    `).join('');

    const win = window.open('', '_blank');
    win.document.write(`
      <html>
      <head>
        <title>Masterlist of Internal Records</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 24px; font-size: 11px; color: #0f172a; }
          h1 { font-size: 16px; font-weight: 800; margin: 0 0 2px; }
          .sub { font-size: 12px; color: #64748b; margin: 0 0 16px; }
          table { width: 100%; border-collapse: collapse; }
          thead tr { background: #1e3a8a; color: white; }
          thead th { padding: 9px 6px; text-align: center; border: 1px solid #1e40af; font-size: 11px; }
          .meta { font-size: 11px; color: #64748b; margin-top: 16px; }
        </style>
      </head>
      <body>
        <h1>Masterlist of Internal Records</h1>
        <p class="sub">NBSC Guidance Counseling Office &mdash; Printed: ${new Date().toLocaleString()}</p>
        <table>
          <thead>
            <tr>
              <th>No.</th><th>Records Title</th><th>Code</th><th>Type</th><th>Mode</th>
              <th>Responsible Controller</th><th>Storage</th><th>Active</th><th>Archive</th><th>Year</th><th>Disposition</th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
        <p class="meta">Total records: ${filtered.length}</p>
        <script>window.print();</script>
      </body>
      </html>
    `);
    win.document.close();
  };

  // Export to CSV
  const handleExportCSV = () => {
    const headers = ['No.','Records Title','Code','Type of Records','Mode of Filing','Responsible Controller','Storage/Location','Retention Active','Retention Archive','Year','Disposition Method'];
    const rows = filtered.map(r => [
      r.record_number ?? '',
      `"${(r.records_title ?? '').replace(/"/g, '""')}"`,
      r.code ?? '',
      r.type_of_records ?? '',
      r.mode_of_filing ?? '',
      `"${(r.responsible_controller ?? '').replace(/"/g, '""')}"`,
      `"${(r.storage_location ?? '').replace(/"/g, '""')}"`,
      r.retention_active ?? '',
      r.retention_archive ?? '',
      r.retention_year ?? '',
      `"${(r.disposition_method ?? '').replace(/"/g, '""')}"`
    ].join(','));
    const csv = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Masterlist_${new Date().toISOString().slice(0,10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="page">
      <header className="header masterlist-header">
        <button type="button" onClick={() => history.push('/dashboard')} className="btn-back">← Back</button>
        <h1>Masterlist of Internal Records</h1>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <button onClick={handleExportCSV} className="btn-secondary btn-small" title="Export to CSV" style={{ color: 'rgba(255,255,255,0.9)', borderColor: 'rgba(255,255,255,0.25)', background: 'rgba(255,255,255,0.1)' }}>
            📥 CSV
          </button>
          <button onClick={handlePrint} className="btn-secondary btn-small" title="Print / Export PDF" style={{ color: 'rgba(255,255,255,0.9)', borderColor: 'rgba(255,255,255,0.25)', background: 'rgba(255,255,255,0.1)' }}>
            🖨️ Print
          </button>
          <button onClick={openAdd} className="btn-primary">+ Add Record</button>
        </div>
      </header>

      {/* Search */}
      <div className="search-container">
        <div className="search-bar">
          <span className="search-icon">🔍</span>
          <input
            type="text"
            placeholder="Search by title, type, location, or code..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
          {searchTerm && <button onClick={() => setSearchTerm('')} className="search-clear">✕</button>}
        </div>
        {searchTerm && <div className="search-results-info">{filtered.length} of {records.length} records found</div>}
      </div>

      <div className="content masterlist-content">
        {/* DB Error banner */}
        {dbError && (
          <div style={{
            background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '10px',
            padding: '14px 18px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '10px'
          }}>
            <span style={{ fontSize: '20px' }}>⚠️</span>
            <div>
              <p style={{ margin: 0, fontWeight: '700', color: '#dc2626', fontSize: '14px' }}>Could not load masterlist</p>
              <p style={{ margin: '2px 0 0', color: '#ef4444', fontSize: '12px' }}>Check your Supabase connection or project status.</p>
            </div>
            <button onClick={fetchRecords} style={{ marginLeft: 'auto', background: '#dc2626', color: 'white', border: 'none', borderRadius: '7px', padding: '7px 14px', fontSize: '12px', fontWeight: '700', cursor: 'pointer' }}>Retry</button>
          </div>
        )}

        {loading ? (
          <div className="loading-container"><div className="spinner"></div></div>
        ) : (
          <div className="masterlist-table-wrap">
            <table className="masterlist-table">
              <thead>
                <tr>
                  <th className="col-no" onClick={() => handleSort('record_number')} style={{ cursor: 'pointer' }}>No.<SortIcon field="record_number" /></th>
                  <th className="col-title" onClick={() => handleSort('records_title')} style={{ cursor: 'pointer' }}>Records Title<SortIcon field="records_title" /></th>
                  <th className="col-code">Code <span className="th-sub">(To be filled by RAO)</span></th>
                  <th className="col-type" onClick={() => handleSort('type_of_records')} style={{ cursor: 'pointer' }}>Type of Records <span className="th-sub">(Confidential or Non-Confidential)</span><SortIcon field="type_of_records" /></th>
                  <th className="col-mode" onClick={() => handleSort('mode_of_filing')} style={{ cursor: 'pointer' }}>Mode of Filing<SortIcon field="mode_of_filing" /></th>
                  <th className="col-controller">Responsible Controller</th>
                  <th className="col-storage" onClick={() => handleSort('storage_location')} style={{ cursor: 'pointer' }}>Storage / Location<SortIcon field="storage_location" /></th>
                  <th className="col-retention" colSpan={3}>Retention Period</th>
                  <th className="col-disposition">Disposition Method</th>
                  <th className="col-actions">Actions</th>
                </tr>
                <tr className="thead-sub">
                  <th></th><th></th><th></th><th></th><th></th><th></th><th></th>
                  <th>Active</th>
                  <th>Archive</th>
                  <th>Year</th>
                  <th></th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={12} className="empty-row">
                      <div className="empty-state" style={{ padding: '40px 20px' }}>
                        <div className="empty-icon">📋</div>
                        <h2>{searchTerm ? 'No records found' : 'No records yet'}</h2>
                        <p>{searchTerm ? `No results for "${searchTerm}"` : 'Click "Add Record" to create your first entry'}</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filtered.map((rec, idx) => (
                    <tr key={rec.id} className={idx % 2 === 0 ? 'row-even' : 'row-odd'}>
                      <td className="td-center">{rec.record_number}</td>
                      <td className="td-title">{rec.records_title}</td>
                      <td className="td-center">{rec.code}</td>
                      <td className="td-center">
                        <span className={`type-badge ${rec.type_of_records === 'Confidential' ? 'type-conf' : 'type-nonconf'}`}>
                          {rec.type_of_records}
                        </span>
                      </td>
                      <td className="td-center">{rec.mode_of_filing}</td>
                      <td className="td-controller">{rec.responsible_controller}</td>
                      <td className="td-center">{rec.storage_location}</td>
                      <td className="td-center">{rec.retention_active}</td>
                      <td className="td-center">{rec.retention_archive}</td>
                      <td className="td-center">{rec.retention_year}</td>
                      <td className="td-disposition">{rec.disposition_method}</td>
                      <td className="td-actions">
                        <button onClick={() => openEdit(rec)} className="btn-icon-edit" title="Edit">✏️</button>
                        <button onClick={() => setDeleteConfirm(rec)} className="btn-icon-delete" title="Delete">🗑️</button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
            {filtered.length > 0 && (
              <div style={{ padding: '10px 16px', borderTop: '1px solid #e2e8f0', fontSize: '12px', color: '#94a3b8', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>{filtered.length} record{filtered.length !== 1 ? 's' : ''}{searchTerm ? ` matching "${searchTerm}"` : ''}</span>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button onClick={handleExportCSV} style={{ background: 'none', border: '1px solid #e2e8f0', borderRadius: '6px', padding: '4px 10px', fontSize: '11px', cursor: 'pointer', color: '#64748b' }}>📥 Export CSV</button>
                  <button onClick={handlePrint} style={{ background: 'none', border: '1px solid #e2e8f0', borderRadius: '6px', padding: '4px 10px', fontSize: '11px', cursor: 'pointer', color: '#64748b' }}>🖨️ Print</button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content masterlist-modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title">
                <h2>{editingRecord ? '✏️ Edit Record' : '➕ Add Record'}</h2>
                <p>{editingRecord ? 'Update the record details' : 'Fill in the record information'}</p>
              </div>
              <button className="modal-close" onClick={closeModal}>✕</button>
            </div>

            <div className="masterlist-form">
              <div className="form-row">
                <div className="form-group">
                  <label>Records Title *</label>
                  <input type="text" value={form.records_title} onChange={e => handleChange('records_title', e.target.value)} placeholder="e.g. Inventory Custodians Slip" />
                </div>
                <div className="form-group form-group-sm">
                  <label>Code</label>
                  <input type="text" value={form.code} onChange={e => handleChange('code', e.target.value)} placeholder="e.g. FM-001" />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Type of Records</label>
                  <select value={form.type_of_records} onChange={e => handleChange('type_of_records', e.target.value)}>
                    <option value="Non-Confidential">Non-Confidential</option>
                    <option value="Confidential">Confidential</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Mode of Filing</label>
                  <select value={form.mode_of_filing} onChange={e => handleChange('mode_of_filing', e.target.value)}>
                    <option value="Hard Copy">Hard Copy</option>
                    <option value="Soft Copy">Soft Copy</option>
                    <option value="Both">Both</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label>Responsible Controller</label>
                <input type="text" value={form.responsible_controller} onChange={e => handleChange('responsible_controller', e.target.value)} placeholder="e.g. Jo Augustine G. Corpuz / John Ford N. Ganzan" />
              </div>

              <div className="form-group">
                <label>Storage / Location</label>
                <input type="text" value={form.storage_location} onChange={e => handleChange('storage_location', e.target.value)} placeholder="e.g. File Box 1, Folder 1" />
              </div>

              <div className="form-row form-row-3">
                <div className="form-group">
                  <label>Retention — Active</label>
                  <input type="text" value={form.retention_active} onChange={e => handleChange('retention_active', e.target.value)} placeholder="e.g. 2025" />
                </div>
                <div className="form-group">
                  <label>Retention — Archive</label>
                  <input type="text" value={form.retention_archive} onChange={e => handleChange('retention_archive', e.target.value)} placeholder="e.g. 5 years after acted upon" />
                </div>
                <div className="form-group">
                  <label>Year</label>
                  <input type="text" value={form.retention_year} onChange={e => handleChange('retention_year', e.target.value)} placeholder="e.g. 2029" />
                </div>
              </div>

              <div className="form-group">
                <label>Disposition Method</label>
                <textarea value={form.disposition_method} onChange={e => handleChange('disposition_method', e.target.value)} rows={2} placeholder="e.g. Recommendation from NAP thru the Records Office" />
              </div>
            </div>

            <div style={{ display: 'flex', gap: '10px', marginTop: '4px' }}>
              <button onClick={handleSave} className="btn-primary" disabled={saving}>
                {saving ? 'Saving...' : editingRecord ? 'Save Changes' : 'Add Record'}
              </button>
              <button onClick={closeModal} className="btn-secondary" disabled={saving}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirm Modal */}
      {deleteConfirm && (
        <div className="modal-overlay" onClick={() => setDeleteConfirm(null)}>
          <div className="modal-content" style={{ maxWidth: '420px' }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title">
                <h2>🗑️ Delete Record</h2>
                <p>This action cannot be undone</p>
              </div>
              <button className="modal-close" onClick={() => setDeleteConfirm(null)}>✕</button>
            </div>
            <p style={{ fontSize: '14px', color: '#475569', margin: '8px 0 20px' }}>
              Are you sure you want to delete <strong>"{deleteConfirm.records_title}"</strong>?
            </p>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button onClick={() => handleDelete(deleteConfirm.id)} className="btn-danger" style={{ flex: 1, justifyContent: 'center' }}>Yes, Delete</button>
              <button onClick={() => setDeleteConfirm(null)} className="btn-secondary" style={{ flex: 1, justifyContent: 'center' }}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Masterlist;

