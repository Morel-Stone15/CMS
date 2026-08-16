import { useState } from 'react';
import {
  LayoutDashboard, Users, ScanLine, Network, Layers,
  MessageSquare, Calendar, ClipboardList, HardDrive, Shield, LogOut, Menu, X
} from 'lucide-react';
import { ChangePinModal } from '../auth/ChangePinModal';
import { BoardDashboard } from '../dashboard/BoardDashboard';
import { BoardMembers } from '../members/BoardMembers';
import { BoardScanner } from '../attendance/BoardScanner';
import { BoardOrgChart } from '../org_chart/BoardOrgChart';
import { BoardCommissions } from '../commissions/BoardCommissions';
import { BoardCommunication } from '../communication/BoardCommunication';
import { BoardCalendar } from '../calendar/BoardCalendar';
import { BoardLogs } from '../admin/BoardLogs';
import { BoardBackup } from '../admin/BoardBackup';

export function BoardWorkspace({ member, onLogout, showToast }) {
  const [page, setPage] = useState('dashboard');
  const [changePinOpen, setChangePinOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const navItems = [
    { id: 'dashboard', icon: <LayoutDashboard size={18} />, label: 'Tableau de Bord' },
    { id: 'members', icon: <Users size={18} />, label: 'Membres' },
    { id: 'scanner', icon: <ScanLine size={18} />, label: 'Scanner QR' },
    { id: 'orgchart', icon: <Network size={18} />, label: 'Organigramme' },
    { id: 'commissions', icon: <Layers size={18} />, label: 'Commissions' },
    { id: 'communication', icon: <MessageSquare size={18} />, label: 'Communication' },
    { id: 'calendar', icon: <Calendar size={18} />, label: 'Calendrier' },
    { id: 'logs', icon: <ClipboardList size={18} />, label: 'Journaux' },
    { id: 'backup', icon: <HardDrive size={18} />, label: 'Sauvegarde' },
  ];

  const sharedProps = { member, showToast };

  const handleNavClick = (id) => {
    setPage(id);
    setSidebarOpen(false);
  };

  return (
    <div className="app-shell">
      <div className={`sidebar-overlay ${sidebarOpen ? 'show' : ''}`} onClick={() => setSidebarOpen(false)} />
      <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-logo">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <img src="/logo.png" alt="Logo" style={{ height: 34, width: 'auto', filter: 'drop-shadow(0 0 8px rgba(167,139,250,0.5))' }} />
              <div>
                <div className="logo-text" style={{ fontSize: 18, lineHeight: 1 }}>C-TECH</div>
                <div className="logo-sub" style={{ color: 'var(--accent-secondary)', WebkitTextFillColor: '#a78bfa', fontSize: 10, fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase', marginTop: 2 }}>
                  ESPACE BUREAU
                </div>
              </div>
            </div>
            <button className="mobile-menu-btn" onClick={() => setSidebarOpen(false)} style={{ display: sidebarOpen ? 'flex' : 'none' }}>
              <X size={18} />
            </button>
          </div>
        </div>
        <nav className="sidebar-nav">
          <div className="nav-section-label">Administration</div>
          {navItems.map(item => (
            <div key={item.id} className={`nav-item ${page === item.id ? 'active' : ''}`} onClick={() => handleNavClick(item.id)}>
              {item.icon}<span>{item.label}</span>
            </div>
          ))}
        </nav>
        <div className="sidebar-footer">
          <div className="flex items-center gap-3" style={{ marginBottom: 12 }}>
            <div className="avatar" style={{ background: 'linear-gradient(135deg, #7c3aed, #a78bfa)' }}>
              <Shield size={16} />
            </div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 600 }}>{member.first_name} {member.last_name}</div>
              <div style={{ fontSize: 11, color: 'var(--accent-secondary)' }}>Espace Bureau</div>
            </div>
          </div>
          <button className="btn btn-secondary w-full" onClick={() => setChangePinOpen(true)}
            style={{ justifyContent: 'center', gap: 8, marginBottom: 8, background: 'rgba(124,58,237,0.12)', borderColor: 'rgba(167,139,250,0.3)', color: '#a78bfa' }}>
            <Shield size={15} />Changer mon PIN
          </button>
          <button className="btn btn-secondary w-full" onClick={onLogout} style={{ justifyContent: 'center', gap: 8 }}>
            <LogOut size={15} />Déconnexion
          </button>
        </div>
      </aside>

      <main className="main-content">
        {/* Mobile Navbar Header */}
        <div className="mobile-header-bar">
          <button className="mobile-menu-btn" onClick={() => setSidebarOpen(true)}>
            <Menu size={20} />
          </button>
          <div style={{ fontWeight: 700, fontSize: 15, color: 'var(--accent-primary-light)' }}>
            C-TECH <span style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 500 }}>— Bureau</span>
          </div>
        </div>

        {page === 'dashboard' && <BoardDashboard {...sharedProps} />}
        {page === 'members' && <BoardMembers {...sharedProps} />}
        {page === 'scanner' && <BoardScanner {...sharedProps} />}
        {page === 'orgchart' && <BoardOrgChart {...sharedProps} />}
        {page === 'commissions' && <BoardCommissions {...sharedProps} />}
        {page === 'communication' && <BoardCommunication {...sharedProps} />}
        {page === 'calendar' && <BoardCalendar {...sharedProps} />}
        {page === 'logs' && <BoardLogs {...sharedProps} />}
        {page === 'backup' && <BoardBackup {...sharedProps} />}
      </main>
      {changePinOpen && <ChangePinModal member={member} showToast={showToast} onClose={() => setChangePinOpen(false)} />}
    </div>
  );
}
