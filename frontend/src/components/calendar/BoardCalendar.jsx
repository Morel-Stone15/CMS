import { useState, useEffect } from 'react';
import { Calendar, Plus, ChevronDown, ClipboardList, Trash2 } from 'lucide-react';
import { api } from '../../services/api';
import { Modal } from '../common/Modal';

export function BoardCalendar({ member, showToast }) {
  const [events, setEvents] = useState([]);
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState({ title: '', description: '', start_date: '', end_date: '' });
  const [currentDate, setCurrentDate] = useState(new Date());

  function loadEvents() {
    api.getCalendar().then(d => setEvents(Array.isArray(d) ? d : [])).catch(err => console.error(err));
  }
  useEffect(() => { loadEvents(); }, []);

  async function createEvent() {
    try {
      const res = await api.addCalendarEvent({ ...form, operator: member.first_name });
      if (res.error) { showToast(res.error, 'error'); return; }
      showToast('Événement ajouté', 'success');
      setModal(false);
      setForm({ title: '', description: '', start_date: '', end_date: '' });
      loadEvents();
    } catch (err) {
      showToast('Erreur création événement.', 'error');
    }
  }

  async function deleteEvent(ev) {
    if (!window.confirm(`Supprimer "${ev.title}" ?`)) return;
    try {
      await api.deleteCalendarEvent(ev.id, member.first_name);
      showToast('Événement supprimé', 'success');
      loadEvents();
    } catch (err) {
      showToast('Erreur suppression événement.', 'error');
    }
  }

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const today = new Date();
  const monthNames = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];
  const dayNames = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];

  function hasEvent(day) {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return events.some(ev => ev.start_date && ev.start_date.startsWith(dateStr));
  }

  return (
    <>
      {modal && (
        <Modal title="Nouvel Événement" onClose={() => setModal(false)}
          footer={<><button className="btn btn-secondary" onClick={() => setModal(false)}>Annuler</button><button className="btn btn-primary" onClick={createEvent}>Créer</button></>}>
          <div className="form-group"><label className="form-label">Titre</label>
            <input className="form-input" value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} required /></div>
          <div className="form-group"><label className="form-label">Description</label>
            <textarea className="form-textarea" value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} /></div>
          <div className="form-grid-2">
            <div className="form-group"><label className="form-label">Date début</label>
              <input className="form-input" type="date" value={form.start_date} onChange={e => setForm(p => ({ ...p, start_date: e.target.value }))} required /></div>
            <div className="form-group"><label className="form-label">Date fin</label>
              <input className="form-input" type="date" value={form.end_date} onChange={e => setForm(p => ({ ...p, end_date: e.target.value }))} required /></div>
          </div>
        </Modal>
      )}
      <div className="page-header">
        <div><h1 className="page-title">Calendrier du Bureau</h1><p className="page-subtitle">{events.length} événement(s) planifié(s)</p></div>
        <button className="btn btn-primary" onClick={() => setModal(true)}><Plus size={16} />Ajouter</button>
      </div>
      <div className="page-body">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 20 }}>
          <div className="card">
            <div className="card-header">
              <div className="card-title"><Calendar size={16} />{monthNames[month]} {year}</div>
              <div className="flex gap-2">
                <button className="btn btn-secondary btn-sm btn-icon" onClick={() => setCurrentDate(new Date(year, month - 1))}><ChevronDown size={14} /></button>
                <button className="btn btn-secondary btn-sm btn-icon" onClick={() => setCurrentDate(new Date(year, month + 1))}><ChevronDown size={14} style={{ transform: 'rotate(180deg)' }} /></button>
              </div>
            </div>
            <div className="card-body">
              <div className="calendar-grid">
                {dayNames.map(d => <div key={d} className="cal-day-header">{d}</div>)}
                {Array.from({ length: firstDay }).map((_, i) => <div key={`e${i}`} className="cal-day other-month" />)}
                {Array.from({ length: daysInMonth }, (_, i) => i + 1).map(day => {
                  const isToday = day === today.getDate() && month === today.getMonth() && year === today.getFullYear();
                  return (
                    <div key={day} className={`cal-day ${isToday ? 'today' : ''}`}>
                      <span>{day}</span>
                      {hasEvent(day) && <div className="cal-event-dot" />}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="card" style={{ height: 'fit-content' }}>
            <div className="card-header"><div className="card-title"><ClipboardList size={16} />Événements</div></div>
            <div style={{ maxHeight: 480, overflowY: 'auto' }}>
              {events.length === 0
                ? <div className="table-empty">Aucun événement planifié</div>
                : events.map(ev => (
                  <div key={ev.id} style={{ padding: '14px 16px', borderBottom: '1px solid var(--border-subtle)' }}>
                    <div className="flex items-center gap-2" style={{ marginBottom: 4 }}>
                      <div style={{ fontWeight: 600, fontSize: 14, flex: 1 }}>{ev.title}</div>
                      <button className="btn btn-danger btn-sm btn-icon" onClick={() => deleteEvent(ev)}><Trash2 size={12} /></button>
                    </div>
                    {ev.description && <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 4 }}>{ev.description}</div>}
                    <div style={{ fontSize: 11, color: 'var(--accent-primary)' }}>
                      {ev.start_date} → {ev.end_date}
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
