export const formatCurrency = (value, decimals = 1) => {
  if (!value && value !== 0) return '—';
  return `${Number(value).toFixed(decimals)}M €`;
};

export const formatDate = (dateStr) => {
  if (!dateStr) return '—';
  try {
    return new Date(dateStr).toLocaleDateString('fr-FR');
  } catch {
    return dateStr;
  }
};

export const getPositionColor = (position) => {
  const colors = {
    'Gardien': '#f59e0b',
    'GK': '#f59e0b',
    'Défenseur': '#3b82f6',
    'DC': '#3b82f6', 'DD': '#3b82f6', 'DG': '#3b82f6',
    'Milieu': '#22c55e',
    'MC': '#22c55e', 'MO': '#22c55e', 'MD': '#22c55e', 'MG': '#22c55e',
    'Attaquant': '#ef4444',
    'AIG': '#ef4444', 'AID': '#ef4444', 'BU': '#ef4444',
  };
  return colors[position] || '#64748b';
};

export const getStatusColor = (status) => {
  const colors = {
    'actif': '#22c55e',
    'blessé': '#ef4444',
    'suspendu': '#f59e0b',
    'prêté': '#8b5cf6',
    'transfert': '#3b82f6',
  };
  return colors[status?.toLowerCase()] || '#64748b';
};

export const daysUntil = (dateStr) => {
  if (!dateStr) return null;
  const diff = new Date(dateStr) - new Date();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
};

export const truncate = (str, len = 25) => {
  if (!str) return '';
  return str.length > len ? str.substring(0, len) + '…' : str;
};
