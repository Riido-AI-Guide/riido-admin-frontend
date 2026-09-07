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
