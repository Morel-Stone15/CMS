import { useState, useEffect } from 'react';
import { Plus, Network, Edit2, Trash2 } from 'lucide-react';
import { api } from '../../services/api';
import { Avatar } from '../common/Avatar';
import { Modal } from '../common/Modal';

export function BoardOrgChart({ member, showToast }) {
  const [nodes, setNodes] = useState([]);
  const [allMembers, setAllMembers] = useState([]);
  const [modal, setModal] = useState({ open: false, node: null });
  const [form, setForm] = useState({ role_name: '', member_id: '', parent_id: '', order: 0 });

  function load() {
    api.getOrgChart().then(d => setNodes(Array.isArray(d) ? d : [])).catch(err => console.error(err));
    api.getMembers().then(d => setAllMembers(Array.isArray(d) ? d : [])).catch(err => console.error(err));
  }

  useEffect(() => { load(); }, []);

  function openAdd() {
    setForm({ role_name: '', member_id: '', parent_id: '', order: 0 });
    setModal({ open: true, node: null });
  }

  function openEdit(n) {
    setForm({
      role_name: n.role_name,
      member_id: n.member_id || '',
      parent_id: n.parent_id || '',
      order: n.order || 0
    });
    setModal({ open: true, node: n });
  }

  async function handleSave() {
    if (!form.role_name.trim()) return;
    const body = {
      role_name: form.role_name.trim(),
      member_id: form.member_id ? parseInt(form.member_id) : null,
      parent_id: form.parent_id ? parseInt(form.parent_id) : null,
      order: parseInt(form.order) || 0,
      operator: member.first_name
    };

    try {
      if (modal.node) {
        await api.updateOrgNode(modal.node.id, body);
        showToast('Poste mis à jour', 'success');
      } else {
        await api.addOrgNode(body);
        showToast('Poste ajouté', 'success');
      }
      setModal({ open: false, node: null });
      load();
    } catch (err) {
      showToast('Erreur lors de l\'enregistrement.', 'error');
    }
  }

  async function handleDelete(n) {
    if (!window.confirm(`Supprimer le poste "${n.role_name}" ?`)) return;
    try {
      await api.deleteOrgNode(n.id, member.first_name);
      showToast('Poste supprimé', 'success');
      load();
    } catch (err) {
      showToast('Erreur de suppression.', 'error');
    }
  }

  const roots = nodes.filter(n => !n.parent_id);
  const getChildren = pid => nodes.filter(n => n.parent_id === pid);

  function OrgNode({ node }) {
    const children = getChildren(node.id);
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0 }}>
        <div className="org-node" onClick={() => openEdit(node)}>
          {node.member && (
            <div style={{ marginBottom: 8 }}>
              <Avatar member={node.member} />
            </div>
          )}
          <div className="org-node-role">{node.role_name}</div>
          <div className={node.member ? 'org-node-name' : 'org-node-empty'}>
            {node.member ? `${node.member.first_name} ${node.member.last_name}` : 'Vacant'}
          </div>
          <div className="org-node-actions" onClick={e => e.stopPropagation()}>
            <button className="btn btn-secondary btn-sm btn-icon" onClick={() => openEdit(node)}><Edit2 size={12} /></button>
            <button className="btn btn-danger btn-sm btn-icon" onClick={() => handleDelete(node)}><Trash2 size={12} /></button>
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

  return (
    <>
      {modal.open && (
        <Modal
          title={modal.node ? 'Modifier le poste' : 'Ajouter un poste'}
          onClose={() => setModal({ open: false, node: null })}
          footer={<><button className="btn btn-secondary" onClick={() => setModal({ open: false, node: null })}>Annuler</button><button className="btn btn-primary" onClick={handleSave}>Enregistrer</button></>}
        >
          <div className="form-group">
            <label className="form-label">Titre du poste</label>
            <input className="form-input" placeholder="Ex: Vice-Président" value={form.role_name}
              onChange={e => setForm(p => ({ ...p, role_name: e.target.value }))} />
          </div>
          <div className="form-group">
            <label className="form-label">Membre assigné</label>
            <select className="form-select" value={form.member_id} onChange={e => setForm(p => ({ ...p, member_id: e.target.value }))}>
              <option value="">Vacant (non assigné)</option>
              {allMembers.map(m => <option key={m.id} value={m.id}>{m.first_name} {m.last_name}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Hiérarchie (poste parent)</label>
            <select className="form-select" value={form.parent_id} onChange={e => setForm(p => ({ ...p, parent_id: e.target.value }))}>
              <option value="">Aucun (racine)</option>
              {nodes.filter(n => !modal.node || n.id !== modal.node.id).map(n => <option key={n.id} value={n.id}>{n.role_name}</option>)}
            </select>
          </div>
        </Modal>
      )}
      <div className="page-header">
        <div><h1 className="page-title">Organigramme</h1><p className="page-subtitle">Structure hiérarchique du Bureau</p></div>
        <button className="btn btn-primary" onClick={openAdd}><Plus size={16} />Ajouter un poste</button>
      </div>
      <div className="page-body">
        <div className="card">
          <div className="card-body" style={{ overflowX: 'auto', minHeight: 300 }}>
            {nodes.length === 0
              ? <div className="table-empty"><Network size={32} style={{ margin: '0 auto 12px', display: 'block', opacity: 0.3 }} />Aucun poste défini. Cliquez sur "Ajouter un poste" pour commencer.</div>
              : <div className="org-tree">{roots.map(r => <OrgNode key={r.id} node={r} />)}</div>
            }
          </div>
        </div>
      </div>
    </>
  );
}
