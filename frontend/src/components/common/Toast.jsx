import { useEffect } from 'react';
import { Check, AlertCircle, Bell, X } from 'lucide-react';

export function Toast({ msg, type = 'info', onClose }) {
  useEffect(() => {
    const timer = setTimeout(onClose, 4000);
    return () => clearTimeout(timer);
  }, [onClose]);

  const icons = {
    success: <Check size={16} />,
    error: <AlertCircle size={16} />,
    info: <Bell size={16} />,
    warning: <AlertCircle size={16} />
  };

  return (
    <div style={{ position: 'fixed', bottom: 24, right: 24, zIndex: 9999, minWidth: 280, maxWidth: 380 }}>
      <div className={`alert alert-${type}`} style={{ boxShadow: '0 8px 32px rgba(0,0,0,0.4)', padding: '14px 18px', display: 'flex', alignItems: 'center', gap: '10px' }}>
        {icons[type] || icons.info}
        <span style={{ flex: 1 }}>{msg}</span>
        <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'inherit', padding: 0 }}>
          <X size={14} />
        </button>
      </div>
    </div>
  );
}
