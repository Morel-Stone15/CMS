import { useState, useEffect } from 'react';
import { RefreshCw } from 'lucide-react';
import { api } from '../../services/api';
import { fmt } from '../../constants/data';

export function BoardLogs({ showToast }) {
  const [logs, setLogs] = useState([]);

  function loadLogs() {
    api.getLogs().then(d => setLogs(Array.isArray(d) ? d : [])).catch(err => console.error(err));
  }

  useEffect(() => { loadLogs(); }, []);

  return (
    <>
      <div className="page-header">
        <div><h1 className="page-title">Journaux d'Actions</h1><p className="page-subtitle">Traçabilité complète des opérations</p></div>
        <button className="btn btn-secondary" onClick={loadLogs}><RefreshCw size={15} />Actualiser</button>
      </div>
      <div className="page-body">
        <div className="card">
          <div className="table-wrapper">
            <table>
              <thead><tr><th>Horodatage</th><th>Opérateur</th><th>Action</th></tr></thead>
              <tbody>
                {logs.length === 0
                  ? <tr><td colSpan={3} className="table-empty">Aucun journal disponible</td></tr>
                  : logs.map(log => (
                    <tr key={log.id} className="log-row">
                      <td>{fmt(log.timestamp)}</td>
                      <td><span className="badge badge-purple">{log.operator_name}</span></td>
                      <td style={{ fontSize: 13 }}>{log.action_description}</td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </>
  );
}
