export const fmt = (n: number | string | null | undefined): string => {
  if (n == null) return '0';
  return Number(n).toLocaleString('en-GB', { minimumFractionDigits: 0, maximumFractionDigits: 2 });
};

export const fmtDate = (d: string | null | undefined): string => {
  if (!d || d === 'null') return '—';
  try {
    return new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  } catch {
    return d;
  }
};

export const isExp = (d: string | null | undefined): boolean => {
  return !!d && new Date(d) < new Date();
};

export const dLeft = (d: string | null | undefined): number | null => {
  if (!d) return null;
  return Math.ceil((new Date(d).getTime() - new Date().getTime()) / 864e5);
};

export const sBadge = (s: string | undefined): string => {
  const map: Record<string, string> = {
    active: 'green', available: 'green', completed: 'green', paid: 'green', done: 'green',
    draft: 'gray', sent: 'blue', pending: 'amber', live: 'blue',
    overdue: 'red', cancelled: 'red', suspended: 'red', expired: 'red',
    inactive: 'gray', assigned: 'blue', upcoming: 'amber',
  };
  return map[(s || '').toLowerCase()] || 'gray';
};

export const getInitials = (firstName: string, lastName: string): string => {
  return ((firstName || '?')[0] + (lastName || '?')[0]).toUpperCase();
};

const avatarColors = [
  { bg: '#e8f1fb', text: '#185fa5' },
  { bg: '#fef6e4', text: '#8a5a00' },
  { bg: '#eaf5ec', text: '#2d7a3a' },
  { bg: '#fef0f0', text: '#a32d2d' },
  { bg: '#f3eafa', text: '#6b3fa0' },
  { bg: '#e8f6f6', text: '#0f766e' },
];

export const getAvatarColor = (name: string) => {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  const idx = Math.abs(hash) % avatarColors.length;
  return avatarColors[idx];
};
