import { useRef } from 'react';

export function VirtualCard({ member, cardRef }) {
  const wrapRef = useRef(null);
  const glareRef = useRef(null);

  function handleMouseMove(e) {
    const card = wrapRef.current;
    if (!card) return;
    const rect = card.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const dx = e.clientX - cx;
    const dy = e.clientY - cy;

    const rotY = (dx / (rect.width / 2)) * 15;
    const rotX = -(dy / (rect.height / 2)) * 15;
    card.style.transform = `rotateX(${rotX}deg) rotateY(${rotY}deg) scale(1.03)`;
    card.style.boxShadow = `
      ${-rotY * 1.5}px ${rotX * 1.5}px 60px rgba(0,0,0,0.7),
      0 0 0 1px rgba(255,255,255,0.05),
      inset 0 1px 0 rgba(255,255,255,0.09),
      ${-rotY * 0.8}px ${rotX * 0.8}px 80px rgba(0,212,255,0.18),
      ${-rotY * 0.4}px ${rotX * 0.4}px 40px rgba(124,58,237,0.12)
    `;

    if (glareRef.current) {
      const mx = ((e.clientX - rect.left) / rect.width) * 100;
      const my = ((e.clientY - rect.top) / rect.height) * 100;
      glareRef.current.style.setProperty('--mx', `${mx}%`);
      glareRef.current.style.setProperty('--my', `${my}%`);
    }
  }

  function handleMouseLeave() {
    const card = wrapRef.current;
    if (!card) return;
    card.style.transform = 'rotateX(0deg) rotateY(0deg) scale(1)';
    card.style.boxShadow = '';
  }

  return (
    <div
      className="member-card"
      ref={el => { wrapRef.current = el; if (cardRef) cardRef.current = el; }}
      id="virtual-card"
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      <div className="card-particles">
        {[...Array(6)].map((_, i) => <div key={i} className="card-particle" />)}
      </div>

      <div className="card-glare" ref={glareRef} />

      <div className="card-chip">
        <div className="card-chip-lines">
          <span /><span /><span />
        </div>
      </div>

      <div className="card-logo-area">
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <img src="/logo.png" alt="Logo" style={{ height: 26, width: 'auto', filter: 'drop-shadow(0 0 6px rgba(0,212,255,0.6))' }} />
          <div>
            <div style={{ fontWeight: 800, fontSize: 13, letterSpacing: 1.5, color: '#00d4ff', lineHeight: 1 }}>C-TECH</div>
            <div className="card-club-sub" style={{ fontSize: 7.5, color: '#94a3b8', letterSpacing: 0.5 }}>Club Étudiant</div>
          </div>
        </div>
      </div>

      {member?.photo_path && (
        <div className="card-photo-circle">
          <img src={`/${member.photo_path}`} alt="" />
        </div>
      )}

      <div className="card-member-info">
        <div className="card-member-name">{member?.first_name} {member?.last_name}</div>
        <div className="card-member-major">{member?.major}</div>
        <div className="card-member-number">{member?.member_number}</div>
        <div className="card-member-level">{member?.level}</div>
      </div>

      <div className="card-qr-area">
        {member?.qr_code_path
          ? <img src={`/${member.qr_code_path}`} alt="QR" />
          : <div style={{ fontSize: 9, color: '#999', textAlign: 'center' }}>QR Code</div>}
      </div>
    </div>
  );
}
