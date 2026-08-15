import { useState, useEffect, useRef } from 'react';
import { Calendar, Camera, Edit2, Check, X, AlertCircle, Activity } from 'lucide-react';
import { api } from '../../services/api';
import { fmt } from '../../constants/data';
import { Avatar } from '../common/Avatar';

export function BoardScanner({ member, showToast }) {
  const [eventName, setEventName] = useState('Réunion Bureau');
  const [scanning, setScanning] = useState(false);
  const [lastResult, setLastResult] = useState(null);
  const [manualCode, setManualCode] = useState('');
  const [recentScans, setRecentScans] = useState([]);
  const html5ScannerRef = useRef(null);

  useEffect(() => {
    return () => {
      if (html5ScannerRef.current) {
        html5ScannerRef.current.stop().catch(() => {});
      }
    };
  }, []);

  async function handleScan(memberNumber) {
    try {
      const res = await api.scanAttendance({
        member_number: memberNumber,
        event_name: eventName,
        operator: member.first_name
      });
      if (res.error) {
        showToast(res.error, 'error');
        return;
      }
      setLastResult(res);
      setRecentScans(prev => [{ ...res.member, scannedAt: new Date().toISOString(), duplicate: res.duplicate }, ...prev.slice(0, 9)]);
      showToast(res.message, res.duplicate ? 'warning' : 'success');
    } catch (err) {
      showToast('Erreur lors du scan.', 'error');
    }
  }

  async function startScanner() {
    setScanning(true);
    await new Promise(r => setTimeout(r, 200));
    try {
      const { Html5Qrcode } = await import('html5-qrcode');
      const scanner = new Html5Qrcode('qr-reader');
      html5ScannerRef.current = scanner;
      await scanner.start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: { width: 250, height: 250 } },
        async (decodedText) => {
          await scanner.stop();
          setScanning(false);
          html5ScannerRef.current = null;
          await handleScan(decodedText);
        },
        () => {}
      );
    } catch (err) {
      setScanning(false);
      showToast('Impossible d\'accéder à la caméra. Utilisez la saisie manuelle.', 'error');
    }
  }

  function stopScanner() {
    if (html5ScannerRef.current) {
      html5ScannerRef.current.stop().catch(() => {});
      html5ScannerRef.current = null;
    }
    setScanning(false);
  }

  async function handleManualScan(e) {
    e.preventDefault();
    if (!manualCode.trim()) return;
    await handleScan(manualCode.trim());
    setManualCode('');
  }

  return (
    <>
      <div className="page-header">
        <div><h1 className="page-title">Scanner QR Code</h1><p className="page-subtitle">Enregistrement des présences en temps réel</p></div>
      </div>
      <div className="page-body">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div className="card">
              <div className="card-header"><div className="card-title"><Calendar size={16} />Événement</div></div>
              <div className="card-body">
                <div className="form-group">
                  <label className="form-label">Nom de l'événement</label>
                  <input className="form-input" value={eventName} onChange={e => setEventName(e.target.value)} placeholder="Ex: Réunion générale 2026" />
                </div>
                <div style={{ display: 'flex', gap: 10 }}>
                  {!scanning
                    ? <button className="btn btn-primary" onClick={startScanner} style={{ flex: 1 }}><Camera size={16} />Démarrer la caméra</button>
                    : <button className="btn btn-danger" onClick={stopScanner} style={{ flex: 1 }}><X size={16} />Arrêter</button>
                  }
                </div>
              </div>
            </div>

            <div className="card">
              <div className="card-header"><div className="card-title"><Edit2 size={16} />Saisie Manuelle</div></div>
              <div className="card-body">
                <form onSubmit={handleManualScan}>
                  <div className="form-group">
                    <label className="form-label">Numéro de membre</label>
                    <input className="form-input" placeholder="CT-2026-0001" value={manualCode} onChange={e => setManualCode(e.target.value)} />
                  </div>
                  <button className="btn btn-secondary w-full" type="submit"><Check size={16} />Valider la Présence</button>
                </form>
              </div>
            </div>

            {lastResult?.member && (
              <div className={`alert ${lastResult.duplicate ? 'alert-warning' : 'alert-success'}`}>
                {lastResult.duplicate ? <AlertCircle size={16} /> : <Check size={16} />}
                <div>
                  <div style={{ fontWeight: 600 }}>{lastResult.member.first_name} {lastResult.member.last_name}</div>
                  <div style={{ fontSize: 12 }}>{lastResult.message}</div>
                </div>
              </div>
            )}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div className="card" style={{ flex: 1 }}>
              <div className="card-header"><div className="card-title"><Camera size={16} />Aperçu Caméra</div></div>
              <div className="card-body">
                <div id="qr-reader" style={{ width: '100%', borderRadius: 'var(--radius-lg)', overflow: 'hidden', minHeight: 200, background: '#000' }} />
                {!scanning && (
                  <div style={{ textAlign: 'center', padding: '32px 0', color: 'var(--text-muted)', fontSize: 13 }}>
                    <Camera size={36} style={{ margin: '0 auto 12px', display: 'block', opacity: 0.4 }} />
                    Caméra inactive. Cliquez sur "Démarrer" pour commencer.
                  </div>
                )}
              </div>
            </div>

            <div className="card">
              <div className="card-header"><div className="card-title"><Activity size={16} />Scans récents</div></div>
              <div style={{ maxHeight: 200, overflowY: 'auto' }}>
                {recentScans.length === 0
                  ? <div className="table-empty" style={{ padding: 20 }}>Aucun scan effectué</div>
                  : recentScans.map((s, i) => (
                    <div key={i} className="flex items-center gap-3" style={{ padding: '10px 16px', borderBottom: '1px solid var(--border-subtle)' }}>
                      <Avatar member={s} />
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 13, fontWeight: 600 }}>{s.first_name} {s.last_name}</div>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{fmt(s.scannedAt)}</div>
                      </div>
                      <span className={`badge ${s.duplicate ? 'badge-warning' : 'badge-success'}`}>
                        {s.duplicate ? 'Déjà présent' : 'Enregistré'}
                      </span>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
