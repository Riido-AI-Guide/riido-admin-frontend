import { env } from '@/lib/env';

/** FastAPI 기본 에러 응답 형식. detail은 문자열이거나 검증 오류 배열이다. */
export type ApiErrorBody = {
  detail?: string | { msg?: string; loc?: (string | number)[] }[];
  status?: number;
  error?: string;
  message?: string;
};

/** 서버가 준 에러 본문에서 사람이 읽을 문장 하나를 뽑는다. */
function readDetail(body: ApiErrorBody | null): string | null {
  if (!body) return null;

  if (typeof body.detail === 'string') return body.detail;

  if (Array.isArray(body.detail)) {
    const messages = body.detail.map((item) => item.msg).filter(Boolean);
    if (messages.length > 0) return messages.join(' / ');
  }

  return body.message ?? null;
}

/** 서버가 2xx 이외의 상태로 응답했을 때 던진다. */
export class ApiError extends Error {
  readonly status: number;
  readonly body: ApiErrorBody | null;

  constructor(message: string, status: number, body: ApiErrorBody | null) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.body = body;
  }
}

/** 서버에 아예 닿지 못했을 때(오프라인, CORS, 서버 다운 등) 던진다. */
export class NetworkError extends Error {
  constructor(message: string, options?: ErrorOptions) {
    super(message, options);
    this.name = 'NetworkError';
  }
}

async function readJson<T>(response: Response): Promise<T | null> {
  try {
    return (await response.json()) as T;
  } catch {
    return null;
  }
}

export async function request<T>(path: string, init?: RequestInit): Promise<T> {
  let response: Response;

  try {
    response = await fetch(`${env.apiBaseUrl}${path}`, {
      // 백엔드가 credentials를 허용하도록 열려 있어, 이후 세션 인증이 붙어도 그대로 동작한다.
      credentials: 'include',
      ...init,
      headers: {
        'Content-Type': 'application/json',
        ...init?.headers,
      },
    });
  } catch (cause) {
    throw new NetworkError('서버에 연결하지 못했습니다.', { cause });
  }

  if (!response.ok) {
    const body = await readJson<ApiErrorBody>(response);
    throw new ApiError(
      readDetail(body) ?? `요청에 실패했습니다 (HTTP ${response.status})`,
      response.status,
      body,
    );
  }

  const data = await readJson<T>(response);
  if (data === null) {
    throw new ApiError('서버 응답을 해석하지 못했습니다.', response.status, null);
  }

  return data;
}

/** 에러 객체를 화면에 그대로 띄울 수 있는 한국어 문장으로 바꾼다. */
export function toUserMessage(error: unknown): string {
  if (error instanceof ApiError) {
    if (error.status === 404) {
      return error.message || '대상을 찾지 못했습니다.';
    }
    if (error.status === 409) {
      return error.message || '채점 대상이 아닌 요청입니다.';
    }
    if (error.status === 502) {
      return error.message || '판정자 LLM 호출에 실패했습니다. 잠시 후 다시 시도해 주세요.';
    }
    if (error.status >= 500) {
      return '서버에서 요청을 처리하지 못했습니다. 잠시 후 다시 시도해 주세요.';
    }
    return error.message;
  }

  if (error instanceof NetworkError) {
    return '서버에 연결하지 못했습니다. 네트워크 상태를 확인한 뒤 다시 시도해 주세요.';
  }

  return '알 수 없는 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.';
}
