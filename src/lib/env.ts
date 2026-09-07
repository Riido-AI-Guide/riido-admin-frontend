export const env = {
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL,
} as const;

if (!env.apiBaseUrl) {
  throw new Error('VITE_API_BASE_URL이 설정되지 않았습니다. .env.local을 확인하세요.');
}
