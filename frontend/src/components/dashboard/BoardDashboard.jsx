import { useState, useEffect } from 'react';
import { Users, Activity, Layers, Calendar, ClipboardList } from 'lucide-react';
import { api } from '../../services/api';
import { fmt } from '../../constants/data';
import { Avatar } from '../common/Avatar';

export function BoardDashboard({ showToast }) {
  const [stats, setStats] = useState({ members: 0, attendance: 0, commissions: 0, events: 0 });
  const [recentLogs, setRecentLogs] = useState([]);
  const [recentMembers, setRecentMembers] = useState([]);

  useEffect(() => {
    Promise.all([
      api.getMembers(),
      api.getAttendance(),
      api.getCommissions(),
      api.getCalendar(),
      api.getLogs()
    ]).then(([members, att, comms, cal, logs]) => {
      setStats({
        members: Array.isArray(members) ? members.length : 0,
        attendance: Array.isArray(att) ? att.length : 0,
        commissions: Array.isArray(comms) ? comms.length : 0,
        events: Array.isArray(cal) ? cal.length : 0,
      });
      setRecentLogs(Array.isArray(logs) ? logs.slice(0, 5) : []);
      setRecentMembers(Array.isArray(members) ? members.slice(0, 5) : []);
    }).catch(err => console.error(err));
  }, []);

  const statCards = [
    { label: 'Membres', value: stats.members, icon: <Users size={22} /> },
    { label: 'Présences', value: stats.attendance, icon: <Activity size={22} /> },
    { label: 'Commissions', value: stats.commissions, icon: <Layers size={22} /> },
    { label: 'Événements', value: stats.events, icon: <Calendar size={22} /> },
  ];

  return (
    <>
      <div className="page-header">
        <div>
          <h1 className="page-title">Tableau de Bord</h1>
          <p className="page-subtitle">Bienvenue dans l'espace Bureau de C-TECH</p>
        </div>
        <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>
          {new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
        </div>
      </div>
      <div className="page-body">
        <div className="stats-grid" style={{ marginBottom: 24 }}>
          {statCards.map(sc => (
            <div className="stat-card" key={sc.label}>
              <div className="stat-icon">{sc.icon}</div>
              <div className="stat-value">{sc.value}</div>
              <div className="stat-label">{sc.label}</div>
            </div>
          ))}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
          <div className="card">
            <div className="card-header"><div className="card-title"><Users size={16} />Derniers inscrits</div></div>
            <div style={{ padding: '8px 0' }}>
              {recentMembers.map(m => (
                <div key={m.id} className="flex items-center gap-3" style={{ padding: '10px 20px', borderBottom: '1px solid var(--border-subtle)' }}>
                  <Avatar member={m} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 14, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{m.first_name} {m.last_name}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{m.major} · {m.level}</div>
                  </div>
                  <span className="badge badge-primary" style={{ fontSize: 10 }}>{m.member_number}</span>
                </div>
              ))}
              {recentMembers.length === 0 && <div className="table-empty">Aucun membre</div>}
            </div>
          </div>
          <div className="card">
            <div className="card-header"><div className="card-title"><ClipboardList size={16} />Activité récente</div></div>
            <div style={{ padding: '8px 0' }}>
              {recentLogs.map(log => (
                <div key={log.id} style={{ padding: '10px 20px', borderBottom: '1px solid var(--border-subtle)' }}>
                  <div style={{ fontSize: 13, marginBottom: 2 }}>{log.action_description}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Par <strong style={{ color: 'var(--accent-primary)' }}>{log.operator_name}</strong> · {fmt(log.timestamp)}</div>
                </div>
              ))}
              {recentLogs.length === 0 && <div className="table-empty">Aucune activité</div>}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
