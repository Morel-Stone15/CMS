import { HardDrive, FileText, Download, AlertCircle, RefreshCw } from 'lucide-react';
import { useState } from 'react';
import { api } from '../../services/api';

export function BoardBackup({ showToast }) {
  const [resetting, setResetting] = useState(false);

  async function handleResetDb() {
    if (!window.confirm("ATTENTION: Êtes-vous sûr de vouloir réinitialiser la base de données ? Toutes les données seront supprimées sauf le compte Admin !")) {
      return;
    }
    setResetting(true);
    try {
      const res = await api.resetDatabase();
      if (res.error) {
        showToast(res.error, 'error');
        return;
      }
      showToast(res.message, 'success');
    } catch (err) {
      showToast('Erreur réinitialisation DB.', 'error');
    } finally {
      setResetting(false);
    }
  }

  return (
    <>
      <div className="page-header">
        <div><h1 className="page-title">Sauvegarde & Export</h1><p className="page-subtitle">Téléchargement et gestion des données du club</p></div>
      </div>
      <div className="page-body">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, maxWidth: 700 }}>
          <div className="card card-gradient">
            <div className="card-body" style={{ textAlign: 'center', padding: 32 }}>
              <HardDrive size={48} style={{ color: 'var(--accent-primary)', margin: '0 auto 16px', display: 'block' }} />
              <h3 style={{ fontFamily: 'var(--font-display)', marginBottom: 8 }}>Base de Données</h3>
              <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 20 }}>
                Téléchargez la base de données SQLite complète avec tous les membres, présences, et logs.
              </p>
              <a className="btn btn-primary w-full" href="/api/backup" style={{ justifyContent: 'center' }}>
                <Download size={16} />Télécharger (.db)
              </a>
            </div>
          </div>
          <div className="card card-gradient">
            <div className="card-body" style={{ textAlign: 'center', padding: 32 }}>
              <FileText size={48} style={{ color: 'var(--accent-secondary)', margin: '0 auto 16px', display: 'block' }} />
              <h3 style={{ fontFamily: 'var(--font-display)', marginBottom: 8 }}>Export Excel</h3>
              <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 20 }}>
                Exportez la liste complète des membres dans un fichier Excel (.xlsx) lisible dans n'importe quel tableur.
              </p>
              <a className="btn btn-primary w-full" href="/api/export_excel" style={{ justifyContent: 'center' }}>
                <Download size={16} />Télécharger (.xlsx)
              </a>
            </div>
          </div>
        </div>

        <div className="card" style={{ maxWidth: 700, marginTop: 24, borderColor: 'rgba(239, 68, 68, 0.3)' }}>
          <div className="card-body" style={{ padding: 20 }}>
            <h4 style={{ color: 'var(--danger)', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
              <AlertCircle size={18} /> Réinitialisation de la Base de Données
            </h4>
            <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 16 }}>
              Efface l'ensemble des membres, présences, messages et événements de la base de données pour remettre l'application à neuf.
            </p>
            <button className="btn btn-danger" onClick={handleResetDb} disabled={resetting}>
              {resetting ? <span className="animate-spin"><RefreshCw size={16} /></span> : 'Réinitialiser la Base de Données'}
            </button>
          </div>
        </div>

        <div className="alert alert-warning" style={{ maxWidth: 700, marginTop: 20 }}>
          <AlertCircle size={16} />
          <span>Conservez vos sauvegardes dans un endroit sécurisé. Ces fichiers contiennent toutes les informations personnelles des membres.</span>
        </div>
      </div>
    </>
  );
}
