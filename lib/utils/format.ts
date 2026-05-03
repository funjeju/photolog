import { format, formatDistanceToNow } from 'date-fns';
import { ko } from 'date-fns/locale';

export function formatDate(date: Date | null | undefined): string {
  if (!date) return '';
  return format(date, 'yyyy년 M월 d일', { locale: ko });
}

export function formatDateTime(date: Date | null | undefined): string {
  if (!date) return '';
  return format(date, 'yyyy.MM.dd HH:mm', { locale: ko });
}

export function formatRelative(date: Date | null | undefined): string {
  if (!date) return '';
  return formatDistanceToNow(date, { addSuffix: true, locale: ko });
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes}B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
}
