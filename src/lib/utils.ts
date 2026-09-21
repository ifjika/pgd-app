export function formatCurrency(amount: number, currency: string = 'USD'): string {
  if (currency === 'IDR') {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(amount);
  }
  return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(amount);
}

export function formatDate(date: string | Date): string {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Asia/Jakarta',
  }).format(new Date(date));
}

export function formatDateShort(date: string | Date): string {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Asia/Jakarta',
  }).format(new Date(date));
}

export function getStatusBadgeClass(status: string): string {
  const map: Record<string, string> = {
    success: 'badge-success',
    completed: 'badge-success',
    active: 'badge-success',
    delivered: 'badge-success',
    pending: 'badge-pending',
    processing: 'badge-processing',
    approved: 'badge-processing',
    failed: 'badge-failed',
    rejected: 'badge-failed',
    suspended: 'badge-failed',
    expired: 'badge-expired',
    refunded: 'badge-refunded',
    partially_refunded: 'badge-refunded',
  };
  return map[status] || 'badge-pending';
}

export function truncateId(id: string): string {
  if (!id) return '';
  return `${id.substring(0, 8)}...`;
}

export function classNames(...classes: (string | boolean | undefined | null)[]): string {
  return classes.filter(Boolean).join(' ');
}
