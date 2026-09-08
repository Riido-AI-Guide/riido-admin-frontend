/**
 * 서버가 준 UTC ISO-8601 문자열을 사용자 로컬 시간대의 시:분으로 보여준다.
 */
export function formatMessageTime(isoString: string): string {
  const date = new Date(isoString);

  if (Number.isNaN(date.getTime())) {
    return '';
  }

  return new Intl.DateTimeFormat(undefined, {
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

/** 목록·상세에 쓰는 'YYYY. MM. DD. HH:mm' 표기. */
export function formatDateTime(isoString?: string | null): string {
  if (!isoString) return '-';

  const date = new Date(isoString);
  if (Number.isNaN(date.getTime())) return '-';

  return new Intl.DateTimeFormat('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

/** '3분 전'처럼 지금으로부터 얼마나 지났는지. 목록에서 최신 여부만 볼 때 쓴다. */
export function formatRelative(isoString?: string | null): string {
  if (!isoString) return '-';

  const date = new Date(isoString);
  if (Number.isNaN(date.getTime())) return '-';

  const diffSeconds = Math.round((date.getTime() - Date.now()) / 1000);
  const units: [Intl.RelativeTimeFormatUnit, number][] = [
    ['second', 60],
    ['minute', 60],
    ['hour', 24],
    ['day', 30],
    ['month', 12],
    ['year', Number.POSITIVE_INFINITY],
  ];

  const formatter = new Intl.RelativeTimeFormat('ko-KR', { numeric: 'auto' });
  let value = diffSeconds;

  for (const [unit, size] of units) {
    if (Math.abs(value) < size) return formatter.format(Math.round(value), unit);
    value /= size;
  }

  return formatter.format(Math.round(value), 'year');
}
