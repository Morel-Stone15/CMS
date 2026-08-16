const RENDER_BACKEND_URL = 'https://cms-fbf7.onrender.com/api';

function getApiBase() {
  const envUrl = import.meta.env.VITE_API_URL;
  if (envUrl && envUrl !== '/api') {
    return envUrl;
  }
  if (typeof window !== 'undefined' && (window.location.hostname.includes('onrender.com') || window.location.hostname.includes('github.io'))) {
    return RENDER_BACKEND_URL;
  }
  return '/api';
}

export const API_BASE = getApiBase();

export async function apiFetch(endpoint, options = {}) {
  const url = `${API_BASE}${endpoint}`;
  const response = await fetch(url, options);
  
  if (!response.ok) {
    let errorMsg = 'Erreur réseau ou serveur';
    try {
      const errData = await response.json();
      if (errData && errData.error) {
        errorMsg = errData.error;
      }
    } catch (e) {
      // Fallback
    }
    throw new Error(errorMsg);
  }
  
  return response.json();
}

export const api = {
  // Auth
  register: (formData) => fetch(`${API_BASE}/register`, { method: 'POST', body: formData }).then(r => r.json()),
  login: (data) => apiFetch('/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) }),
  forgotPin: (data) => apiFetch('/forgot_pin', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) }),
  changePin: (memberId, data) => apiFetch(`/members/${memberId}/change_pin`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) }),

  // Members
  getMembers: (params = '') => apiFetch(`/members${params}`),
  getMember: (id) => apiFetch(`/members/${id}`),
  updateMember: (id, data) => apiFetch(`/members/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) }),
  deleteMember: (id, operator = 'Bureau') => apiFetch(`/members/${id}?operator=${encodeURIComponent(operator)}`, { method: 'DELETE' }),
  resetMemberPin: (id, operator = 'Bureau') => apiFetch(`/members/${id}/reset_pin`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ operator }) }),
  updateNotes: (id, notes, operator = 'Bureau') => apiFetch(`/members/${id}/private_notes`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ notes, operator }) }),
  updateStatus: (id, status, operator = 'Bureau') => apiFetch(`/members/${id}/status`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status, operator }) }),
  sendCardEmail: (id, operator = 'Bureau') => apiFetch(`/members/${id}/send_card_email`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ operator }) }),
  getCardPdfUrl: (id) => `${API_BASE}/members/${id}/card_pdf`,
  getCardPngUrl: (id) => `${API_BASE}/members/${id}/card_png`,

  // Attendance
  getAttendance: (memberId = '') => apiFetch(`/attendance${memberId ? `?member_id=${memberId}` : ''}`),
  scanAttendance: (data) => apiFetch('/attendance/scan', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) }),

  // OrgChart
  getOrgChart: () => apiFetch('/org_chart'),
  addOrgNode: (data) => apiFetch('/org_chart', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) }),
  updateOrgNode: (id, data) => apiFetch(`/org_chart/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) }),
  deleteOrgNode: (id, operator = 'Bureau') => apiFetch(`/org_chart/${id}?operator=${encodeURIComponent(operator)}`, { method: 'DELETE' }),

  // Commissions
  getCommissions: () => apiFetch('/commissions'),
  createCommission: (data) => apiFetch('/commissions', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) }),
  deleteCommission: (id, operator = 'Bureau') => apiFetch(`/commissions/${id}?operator=${encodeURIComponent(operator)}`, { method: 'DELETE' }),
  getCommissionMembers: (id) => apiFetch(`/commissions/${id}/members`),
  addMemberToCommission: (commId, memberId, operator = 'Bureau') => apiFetch(`/commissions/${commId}/members`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ member_id: memberId, operator }) }),
  removeMemberFromCommission: (commId, memberId, operator = 'Bureau') => apiFetch(`/commissions/${commId}/members/${memberId}?operator=${encodeURIComponent(operator)}`, { method: 'DELETE' }),

  // Discussion & Communication
  getDiscussion: () => apiFetch('/discussion'),
  postDiscussion: (data) => {
    if (data instanceof FormData) {
      return fetch(`${API_BASE}/discussion`, { method: 'POST', body: data }).then(r => r.json());
    }
    return apiFetch('/discussion', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
  },
  deleteDiscussionMessage: (id) => apiFetch(`/discussion/${id}`, { method: 'DELETE' }),
  sendMassEmail: (data) => apiFetch('/send_mass_email', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) }),

  // Calendar
  getCalendar: () => apiFetch('/calendar'),
  addCalendarEvent: (data) => apiFetch('/calendar', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) }),
  deleteCalendarEvent: (id, operator = 'Bureau') => apiFetch(`/calendar/${id}?operator=${encodeURIComponent(operator)}`, { method: 'DELETE' }),

  // Admin & Logs
  getLogs: () => apiFetch('/logs'),
  resetDatabase: () => apiFetch('/reset_database', { method: 'POST' }),
  importExcel: (formData) => fetch(`${API_BASE}/import_excel`, { method: 'POST', body: formData }).then(r => r.json())
};
