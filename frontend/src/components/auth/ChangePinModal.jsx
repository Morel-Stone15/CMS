import { useState } from 'react';
import { Shield, AlertCircle, Eye, EyeOff, Check, RefreshCw, X } from 'lucide-react';
import { api } from '../../services/api';

export function ChangePinModal({ member, showToast, onClose }) {
  const [form, setForm] = useState({ current_pin: '', new_pin: '', confirm_pin: '' });
  const [loading, setLoading] = useState(false);
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    if (form.new_pin !== form.confirm_pin) {
      showToast('Les nouveaux codes PIN ne correspondent pas.', 'error');
      return;
    }
    if (form.new_pin.length < 4) {
      showToast('Le nouveau code PIN doit comporter au moins 4 caractères.', 'error');
      return;
    }
    setLoading(true);
    try {
      await api.changePin(member.id, {
        current_pin: form.current_pin,
        new_pin: form.new_pin,
        operator: `${member.first_name} ${member.last_name}`
      });
      showToast('Code PIN modifié avec succès !', 'success');
      setForm({ current_pin: '', new_pin: '', confirm_pin: '' });
      onClose();
    } catch (err) {
      showToast(err.message || 'Erreur serveur.', 'error');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="modal-backdrop" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header">
          <div className="modal-title" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Shield size={20} style={{ color: 'var(--accent-secondary)' }} />
            Modifier le Code PIN
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 4 }}>
            <X size={20} />
          </button>
        </div>
        <div className="modal-body">
          <div className="alert alert-info" style={{ marginBottom: 18, fontSize: 13 }}>
            <AlertCircle size={15} />
            <span>Pour votre sécurité, saisissez votre code PIN actuel avant d'en définir un nouveau.</span>
          </div>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Code PIN actuel</label>
              <div style={{ position: 'relative' }}>
                <input className="form-input" type={showCurrent ? 'text' : 'password'}
                  placeholder="••••••" value={form.current_pin}
                  onChange={e => setForm(p => ({ ...p, current_pin: e.target.value }))}
                  required style={{ paddingRight: 44 }} />
                <button type="button" onClick={() => setShowCurrent(p => !p)}
                  style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}>
                  {showCurrent ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Nouveau code PIN</label>
              <div style={{ position: 'relative' }}>
                <input className="form-input" type={showNew ? 'text' : 'password'}
                  placeholder="Minimum 4 caractères" value={form.new_pin}
                  onChange={e => setForm(p => ({ ...p, new_pin: e.target.value }))}
                  required style={{ paddingRight: 44 }} />
                <button type="button" onClick={() => setShowNew(p => !p)}
                  style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}>
                  {showNew ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Confirmer le nouveau code PIN</label>
              <input className="form-input" type="password"
                placeholder="Répétez le nouveau code PIN" value={form.confirm_pin}
                onChange={e => setForm(p => ({ ...p, confirm_pin: e.target.value }))}
                required />
            </div>
            <div className="modal-footer" style={{ padding: 0, marginTop: 8 }}>
              <button type="button" className="btn btn-secondary" onClick={onClose}>Annuler</button>
              <button type="submit" className="btn btn-primary" disabled={loading}>
                {loading ? <span className="animate-spin"><RefreshCw size={15} /></span> : <><Check size={15} />Confirmer le changement</>}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
