export const formatDate = (dateStr: string): string => {
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  } catch {
    return dateStr;
  }
};

export const formatDateTime = (dateStr: string): string => {
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return dateStr;
  }
};

export const formatDaysRemaining = (deadlineStr: string): string => {
  try {
    const now = Date.now();
    const end = new Date(deadlineStr).getTime();
    const diffDays = Math.ceil((end - now) / (1000 * 60 * 60 * 24));
    if (diffDays < 0) return 'Concluded';
    if (diffDays === 0) return 'Ending today';
    if (diffDays === 1) return '1 day remaining';
    return `${diffDays} days remaining`;
  } catch {
    return '';
  }
};
