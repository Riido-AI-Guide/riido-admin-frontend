import { request } from '@/api/client';
import type {
  AnswerEvaluationOut,
  AnswerUnitDetail,
  AnswerUnitListItem,
  DocCoverageDetail,
  DocSentenceSet,
  EvaluationRunRequest,
  EvaluationRunResponse,
  HealthResponse,
  IndexStatus,
  Page,
  QnaLogOut,
  QnaStatus,
  SentenceInput,
  ViewTypeStat,
} from '@/api/types';

type QueryValue = string | number | boolean | null | undefined | string[];

/** undefined·빈 문자열은 빼고, 배열은 같은 키를 반복해 붙인다(FastAPI가 받는 형태). */
function toQuery(params: Record<string, QueryValue>): string {
  const search = new URLSearchParams();

  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === '') continue;

    if (Array.isArray(value)) {
      for (const item of value) search.append(key, item);
      continue;
    }

    search.append(key, String(value));
  }

  const query = search.toString();
  return query ? `?${query}` : '';
}

/**
 * doc_id는 `guide/팀/팀-관리`처럼 슬래시를 품고 있고 서버 라우트가 path 파라미터로 받는다.
 * 슬래시는 그대로 두고 각 조각만 인코딩한다.
 */
function docPath(docId: string): string {
  return docId
    .split('/')
    .map((segment) => encodeURIComponent(segment))
    .join('/');
}

/* ── 상태 ─────────────────────────────────────────────── */

export function getHealth() {
  return request<HealthResponse>('/api/v1/health');
}

export function getIndexStatus() {
  return request<IndexStatus>('/api/v1/index-status');
}

/* ── 근거 문서 ─────────────────────────────────────────── */

export type AnswerUnitListParams = {
  source_type?: string;
  q?: string;
  include_content?: boolean;
  limit?: number;
  offset?: number;
};

export function listAnswerUnits(params: AnswerUnitListParams = {}) {
  return request<Page<AnswerUnitListItem>>(`/api/v1/answer-units${toQuery({ ...params })}`);
}

export function getAnswerUnit(docId: string) {
  return request<AnswerUnitDetail>(`/api/v1/answer-units/${docPath(docId)}`);
}

/* ── 검색 문장 ─────────────────────────────────────────── */

export function getDocCoverage(docId: string) {
  return request<DocCoverageDetail>(`/api/v1/search-units/coverage/${docPath(docId)}`);
}

/** 전체 교체다 — 화면에 남은 문장 목록을 그대로 보내면 추가·수정·삭제가 한 번에 반영된다. */
export function saveDocSentences(docId: string, items: SentenceInput[]) {
  return request<DocSentenceSet>(`/api/v1/search-units/coverage/${docPath(docId)}`, {
    method: 'PUT',
    body: JSON.stringify({ items }),
  });
}

export function draftSentences(docId: string, hypoCount = 3, excludeExisting = true) {
  return request<{ doc_id: string; items: SentenceInput[] }>('/api/v1/search-units/draft', {
    method: 'POST',
    body: JSON.stringify({
      doc_id: docId,
      hypo_count: hypoCount,
      exclude_existing: excludeExisting,
    }),
  });
}

export function getViewTypeStats() {
  return request<ViewTypeStat[]>('/api/v1/search-units/stats');
}

/* ── 평가 ─────────────────────────────────────────────── */

export type EvaluationListParams = {
  qna_uuid?: string[];
  conversation_id?: string;
  verdict?: string;
  issue?: string;
  answer_type?: string;
  q?: string;
  limit?: number;
  offset?: number;
};

export function listEvaluations(params: EvaluationListParams = {}) {
  return request<Page<AnswerEvaluationOut>>(`/api/v1/evaluations${toQuery({ ...params })}`);
}

export function getEvaluation(qnaUuid: string) {
  return request<AnswerEvaluationOut>(`/api/v1/evaluations/${encodeURIComponent(qnaUuid)}`);
}

/** 판정자 LLM을 1회 호출하므로 수 초 걸린다. 응답이 곧 새 평가 결과다. */
export function runEvaluation(qnaUuid: string) {
  return request<AnswerEvaluationOut>(`/api/v1/evaluations/${encodeURIComponent(qnaUuid)}`, {
    method: 'POST',
  });
}

/** 202로 먼저 답하고 채점은 뒤에서 돈다 — 진행 상황은 미평가 건수로 확인한다. */
export function runEvaluations(body: EvaluationRunRequest) {
  return request<EvaluationRunResponse>('/api/v1/evaluations/run', {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

/* ── 질의응답 로그 ─────────────────────────────────────── */

export type QnaListParams = {
  qna_uuid?: string[];
  status?: QnaStatus;
  answer_type?: string;
  conversation_id?: string;
  q?: string;
  include_answer?: boolean;
  limit?: number;
  offset?: number;
};

export function listQna(params: QnaListParams = {}) {
  return request<Page<QnaLogOut>>(`/api/v1/qna${toQuery({ ...params })}`);
}
