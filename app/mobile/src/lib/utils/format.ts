export function formatBaht(amount: number): string {
  const formatted = new Intl.NumberFormat('th-TH', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
  return `฿${formatted}`;
}

export function timeAgo(date: string | Date, now: Date = new Date()): string {
  const targetDate = typeof date === 'string' ? new Date(date) : date;
  const diffSeconds = Math.max(0, Math.floor((now.getTime() - targetDate.getTime()) / 1000));

  if (diffSeconds < 60) {
    return 'เมื่อกี้';
  }

  const diffMinutes = Math.floor(diffSeconds / 60);
  if (diffMinutes < 60) {
    return `${diffMinutes} นาทีที่แล้ว`;
  }

  const diffHours = Math.floor(diffMinutes / 60);
  return `${diffHours} ชม.ที่แล้ว`;
}
