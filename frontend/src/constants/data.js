export const POLES = {
  'Pôle Technologie': [
    'Génie Logiciel & Dev Web',
    'CyberSécurité & Réseaux',
    'Data & Intelligence Artificielle'
  ],
  'Pôle Management': [
    'Management Digital & SI',
    'Marketing & Communication Digital',
    'Finance & Gestion'
  ]
};

export const ALL_FILIERES = [
  'Génie Logiciel & Dev Web',
  'CyberSécurité & Réseaux',
  'Data & Intelligence Artificielle',
  'Management Digital & SI',
  'Marketing & Communication Digital',
  'Finance & Gestion'
];

export const ALL_NIVEAUX = [
  '1ère année',
  '2ème année',
  '3ème année'
];

export function initials(m) {
  if (!m) return '?';
  const f = (m.first_name || '?')[0];
  const l = (m.last_name || '?')[0];
  return `${f}${l}`.toUpperCase();
}

export function fmt(iso) {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' });
  } catch (e) {
    return iso;
  }
}
