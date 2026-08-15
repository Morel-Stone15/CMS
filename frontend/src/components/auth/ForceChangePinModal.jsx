import { useState } from 'react';
import { Lock, Eye, EyeOff, CheckCircle, AlertTriangle, RefreshCw } from 'lucide-react';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

export function ForceChangePinModal({ showToast }) {
  const { currentUser, updateUser } = useAuth();
  const [currentPin, setCurrentPin] = useState('');
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [showPins, setShowPins] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  if (!currentUser || !currentUser.must_change_pin) {
    return null;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setErrorMsg('');

    if (!currentPin) {
      setErrorMsg('Veuillez saisir le code de départ temporaire que vous avez reçu.');
      return;
    }

    if (!newPin || newPin.length < 4) {
      setErrorMsg('Le nouveau code PIN doit comporter au moins 4 caractères.');
      return;
    }

    if (newPin !== confirmPin) {
      setErrorMsg('Les deux nouveaux codes PIN ne correspondent pas.');
      return;
    }

    if (newPin === currentPin) {
      setErrorMsg('Le nouveau code PIN doit être différent du code de départ temporaire.');
      return;
    }

    setLoading(true);
    try {
      const res = await api.changePin(currentUser.id, {
        current_pin: currentPin.trim(),
        new_pin: newPin.trim(),
        operator: fNameLName()
      });

      if (res.error) {
        setErrorMsg(res.error);
        return;
      }

      showToast('Votre code PIN personnel a été enregistré avec succès !', 'success');
      if (res.member) {
        updateUser(res.member);
      } else {
        updateUser({ must_change_pin: false });
      }
    } catch (err) {
      setErrorMsg(err.message || 'Erreur lors de l\'enregistrement du code PIN.');
    } finally {
      setLoading(false);
    }
  }

  function fNameLName() {
    return `${currentUser.first_name || ''} ${currentUser.last_name || ''}`.trim() || 'Membre';
  }

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      zIndex: 99999,
      background: 'rgba(5, 10, 20, 0.88)',
      backdropFilter: 'blur(12px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 20
    }}>
      <div style={{
        width: '100%',
        maxWidth: 460,
        background: '#0f172a',
        border: '1px solid var(--accent-primary, #00d4ff)',
        borderRadius: 16,
        padding: 28,
        boxShadow: '0 0 50px rgba(0, 212, 255, 0.25)',
        color: '#f8fafc',
        animation: 'fadeIn 0.3s ease'
      }}>
        <div style={{ textAlign: 'center', marginBottom: 20 }}>
          <div style={{
            width: 56,
            height: 56,
            borderRadius: '50%',
            background: 'linear-gradient(135deg, rgba(0,212,255,0.2), rgba(124,58,237,0.2))',
            border: '1px solid var(--accent-primary, #00d4ff)',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--accent-primary, #00d4ff)',
            marginBottom: 12
          }}>
            <Lock size={28} />
          </div>
          <h2 style={{ fontSize: 20, fontWeight: 700, margin: 0, fontFamily: 'var(--font-display)' }}>
            Définition du Code PIN Personnel
          </h2>
          <p style={{ fontSize: 13, color: 'var(--text-muted, #94a3b8)', marginTop: 6, lineHeight: 1.5 }}>
            Bonjour <strong>{currentUser.first_name}</strong> ! Vous êtes connecté avec un <strong>code de départ temporaire (valable 24h)</strong>.
            Veuillez choisir votre code PIN personnel définitif pour continuer.
          </p>
        </div>

        <div style={{
          background: 'rgba(234, 179, 8, 0.1)',
          border: '1px solid rgba(234, 179, 8, 0.3)',
          borderRadius: 10,
          padding: '10px 14px',
          marginBottom: 20,
          display: 'flex',
          gap: 10,
          alignItems: 'flex-start',
          fontSize: 12,
          color: '#fef08a'
        }}>
          <AlertTriangle size={18} style={{ shrink: 0, marginTop: 1 }} />
          <div>
            <strong>Sécurité :</strong> Ce changement est obligatoire. Une fois enregistré, votre code PIN personnel sera le seul moyen de vous connecter.
          </div>
        </div>

        {errorMsg && (
          <div className="alert alert-error" style={{ marginBottom: 16, fontSize: 13 }}>
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="form-group">
            <label className="form-label" style={{ fontSize: 12 }}>Code de départ actuel (reçu par email / écran)</label>
            <div style={{ position: 'relative' }}>
              <input
                className="form-input"
                type={showPins ? 'text' : 'password'}
                placeholder="Ex: 123456"
                value={currentPin}
                onChange={e => setCurrentPin(e.target.value)}
                required
                autoFocus
              />
              <button
                type="button"
                onClick={() => setShowPins(p => !p)}
                style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
              >
                {showPins ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label" style={{ fontSize: 12 }}>Nouveau Code PIN personnel (min. 4 chiffres)</label>
            <input
              className="form-input"
              type={showPins ? 'text' : 'password'}
              placeholder="••••••"
              value={newPin}
              onChange={e => setNewPin(e.target.value)}
              minLength={4}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label" style={{ fontSize: 12 }}>Confirmer le nouveau Code PIN</label>
            <input
              className="form-input"
              type={showPins ? 'text' : 'password'}
              placeholder="••••••"
              value={confirmPin}
              onChange={e => setConfirmPin(e.target.value)}
              minLength={4}
              required
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary w-full btn-lg"
            disabled={loading}
            style={{ marginTop: 8 }}
          >
            {loading ? (
              <span className="animate-spin"><RefreshCw size={18} /></span>
            ) : (
              <><CheckCircle size={18} />Enregistrer mon Code PIN Personnel</>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
