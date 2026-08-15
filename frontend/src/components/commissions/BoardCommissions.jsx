import { useState, useEffect } from 'react';
import { Layers, Plus, Trash2, Users, X } from 'lucide-react';
import { api } from '../../services/api';
import { Avatar } from '../common/Avatar';
import { Modal } from '../common/Modal';

export function BoardCommissions({ member, showToast }) {
  const [commissions, setCommissions] = useState([]);
  const [selected, setSelected] = useState(null);
  const [commMembers, setCommMembers] = useState([]);
  const [allMembers, setAllMembers] = useState([]);
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState({ name: '', description: '' });
  const [addMemberId, setAddMemberId] = useState('');

  function loadComms() {
    api.getCommissions()
      .then(d => setCommissions(Array.isArray(d) ? d : []))
      .catch(err => console.error(err));
  }

  useEffect(() => {
    loadComms();
    api.getMembers()
      .then(d => setAllMembers(Array.isArray(d) ? d : []))
      .catch(err => console.error(err));
  }, []);

  useEffect(() => {
    if (selected) {
      api.getCommissionMembers(selected.id)
        .then(d => setCommMembers(Array.isArray(d) ? d : []))
        .catch(err => console.error(err));
    }
  }, [selected]);

  async function createComm() {
    try {
      const res = await api.createCommission({ ...form, operator: member.first_name });
      if (res.error) { showToast(res.error, 'error'); return; }
      showToast('Commission créée', 'success');
      setModal(false);
      setForm({ name: '', description: '' });
      loadComms();
    } catch (err) {
      showToast('Erreur création commission.', 'error');
    }
  }

  async function deleteComm(c) {
    if (!window.confirm(`Supprimer la commission "${c.name}" ?`)) return;
    try {
      await api.deleteCommission(c.id, member.first_name);
      showToast('Commission supprimée', 'success');
      if (selected?.id === c.id) setSelected(null);
      loadComms();
    } catch (err) {
      showToast('Erreur suppression commission.', 'error');
    }
  }

  async function addMember() {
    if (!addMemberId) return;
    try {
      const res = await api.addMemberToCommission(selected.id, parseInt(addMemberId), member.first_name);
      if (res.error) { showToast(res.error, 'error'); return; }
      showToast('Membre ajouté', 'success');
      setAddMemberId('');
      api.getCommissionMembers(selected.id).then(d => setCommMembers(Array.isArray(d) ? d : []));
    } catch (err) {
      showToast('Erreur ajout membre.', 'error');
    }
  }

  async function removeMember(m) {
    try {
      await api.removeMemberFromCommission(selected.id, m.id, member.first_name);
      showToast('Membre retiré', 'success');
      api.getCommissionMembers(selected.id).then(d => setCommMembers(Array.isArray(d) ? d : []));
    } catch (err) {
      showToast('Erreur retrait membre.', 'error');
    }
  }

  const availableMembers = allMembers.filter(m => !commMembers.find(cm => cm.id === m.id));

  return (
    <>
      {modal && (
        <Modal title="Nouvelle Commission" onClose={() => setModal(false)}
          footer={<><button className="btn btn-secondary" onClick={() => setModal(false)}>Annuler</button><button className="btn btn-primary" onClick={createComm}>Créer</button></>}>
          <div className="form-group"><label className="form-label">Nom de la commission</label>
            <input className="form-input" placeholder="Ex: Commission Technique" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} /></div>
          <div className="form-group"><label className="form-label">Description</label>
            <textarea className="form-textarea" placeholder="Objectifs et missions..." value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} /></div>
        </Modal>
      )}
      <div className="page-header">
        <div><h1 className="page-title">Commissions</h1><p className="page-subtitle">{commissions.length} commission(s)</p></div>
        <button className="btn btn-primary" onClick={() => setModal(true)}><Plus size={16} />Nouvelle Commission</button>
      </div>
      <div className="page-body">
        <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: 20 }}>
          <div className="card" style={{ height: 'fit-content' }}>
            <div className="card-header"><div className="card-title"><Layers size={16} />Liste</div></div>
            <div>
              {commissions.length === 0
                ? <div className="table-empty">Aucune commission</div>
                : commissions.map(c => (
                  <div key={c.id} className="flex items-center gap-3"
                    style={{ padding: '12px 16px', cursor: 'pointer', borderBottom: '1px solid var(--border-subtle)', background: selected?.id === c.id ? 'rgba(0,212,255,0.06)' : '', transition: 'background 0.15s' }}
                    onClick={() => setSelected(c)}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 600, fontSize: 14 }}>{c.name}</div>
                      <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{c.member_count} membre(s)</div>
                    </div>
                    <button className="btn btn-danger btn-sm btn-icon" onClick={e => { e.stopPropagation(); deleteComm(c); }}><Trash2 size={12} /></button>
                  </div>
                ))}
            </div>
          </div>

          {selected ? (
            <div className="card">
              <div className="card-header">
                <div className="card-title"><Users size={16} />Membres — {selected.name}</div>
              </div>
              <div className="card-body">
                <div className="flex gap-3" style={{ marginBottom: 16 }}>
                  <select className="form-select" style={{ flex: 1 }} value={addMemberId} onChange={e => setAddMemberId(e.target.value)}>
                    <option value="">Ajouter un membre...</option>
                    {availableMembers.map(m => <option key={m.id} value={m.id}>{m.first_name} {m.last_name} — {m.major}</option>)}
                  </select>
                  <button className="btn btn-primary" onClick={addMember}><Plus size={16} />Ajouter</button>
                </div>
                <div className="divider" />
                {commMembers.length === 0
                  ? <div className="table-empty">Aucun membre dans cette commission</div>
                  : commMembers.map(m => (
                    <div key={m.id} className="flex items-center gap-3" style={{ padding: '10px 0', borderBottom: '1px solid var(--border-subtle)' }}>
                      <Avatar member={m} />
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 600, fontSize: 14 }}>{m.first_name} {m.last_name}</div>
                        <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{m.major} · {m.level}</div>
                      </div>
                      <button className="btn btn-danger btn-sm btn-icon" onClick={() => removeMember(m)}><X size={12} /></button>
                    </div>
                  ))}
              </div>
            </div>
          ) : (
            <div className="card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <div style={{ textAlign: 'center', color: 'var(--text-muted)' }}>
                <Layers size={48} style={{ margin: '0 auto 12px', display: 'block', opacity: 0.3 }} />
                <div>Sélectionnez une commission pour voir ses membres</div>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
