import { supabase } from './supabase';

// Write to Supabase (persistent) + localStorage (fast local read)
export async function addAuditEntry(action, detail) {
  // Always write to localStorage for instant UI
  try {
    const log = JSON.parse(localStorage.getItem('auditLog') || '[]');
    log.unshift({ action, detail, time: new Date().toISOString() });
    localStorage.setItem('auditLog', JSON.stringify(log.slice(0, 100)));
  } catch {}

  // Also persist to Supabase (fire and forget)
  try {
    await supabase.from('audit_log').insert({ action, detail });
  } catch {}
}

// Fetch from Supabase (persistent), fallback to localStorage
export async function getAuditLog(limit = 100) {
  try {
    const { data, error } = await supabase
      .from('audit_log')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);
    if (!error && data) {
      return data.map(e => ({ action: e.action, detail: e.detail, time: e.created_at }));
    }
  } catch {}
  // fallback
  try { return JSON.parse(localStorage.getItem('auditLog') || '[]'); } catch { return []; }
}

export async function clearAuditLog() {
  try { await supabase.from('audit_log').delete().neq('id', '00000000-0000-0000-0000-000000000000'); } catch {}
  localStorage.removeItem('auditLog');
}
