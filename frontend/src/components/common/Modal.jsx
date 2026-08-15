import { X } from 'lucide-react';

export function Modal({ title, children, footer, onClose, maxWidth = 520 }) {
  return (
    <div className="modal-backdrop" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={{ maxWidth }}>
        <div className="modal-header">
          <h3 className="modal-title">{title}</h3>
          <button className="btn btn-secondary btn-icon" onClick={onClose}>
            <X size={16} />
          </button>
        </div>
        <div className="modal-body">{children}</div>
        {footer && <div className="modal-footer">{footer}</div>}
      </div>
    </div>
  );
}
