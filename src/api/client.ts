import { env } from '@/lib/env';

/** Spring 기본 에러 응답 형식 */
export type ApiErrorBody = {
  status?: number;
  error?: string;
  message?: string;
};

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
      body?.message ?? `요청에 실패했습니다 (HTTP ${response.status})`,
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
    if (error.status === 400) {
      return '질문 내용을 입력해 주세요.';
    }
    if (error.status >= 500) {
      return 'AI 서버에서 답변을 받지 못했습니다. 잠시 후 다시 시도해 주세요.';
    }
    return error.message;
  }

  if (error instanceof NetworkError) {
    return '서버에 연결하지 못했습니다. 네트워크 상태를 확인한 뒤 다시 시도해 주세요.';
  }

  return '알 수 없는 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.';
}
