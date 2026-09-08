/**
 * FastAPI(/openapi.json)의 스키마를 화면에서 쓰는 만큼만 옮겨 둔 타입.
 * 서버 스키마가 바뀌면 여기부터 고친다.
 */

/** 목록 응답 공통 포맷 */
export type Page<T> = {
  total: number;
  limit: number;
  offset: number;
  items: T[];
};

/* ── health ───────────────────────────────────────────── */

export type TableStatus = {
  table: string;
  exists: boolean;
  rows: number;
};

export type HealthResponse = {
  /** ok=조회 가능 / degraded=테이블이 없거나 비어 있음 / down=DB 연결 실패 */
  status: 'ok' | 'degraded' | 'down';
  database: boolean;
  tables?: TableStatus[];
  hint?: string | null;
};

/* ── 근거 문서(answer_units) ───────────────────────────── */

/** 유형별 검색 문장 수. 유형은 서버가 늘릴 수 있어 고정 키로 두지 않는다. */
export type ViewTypeCounts = Record<string, number>;

export type AnswerUnitListItem = {
  doc_id: string;
  title: string;
  section: string;
  source_type: string;
  ord_idx: number;
  url?: string;
  content?: string | null;
  view_types?: ViewTypeCounts;
};

export type SearchUnitOut = {
  id: number;
  doc_id: string;
  view_type: string;
  text: string;
};

export type AnswerUnitDetail = {
  doc_id: string;
  title: string;
  section: string;
  source_type: string;
  ord_idx: number;
  url?: string;
  content?: string | null;
  search_units?: SearchUnitOut[];
};

/* ── 검색 문장(search_units) ───────────────────────────── */

/** 서버가 입력으로 받는 유형. 표시용 라벨은 VIEW_TYPE_LABELS에 있다. */
export const VIEW_TYPES = ['hypo_q', 'real_q', 'contextual'] as const;
export type ViewType = (typeof VIEW_TYPES)[number];

export const VIEW_TYPE_LABELS: Record<string, string> = {
  hypo_q: '가설 질문',
  real_q: '실제 질문',
  contextual: '맥락 요약',
};

export const SENTENCE_MAX_PER_DOC = 30;
export const SENTENCE_TEXT_MIN = 2;
export const SENTENCE_TEXT_MAX = 300;

export type DocSentence = {
  id: number;
  view_type: string;
  text: string;
  /** file=rag_view_sentences.json / console=콘솔에서 등록 */
  source: string;
  /** 본문이 바뀐 뒤 손보지 않은 문장 */
  outdated: boolean;
  updated_at: string;
};

/** missing=벡터 검색에서 빠짐 / outdated=본문 변경 후 미수정 / ok=최신 */
export type CoverageStatus = 'missing' | 'outdated' | 'ok';

export type DocSentenceSet = {
  doc_id: string;
  title: string;
  section: string;
  status: CoverageStatus;
  units: number;
  outdated: number;
  view_types?: ViewTypeCounts;
  content_updated_at?: string | null;
  sentences?: DocSentence[];
};

export type DocCoverageDetail = DocSentenceSet & {
  url?: string;
  content: string;
};

export type SentenceInput = {
  view_type: ViewType;
  text: string;
};

export type ViewTypeStat = {
  view_type: string;
  units: number;
  docs: number;
};

/* ── 인덱스 상태 ───────────────────────────────────────── */

/** 낡은 문서 묶음. doc_ids는 앞 20건 표본이고 count가 전체다. */
export type StaleGroup = {
  count: number;
  doc_ids?: string[];
};

export type IndexStatus = {
  status: 'ok' | 'stale';
  answer_units: number;
  built_at?: string | null;
  /** 검색 문장이 없어 벡터 검색에서 빠진 문서 — 사람이 문장을 채워야 한다 */
  no_search_units: StaleGroup;
  /** 원문 인덱스가 없어 키워드 검색에서 빠진 문서 */
  no_content_vector: StaleGroup;
  /** 옛 본문으로 색인된 문서 */
  outdated_content_vector: StaleGroup;
  hint?: string | null;
};

/* ── 평가 ─────────────────────────────────────────────── */

export type EvaluationIssue = 'factual_error' | 'insufficient' | 'irrelevant' | 'retrieval_miss';

export const EVALUATION_ISSUES: EvaluationIssue[] = [
  'factual_error',
  'insufficient',
  'irrelevant',
  'retrieval_miss',
];

export const ISSUE_LABELS: Record<string, string> = {
  factual_error: '사실 오류',
  insufficient: '설명 부족',
  irrelevant: '질문과 무관',
  retrieval_miss: '검색 실패',
};

export type AnswerEvaluationOut = {
  qna_uuid: string;
  conversation_id?: string | null;
  raw_query: string;
  cleaned_query: string;
  answer_type: string;
  /** 0.0~1.0. 1.0일수록 환각이 없다 */
  faithfulness: number;
  answer_relevance: number;
  context_relevance: number;
  verdict: string;
  issues?: string[];
  reason?: string;
  created_at: string;
  updated_at: string;
};

export type EvaluationRunRequest = {
  /** 최대 50건. 생략하면 서버가 미평가에서 최근 limit건을 고른다 */
  qna_uuids?: string[];
  limit?: number;
};

export const EVALUATION_RUN_MAX = 50;

export type EvaluationRunResponse = {
  queued: string[];
  skipped?: string[];
  not_found?: string[];
  hint: string;
};

/* ── 질의응답 로그 ─────────────────────────────────────── */

/** pending=미평가 / evaluated=채점됨 / skipped=인사·잡담이라 채점 대상 아님 */
export type QnaStatus = 'pending' | 'evaluated' | 'skipped';

export const QNA_STATUS_LABELS: Record<QnaStatus, string> = {
  pending: '미평가',
  evaluated: '평가됨',
  skipped: '대상 아님',
};

export type QnaLogOut = {
  qna_uuid: string;
  conversation_id?: string | null;
  raw_query: string;
  cleaned_query: string;
  answer_type: string;
  /** 검색으로 가져온 문서 전체. 인용된 것만이 아니다 */
  retrieved_doc_ids?: string[];
  status: QnaStatus;
  verdict?: string | null;
  created_at: string;
  answer_text?: string | null;
};
