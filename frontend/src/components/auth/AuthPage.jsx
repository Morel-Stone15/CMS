import { useState } from 'react';
import {
  CreditCard, Shield, UserPlus, Eye, EyeOff, QrCode, RefreshCw, Mail, Camera
} from 'lucide-react';
import { POLES, ALL_NIVEAUX } from '../../constants/data';
import { api } from '../../services/api';
import { Toast } from '../common/Toast';
import { Modal } from '../common/Modal';
import { AntigravityCanvas } from '../common/AntigravityCanvas';

export function AuthPage({ onLogin }) {
  const [tab, setTab] = useState('member');
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);
  const [showPin, setShowPin] = useState(false);
  const [regSuccess, setRegSuccess] = useState(null);

  const [forgotOpen, setForgotOpen] = useState(false);
  const [forgotInput, setForgotInput] = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);

  const [memberData, setMemberData] = useState({ member_number: '', pin: '' });
  const [bureauData, setBureauData] = useState({ member_number: 'CT-ADMIN', pin: '' });

  const [regData, setRegData] = useState({ first_name: '', last_name: '', major: '', level: '', email: '', phone: '' });
  const [photo, setPhoto] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);

  const showToast = (msg, type = 'info') => setToast({ msg, type });

  async function handleMemberLogin(e) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await api.login(memberData);
      showToast('Connexion Membre réussie !', 'success');
      setTimeout(() => onLogin(res.member), 500);
    } catch (err) {
      showToast(err.message || 'Erreur de connexion au serveur.', 'error');
    } finally {
      setLoading(false);
    }
  }

  async function handleBureauLogin(e) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await api.login(bureauData);
      if (!res.member.is_bureau) {
        showToast('Accès refusé : Ce compte n\'a pas les privilèges Bureau.', 'error');
        return;
      }
      showToast('Connexion Espace Bureau réussie !', 'success');
      setTimeout(() => onLogin(res.member), 500);
    } catch (err) {
      showToast(err.message || 'Erreur de connexion au serveur.', 'error');
    } finally {
      setLoading(false);
    }
  }

  async function handleForgotPin(e) {
    e.preventDefault();
    if (!forgotInput.trim()) return;
    setForgotLoading(true);
    try {
      const res = await api.forgotPin({ email: forgotInput.trim() });
      showToast(res.message, 'success');
      setForgotOpen(false);
      setForgotInput('');
    } catch (err) {
      showToast(err.message || 'Erreur serveur lors de la récupération.', 'error');
    } finally {
      setForgotLoading(false);
    }
  }

  async function handleRegister(e) {
    e.preventDefault();
    setLoading(true);
    try {
      const fd = new FormData();
      Object.entries(regData).forEach(([k, v]) => fd.append(k, v));
      if (photo) fd.append('photo', photo);

      const res = await api.register(fd);
      if (res.error) {
        showToast(res.error, 'error');
        return;
      }
      setRegSuccess(res);
    } catch (err) {
      showToast(err.message || 'Erreur serveur lors de l\'inscription.', 'error');
    } finally {
      setLoading(false);
    }
  }

  function handlePhotoChange(e) {
    const file = e.target.files[0];
    if (!file) return;
    setPhoto(file);
    const reader = new FileReader();
    reader.onload = ev => setPhotoPreview(ev.target.result);
    reader.readAsDataURL(file);
  }

  if (regSuccess) {
    return (
      <div className="auth-page-split">
        {toast && <Toast {...toast} onClose={() => setToast(null)} />}
        <div className="auth-left-panel">
          <div className="auth-logo">
            <div className="auth-logo-text">C-TECH</div>
            <div className="auth-logo-sub">Plateforme ÉTUDIANTE & BUREAU</div>
          </div>
          <div className="auth-card" style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 52, marginBottom: 14 }}>🎉</div>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 22, marginBottom: 8 }}>Inscription Réussie !</h2>
            <p className="text-muted" style={{ marginBottom: 20, fontSize: 13 }}>
              Votre carte virtuelle a été générée et envoyée par email avec votre code de départ.
            </p>
            <div className="card" style={{ textAlign: 'left', marginBottom: 18, background: 'rgba(0,212,255,0.06)' }}>
              <div className="card-body" style={{ padding: 14 }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <div className="flex items-center gap-3">
                    <span className="text-muted" style={{ fontSize: 13, minWidth: 140 }}>Numéro membre</span>
                    <span style={{ fontFamily: 'monospace', fontWeight: 700, color: 'var(--accent-primary)', fontSize: 16 }}>
                      {regSuccess.member.member_number}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-muted" style={{ fontSize: 13, minWidth: 140 }}>Code de départ (24h)</span>
                    <span style={{ fontFamily: 'monospace', fontWeight: 700, fontSize: 22, letterSpacing: 6, color: 'var(--text-primary)' }}>
                      {regSuccess.pin}
                    </span>
                  </div>
                  <div style={{ fontSize: 11, color: '#eab308', marginTop: 4, lineHeight: 1.4 }}>
                    ⏱️ Ce code de départ est valable 24h. Lors de votre première connexion, il vous sera demandé de définir votre code PIN personnel.
                  </div>
                </div>
              </div>
            </div>
            <button className="btn btn-primary w-full" onClick={() => {
              setRegSuccess(null); setTab('member');
              setMemberData({ member_number: regSuccess.member.member_number, pin: regSuccess.pin });
            }}>
              Se connecter maintenant
            </button>
          </div>
        </div>
        <div className="auth-right-panel">
          <AntigravityCanvas />
        </div>
      </div>
    );
  }

  return (
    <div className="auth-page-split">
      {toast && <Toast {...toast} onClose={() => setToast(null)} />}

      {forgotOpen && (
        <Modal
          title="Récupération du Code PIN"
          onClose={() => setForgotOpen(false)}
          footer={
            <>
              <button className="btn btn-secondary" onClick={() => setForgotOpen(false)}>Annuler</button>
              <button className="btn btn-primary" onClick={handleForgotPin} disabled={forgotLoading}>
                {forgotLoading ? <span className="animate-spin"><RefreshCw size={15} /></span> : <><Mail size={15} />Envoyer nouveau PIN</>}
              </button>
            </>
          }
        >
          <p style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 16, lineHeight: 1.5 }}>
            Saisissez votre <strong>adresse email</strong> ou votre <strong>numéro de membre</strong>. Un nouveau code PIN de connexion généré automatiquement vous sera immédiatement envoyé par email.
          </p>
          <div className="form-group">
            <label className="form-label">Email ou N° de membre</label>
            <input
              className="form-input"
              placeholder="votre.email@univ.dz ou CT-2026-0001"
              value={forgotInput}
              onChange={e => setForgotInput(e.target.value)}
              autoFocus
              required
            />
          </div>
        </Modal>
      )}

      <div className="auth-left-panel">
        <div className="auth-logo">
          <img src="/logo.png" alt="Logo Club IST" style={{ height: 54, width: 'auto', marginBottom: 6, filter: 'drop-shadow(0 0 12px rgba(0,212,255,0.4))' }} />
          <div className="auth-logo-text">C-TECH</div>
          <div className="auth-logo-sub">Portail des Membres & Administration</div>
        </div>

        <div className="auth-card">
          <div className="auth-tabs-3">
            <button className={`auth-tab ${tab === 'member' ? 'active' : ''}`} onClick={() => setTab('member')}>
              <CreditCard size={14} />Membre
            </button>
            <button className={`auth-tab ${tab === 'bureau' ? 'active' : ''}`} onClick={() => setTab('bureau')}>
              <Shield size={14} />Bureau
            </button>
            <button className={`auth-tab ${tab === 'register' ? 'active' : ''}`} onClick={() => setTab('register')}>
              <UserPlus size={14} />Inscription
            </button>
          </div>

          {tab === 'member' && (
            <form onSubmit={handleMemberLogin}>
              <div className="form-group">
                <label className="form-label">Numéro de Membre</label>
                <input className="form-input" placeholder="CT-2026-0001" value={memberData.member_number}
                  onChange={e => setMemberData(p => ({ ...p, member_number: e.target.value }))} required />
              </div>
              <div className="form-group">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                  <label className="form-label" style={{ marginBottom: 0 }}>Code PIN</label>
                  <button type="button" onClick={() => setForgotOpen(true)}
                    style={{ background: 'none', border: 'none', color: 'var(--accent-primary)', fontSize: 12, cursor: 'pointer', fontWeight: 600 }}>
                    Code PIN oublié ?
                  </button>
                </div>
                <div style={{ position: 'relative' }}>
                  <input className="form-input" type={showPin ? 'text' : 'password'} placeholder="••••••"
                    maxLength={6} value={memberData.pin}
                    onChange={e => setMemberData(p => ({ ...p, pin: e.target.value }))} required
                    style={{ paddingRight: 44 }} />
                  <button type="button" onClick={() => setShowPin(p => !p)}
                    style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}>
                    {showPin ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
              <button className="btn btn-primary w-full btn-lg" type="submit" disabled={loading} style={{ marginTop: 10 }}>
                {loading ? <span className="animate-spin"><RefreshCw size={16} /></span> : <><QrCode size={16} />Se Connecter (Espace Membre)</>}
              </button>
            </form>
          )}

          {tab === 'bureau' && (
            <form onSubmit={handleBureauLogin}>
              <div className="alert alert-purple" style={{ marginBottom: 14, fontSize: 12 }}>
                <Shield size={15} />
                <span>Accès réservé aux administrateurs du bureau C-TECH.</span>
              </div>
              <div className="form-group">
                <label className="form-label">Identifiant Bureau</label>
                <input className="form-input" placeholder="CT-ADMIN" value={bureauData.member_number}
                  onChange={e => setBureauData(p => ({ ...p, member_number: e.target.value }))} required />
              </div>
              <div className="form-group">
                <label className="form-label">Code PIN Administrateur</label>
                <div style={{ position: 'relative' }}>
                  <input className="form-input" type={showPin ? 'text' : 'password'} placeholder="••••••"
                    maxLength={6} value={bureauData.pin}
                    onChange={e => setBureauData(p => ({ ...p, pin: e.target.value }))} required
                    style={{ paddingRight: 44 }} />
                  <button type="button" onClick={() => setShowPin(p => !p)}
                    style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}>
                    {showPin ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
              <button className="btn btn-secondary w-full btn-lg" type="submit" disabled={loading} style={{ marginTop: 10, background: 'linear-gradient(135deg, rgba(124,58,237,0.4), rgba(167,139,250,0.2))', borderColor: 'rgba(167,139,250,0.5)' }}>
                {loading ? <span className="animate-spin"><RefreshCw size={16} /></span> : <><Shield size={16} />Se Connecter (Espace Bureau)</>}
              </button>
            </form>
          )}

          {tab === 'register' && (
            <form onSubmit={handleRegister}>
              <div className="form-grid-2">
                <div className="form-group">
                  <label className="form-label">Prénom</label>
                  <input className="form-input" placeholder="Ahmed" value={regData.first_name}
                    onChange={e => setRegData(p => ({ ...p, first_name: e.target.value }))} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Nom</label>
                  <input className="form-input" placeholder="Benali" value={regData.last_name}
                    onChange={e => setRegData(p => ({ ...p, last_name: e.target.value }))} required />
                </div>
              </div>

              <div className="form-grid-2">
                <div className="form-group">
                  <label className="form-label">Filière</label>
                  <select className="form-select" value={regData.major}
                    onChange={e => setRegData(p => ({ ...p, major: e.target.value }))} required>
                    <option value="">Filière...</option>
                    {Object.entries(POLES).map(([poleName, fList]) => (
                      <optgroup key={poleName} label={poleName}>
                        {fList.map(f => <option key={f} value={f}>{f}</option>)}
                      </optgroup>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Niveau</label>
                  <select className="form-select" value={regData.level}
                    onChange={e => setRegData(p => ({ ...p, level: e.target.value }))} required>
                    <option value="">Niveau...</option>
                    {ALL_NIVEAUX.map(n => <option key={n} value={n}>{n}</option>)}
                  </select>
                </div>
              </div>

              <div className="form-grid-2">
                <div className="form-group">
                  <label className="form-label">Email</label>
                  <input className="form-input" type="email" placeholder="ahmed@univ.dz" value={regData.email}
                    onChange={e => setRegData(p => ({ ...p, email: e.target.value }))} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Téléphone</label>
                  <input className="form-input" placeholder="0555 123 456" value={regData.phone}
                    onChange={e => setRegData(p => ({ ...p, phone: e.target.value }))} required />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Photo (facultatif)</label>
                <label className="photo-upload-compact" htmlFor="reg-photo">
                  {photoPreview
                    ? <img src={photoPreview} alt="" className="photo-preview-thumb" />
                    : <div className="flex items-center gap-2"><Camera size={18} style={{ color: 'var(--accent-primary)' }} /><span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Ajouter une photo</span></div>
                  }
                </label>
                <input id="reg-photo" type="file" accept="image/*" style={{ display: 'none' }} onChange={handlePhotoChange} />
              </div>

              <button className="btn btn-primary w-full btn-lg" type="submit" disabled={loading} style={{ marginTop: 6 }}>
                {loading ? <span className="animate-spin"><RefreshCw size={16} /></span> : <><UserPlus size={16} />S'inscrire à C-TECH</>}
              </button>
            </form>
          )}
        </div>
      </div>

      <div className="auth-right-panel">
        <AntigravityCanvas />
      </div>
    </div>
  );
}
