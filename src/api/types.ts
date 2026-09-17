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

/**
 * 백엔드 소유 스키마(app)가 이 DB에 있는지. status 판정에는 들어가지 않는다 —
 * 없어도 답변·검색·채점은 정상이고 GET /feedback 하나만 503이 된다.
 */
export type BackendSchemaStatus = {
  table: string;
  available: boolean;
  rows?: number;
};

export type HealthResponse = {
  /** ok=조회 가능 / degraded=테이블이 없거나 비어 있음 / down=DB 연결 실패 */
  status: 'ok' | 'degraded' | 'down';
  database: boolean;
  tables?: TableStatus[];
  backend?: BackendSchemaStatus | null;
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
  /** 재빌드가 도는 중인지. false가 될 때까지 폴링한다 */
  rebuilding: boolean;
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

/** 답변 유형. 표시용 라벨은 ANSWER_TYPE_LABELS에 있다. */
export const ANSWER_TYPES = [
  'concept',
  'step',
  'judgement',
  'troubleshoot',
  'explore',
  'no_answer',
] as const;

export const ANSWER_TYPE_LABELS: Record<string, string> = {
  concept: '개념형',
  step: '단계형',
  judgement: '판단형',
  troubleshoot: '문제해결형',
  explore: '탐색형',
  no_answer: '답변 불가',
};

/** 모르는 유형이 오면 원래 값을 그대로 보여준다. */
export function answerTypeLabel(value: string): string {
  return ANSWER_TYPE_LABELS[value] ?? value;
}

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

/* ── 사용자 피드백 ─────────────────────────────────────── */

export type FeedbackRating = 'GOOD' | 'BAD';

/** match=사용자와 판정자가 같은 방향 / mismatch=엇갈림 / unevaluated=아직 채점 안 됨 */
export type Agreement = 'match' | 'mismatch' | 'unevaluated';

export const AGREEMENT_LABELS: Record<Agreement, string> = {
  match: '일치',
  mismatch: '엇갈림',
  unevaluated: '미평가',
};

/** 사용자가 고를 수 있는 항목. 좋아요/싫어요에 따라 목록이 다르다. */
export const FEEDBACK_REASONS: Record<FeedbackRating, string[]> = {
  GOOD: [
    'ACCURATE',
    'EASY_TO_UNDERSTAND',
    'WANTED_ANSWER',
    'EASY_TO_FOLLOW',
    'SUFFICIENT',
    'USEFUL_LINK',
  ],
  BAD: ['OFF_TOPIC', 'INACCURATE', 'NOT_FOUND', 'INSUFFICIENT', 'TOO_DIFFICULT', 'BROKEN_LINK'],
};

export const REASON_LABELS: Record<string, string> = {
  ACCURATE: '정확함',
  EASY_TO_UNDERSTAND: '이해하기 쉬움',
  WANTED_ANSWER: '원하던 답',
  EASY_TO_FOLLOW: '따라하기 쉬움',
  SUFFICIENT: '충분함',
  USEFUL_LINK: '링크가 유용함',
  OFF_TOPIC: '질문과 다름',
  INACCURATE: '부정확함',
  NOT_FOUND: '못 찾음',
  INSUFFICIENT: '설명 부족',
  TOO_DIFFICULT: '너무 어려움',
  BROKEN_LINK: '링크 오류',
};

/** 사용자가 남긴 평가 1건 + 같은 턴에 대한 판정자의 평가 */
export type FeedbackOut = {
  /** 두 평가를 잇는 키. 백엔드가 저장하지 않았으면 null이고, 그 턴은 단건 조회가 안 된다 */
  qna_uuid?: string | null;
  message_id: number;
  conversation_id?: string | null;
  rating: string;
  reason?: string | null;
  feedback_created_at: string;
  /** 우리 로그가 없는 행이면 null */
  raw_query?: string | null;
  answer_type?: string | null;
  answered_at?: string | null;
  verdict?: string | null;
  faithfulness?: number | null;
  answer_relevance?: number | null;
  context_relevance?: number | null;
  issues?: string[];
  agreement: Agreement;
};

export type FeedbackDetail = FeedbackOut & {
  cleaned_query?: string | null;
  answer_text?: string | null;
  retrieved_doc_ids?: string[];
  /** 판정자의 감점 사유 */
  eval_reason?: string | null;
};

/** rating × verdict 교차표 한 칸 */
export type AgreementStat = {
  rating: string;
  /** 아직 채점 안 됐으면 null */
  verdict?: string | null;
  agreement: Agreement;
  count: number;
};
