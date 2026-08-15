import { useState } from 'react';
import { Mail, MessageSquare, Send, Bell, RefreshCw } from 'lucide-react';
import { api } from '../../services/api';
import { ALL_FILIERES, ALL_NIVEAUX } from '../../constants/data';
import { DiscussionView } from '../discussion/DiscussionView';

export function BoardCommunication({ member, showToast }) {
  const [tab, setTab] = useState('mass');
  const [emailForm, setEmailForm] = useState({ subject: '', body: '', major: '', level: '' });
  const [sending, setSending] = useState(false);

  async function sendMassEmail(e) {
    e.preventDefault();
    setSending(true);
    try {
      const res = await api.sendMassEmail({ ...emailForm, operator: member.first_name });
      if (res.error) { showToast(res.error, 'error'); return; }
      showToast(res.message, 'success');
      setEmailForm({ subject: '', body: '', major: '', level: '' });
    } catch (err) {
      showToast('Erreur envoi email groupé.', 'error');
    } finally {
      setSending(false);
    }
  }

  const filieres = ['', ...ALL_FILIERES];
  const niveaux = ['', ...ALL_NIVEAUX];

  return (
    <>
      <div className="page-header">
        <div><h1 className="page-title">Communication</h1><p className="page-subtitle">Email groupé & discussion interne</p></div>
      </div>
      <div className="page-body">
        <div className="auth-tabs" style={{ marginBottom: 20, maxWidth: 400 }}>
          <button className={`auth-tab ${tab === 'mass' ? 'active' : ''}`} onClick={() => setTab('mass')}><Mail size={14} /> Email Groupé</button>
          <button className={`auth-tab ${tab === 'chat' ? 'active' : ''}`} onClick={() => setTab('chat')}><MessageSquare size={14} /> Discussion Bureau</button>
        </div>

        {tab === 'mass' && (
          <div className="card" style={{ maxWidth: 600 }}>
            <div className="card-header"><div className="card-title"><Send size={16} />Envoi Massif</div></div>
            <div className="card-body">
              <form onSubmit={sendMassEmail}>
                <div className="form-grid-2">
                  <div className="form-group">
                    <label className="form-label">Filière cible (optionnel)</label>
                    <select className="form-select" value={emailForm.major} onChange={e => setEmailForm(p => ({ ...p, major: e.target.value }))}>
                      {filieres.map(f => <option key={f} value={f}>{f || 'Toutes les filières'}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Niveau cible (optionnel)</label>
                    <select className="form-select" value={emailForm.level} onChange={e => setEmailForm(p => ({ ...p, level: e.target.value }))}>
                      {niveaux.map(n => <option key={n} value={n}>{n || 'Tous les niveaux'}</option>)}
                    </select>
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Objet de l'email</label>
                  <input className="form-input" value={emailForm.subject} onChange={e => setEmailForm(p => ({ ...p, subject: e.target.value }))} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Contenu du message</label>
                  <textarea className="form-textarea" style={{ minHeight: 160 }} value={emailForm.body} onChange={e => setEmailForm(p => ({ ...p, body: e.target.value }))} required />
                </div>
                <div className="alert alert-info" style={{ marginBottom: 16 }}>
                  <Bell size={14} />
                  <span>En mode démo (sans SMTP configuré), les emails sont enregistrés dans <code>backend/logs/sent_emails.log</code></span>
                </div>
                <button className="btn btn-primary w-full" type="submit" disabled={sending}>
                  {sending ? <span className="animate-spin"><RefreshCw size={16} /></span> : <><Send size={16} />Envoyer</>}
                </button>
              </form>
            </div>
          </div>
        )}

        {tab === 'chat' && <DiscussionView member={member} showToast={showToast} />}
      </div>
    </>
  );
}
