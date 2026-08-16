import { useState, useEffect, useRef } from 'react';
import { CreditCard, Settings, Activity, MessageSquare, Network, Download, FileText, Mail, LogOut, Menu, X } from 'lucide-react';
import { toPng } from 'html-to-image';
import { api } from '../../services/api';
import { fmt } from '../../constants/data';
import { Avatar } from '../common/Avatar';
import { VirtualCard } from './VirtualCard';
import { DiscussionView } from '../discussion/DiscussionView';

export function MemberWorkspace({ member, onLogout, showToast }) {
  const [page, setPage] = useState('card');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [attendance, setAttendance] = useState([]);
  const [orgChart, setOrgChart] = useState([]);
  const [editForm, setEditForm] = useState({ email: member.email, phone: member.phone });
  const [saving, setSaving] = useState(false);
  const cardRef = useRef(null);

  useEffect(() => {
    api.getAttendance(member.id).then(d => setAttendance(Array.isArray(d) ? d : [])).catch(err => console.error(err));
    api.getOrgChart().then(d => setOrgChart(Array.isArray(d) ? d : [])).catch(err => console.error(err));
  }, [member.id]);

  function triggerDirectDownload(url, filename) {
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.target = '_blank';
    a.rel = 'noopener noreferrer';
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      if (document.body.contains(a)) document.body.removeChild(a);
    }, 200);
  }

  async function downloadCard() {
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    showToast('Téléchargement de la carte PNG...', 'info');

    if (isMobile) {
      triggerDirectDownload(api.getCardPngUrl(member.id), `Carte_C-TECH_${member.member_number}.png`);
      showToast('Téléchargement PNG lancé !', 'success');
      return;
    }

    try {
      if (cardRef.current) {
        const el = cardRef.current;
        const prevTransform = el.style.transform;
        el.style.transform = 'rotateX(0deg) rotateY(0deg) scale(1)';
        el.style.transition = 'none';
        await new Promise(r => setTimeout(r, 60));
        const dataUrl = await toPng(el, { pixelRatio: 3, cacheBust: true });
        el.style.transform = prevTransform;
        el.style.transition = '';

        triggerDirectDownload(dataUrl, `Carte_C-TECH_${member.member_number}.png`);
        showToast('Carte téléchargée en PNG !', 'success');
        return;
      }
    } catch (e) {
      console.warn('Canvas PNG fallback to API', e);
    }

    triggerDirectDownload(api.getCardPngUrl(member.id), `Carte_C-TECH_${member.member_number}.png`);
    showToast('Téléchargement PNG lancé !', 'success');
  }

  async function downloadCardPDF() {
    showToast('Génération du PDF...', 'info');
    triggerDirectDownload(api.getCardPdfUrl(member.id), `Carte_CLUB_TECH_${member.member_number}.pdf`);
    showToast('Téléchargement PDF lancé !', 'success');
  }

  async function sendCardByEmail() {
    try {
      showToast('Envoi en cours...', 'info');
      const res = await api.sendCardEmail(member.id, member.first_name);
      showToast(res.message, 'success');
    } catch (err) { showToast(err.message || 'Erreur lors de l\'envoi email.', 'error'); }
  }

  async function handleSaveProfile(e) {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await api.updateMember(member.id, editForm);
      if (res.error) { showToast(res.error, 'error'); return; }
      showToast('Coordonnées mises à jour !', 'success');
    } catch { showToast('Erreur serveur.', 'error'); }
    finally { setSaving(false); }
  }

  const roots = orgChart.filter(n => !n.parent_id);
  const getChildren = pid => orgChart.filter(n => n.parent_id === pid);

  function OrgNode({ node }) {
    const children = getChildren(node.id);
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0 }}>
        <div className="org-node" style={{ cursor: 'default' }}>
          {node.member && (
            <div style={{ marginBottom: 8 }}>
              <Avatar member={node.member} />
            </div>
          )}
          <div className="org-node-role">{node.role_name}</div>
          <div className={node.member ? 'org-node-name' : 'org-node-empty'}>
            {node.member ? `${node.member.first_name} ${node.member.last_name}` : 'Vacant'}
          </div>
        </div>
        {children.length > 0 && (
          <>
            <div style={{ width: 2, height: 24, background: 'var(--border-primary)' }} />
            <div style={{ display: 'flex', gap: 16, position: 'relative' }}>
              {children.length > 1 && (
                <div style={{
                  position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)',
                  height: 2, width: `calc(100% - 80px)`, background: 'var(--border-primary)'
                }} />
              )}
              {children.map(ch => (
                <div key={ch.id} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <div style={{ width: 2, height: 16, background: 'var(--border-primary)' }} />
                  <OrgNode node={ch} />
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    );
  }

  const navItems = [
    { id: 'card', icon: <CreditCard size={18} />, label: 'Ma Carte' },
    { id: 'profile', icon: <Settings size={18} />, label: 'Mon Profil' },
    { id: 'attendance', icon: <Activity size={18} />, label: 'Mes Présences' },
    { id: 'chat', icon: <MessageSquare size={18} />, label: 'Discussion' },
    { id: 'orgchart', icon: <Network size={18} />, label: 'Organigramme' },
  ];

  function closeSidebar() { setSidebarOpen(false); }

  return (
    <div className="app-shell">
      <div className={`sidebar-overlay ${sidebarOpen ? 'show' : ''}`} onClick={closeSidebar} />
      <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-logo">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
            <img src="/logo.png" alt="Logo" style={{ height: 34, width: 'auto', filter: 'drop-shadow(0 0 8px rgba(0,212,255,0.5))' }} />
            <div>
              <div className="logo-text" style={{ fontSize: 18, lineHeight: 1 }}>C-TECH</div>
              <div className="logo-sub" style={{ fontSize: 10, marginTop: 2 }}>ESPACE MEMBRE</div>
            </div>
          </div>
        </div>
        <nav className="sidebar-nav">
          {navItems.map(item => (
            <div key={item.id} className={`nav-item ${page === item.id ? 'active' : ''}`} onClick={() => { setPage(item.id); closeSidebar(); }}>
              {item.icon}<span>{item.label}</span>
            </div>
          ))}
        </nav>
        <div className="sidebar-footer">
          <div className="flex items-center gap-3" style={{ marginBottom: 12 }}>
            <Avatar member={member} />
            <div style={{ overflow: 'hidden' }}>
              <div style={{ fontSize: 13, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {member.first_name} {member.last_name}
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{member.member_number}</div>
            </div>
          </div>
          <button className="btn btn-secondary w-full" onClick={onLogout} style={{ justifyContent: 'center', gap: 8 }}>
            <LogOut size={15} />Déconnexion
          </button>
        </div>
      </aside>

      <main className="main-content">
        {page === 'card' && (
          <>
            <div className="page-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <button className="mobile-menu-btn" onClick={() => setSidebarOpen(o => !o)}>
                  {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
                </button>
                <div>
                  <h1 className="page-title">Ma Carte Virtuelle</h1>
                  <p className="page-subtitle">Votre identifiant officiel au C-TECH — survolez la carte pour l'effet 3D !</p>
                </div>
              </div>
              <div className="flex gap-2">
                <button className="btn btn-secondary" onClick={downloadCard} title="Télécharger en PNG">
                  <Download size={16} />PNG
                </button>
                <button className="btn btn-secondary" onClick={downloadCardPDF} title="Télécharger en PDF">
                  <FileText size={16} />PDF
                </button>
                <button className="btn btn-primary" onClick={sendCardByEmail} title="Envoyer par email">
                  <Mail size={16} />Envoyer par Email
                </button>
              </div>
            </div>
            <div className="page-body">
              <div className="member-card-container">
                <VirtualCard member={member} cardRef={cardRef} />
              </div>
              <div className="card card-gradient" style={{ maxWidth: 500, margin: '24px auto' }}>
                <div className="card-body">
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                    {[
                      ['Numéro Membre', member.member_number, true],
                      ['Filière', member.major],
                      ['Niveau', member.level],
                      ['Email', member.email],
                      ['Téléphone', member.phone],
                      ['Inscrit le', fmt(member.created_at)],
                    ].map(([label, value, accent]) => (
                      <div key={label}>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 3, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{label}</div>
                        <div style={{ fontSize: 14, fontWeight: 600, color: accent ? 'var(--accent-primary)' : 'var(--text-primary)', fontFamily: accent ? 'monospace' : 'inherit' }}>{value || '—'}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </>
        )}

        {page === 'profile' && (
          <>
            <div className="page-header">
              <div><h1 className="page-title">Mon Profil</h1><p className="page-subtitle">Mettez à jour vos coordonnées de contact</p></div>
            </div>
            <div className="page-body">
              <div className="card" style={{ maxWidth: 500 }}>
                <div className="card-header"><div className="card-title"><Settings size={16} />Modifier Coordonnées</div></div>
                <div className="card-body">
                  <form onSubmit={handleSaveProfile}>
                    <div className="form-group">
                      <label className="form-label">Adresse Email</label>
                      <input className="form-input" type="email" value={editForm.email} onChange={e => setEditForm(p => ({ ...p, email: e.target.value }))} required />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Numéro de Téléphone</label>
                      <input className="form-input" value={editForm.phone} onChange={e => setEditForm(p => ({ ...p, phone: e.target.value }))} required />
                    </div>
                    <button className="btn btn-primary" type="submit" disabled={saving}>
                      {saving ? 'Enregistrement...' : 'Enregistrer les modifications'}
                    </button>
                  </form>
                </div>
              </div>
            </div>
          </>
        )}

        {page === 'attendance' && (
          <>
            <div className="page-header">
              <div><h1 className="page-title">Mes Présences</h1><p className="page-subtitle">Historique de vos participations aux événements</p></div>
            </div>
            <div className="page-body">
              <div className="card">
                <div className="table-wrapper">
                  <table>
                    <thead><tr><th>Événement</th><th>Horodatage</th></tr></thead>
                    <tbody>
                      {attendance.length === 0
                        ? <tr><td colSpan={2} className="table-empty">Aucune présence enregistrée</td></tr>
                        : attendance.map(a => (
                          <tr key={a.id}>
                            <td style={{ fontWeight: 600 }}>{a.event_name}</td>
                            <td style={{ fontSize: 13, color: 'var(--text-muted)' }}>{fmt(a.scanned_at)}</td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </>
        )}

        {page === 'chat' && (
          <div className="page-body">
            <DiscussionView member={member} showToast={showToast} />
          </div>
        )}

        {page === 'orgchart' && (
          <>
            <div className="page-header">
              <div><h1 className="page-title">Organigramme</h1><p className="page-subtitle">Structure du Bureau — lecture seule</p></div>
            </div>
            <div className="page-body">
              <div className="card">
                <div className="card-body" style={{ overflowX: 'auto' }}>
                  {orgChart.length === 0
                    ? <div className="table-empty">Aucun organigramme défini</div>
                    : <div className="org-tree">{roots.map(r => <OrgNode key={r.id} node={r} />)}</div>}
                </div>
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
