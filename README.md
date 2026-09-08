# riido-admin-frontend

뤼이도 AI 가이드 운영콘솔 - 관리자용 프론트엔드

RAG 챗봇의 근거 문서·질문 쿼리·답변 평가·질의응답 로그를 다루는 운영 화면입니다.
백엔드는 FastAPI이고, 스펙은 http://127.0.0.1:8000/docs 에서 볼 수 있습니다.

## 기술 스택

React 19 · TypeScript · Vite · Tailwind CSS 4 · Base UI (shadcn/ui)

## 요구 사항

- Node.js 22 이상

## 시작하기

```bash
npm install
npm run dev
```

`npm install`이 패키지 설치와 커밋 훅 설정을 함께 처리합니다.
개발 서버는 http://localhost:5174 에서 열립니다.

## 환경변수

프로젝트 루트에 `.env` 파일을 만들고 아래를 채웁니다.

```
VITE_API_BASE_URL=http://127.0.0.1:8000
```

| 키 | 설명 |
|---|---|
| `VITE_API_BASE_URL` | 백엔드(FastAPI) API 주소 |

`.env`를 고친 뒤에는 개발 서버를 다시 띄워야 반영됩니다.

`VITE_` 접두사가 붙은 값만 브라우저 코드에 노출됩니다.
빌드 결과물에 그대로 포함되므로 비밀 값은 넣지 않습니다.

## VS Code 설정

프로젝트를 처음 열면 확장 설치 알림이 뜹니다.
알림을 놓쳤다면 확장 탭에서 `@recommended`를 검색해 설치하세요.

- Prettier - Code formatter (저장 시 자동 포맷)
- ESLint (실시간 문제 표시)
- Tailwind CSS IntelliSense (클래스 자동완성)

확장이 없어도 개발은 가능하지만, 저장 시 자동 포맷이 동작하지 않습니다.

## 스크립트

| 명령 | 설명 |
|---|---|
| `npm run dev` | 개발 서버 실행 |
| `npm run build` | 프로덕션 빌드 |
| `npm run preview` | 빌드 결과 미리보기 |
| `npm run lint` | 린트 검사 |
| `npm run lint:fix` | 린트 자동 수정 |
| `npm run format` | 코드 포맷 |
| `npm run format:check` | 포맷 검사 |
| `npm run type-check` | 타입 검사 |

## 화면 구성

| 화면 | 경로 | 쓰는 API |
|---|---|---|
| 공통 세그먼트 바 | 모든 화면 | `GET /api/v1/health` — 테이블 행 수로 세그먼트별 항목 수를 표시 |
| 근거 문서·질문 쿼리 | `/documents` | `GET /answer-units`, `GET /answer-units/{doc_id}`, `GET·PUT /search-units/coverage/{doc_id}`, `POST /search-units/draft`, `GET /index-status` |
| 평가 | `/evaluations` | `GET /evaluations`, `GET·POST /evaluations/{qna_uuid}` |
| 질의응답 로그 | `/qna` | `GET /qna`, `POST /evaluations/{qna_uuid}`, `POST /evaluations/run` |

목록의 필터·페이지·열린 단건은 모두 주소(쿼리스트링)에 남아, 링크를 그대로 공유할 수 있습니다.

질문 쿼리 저장은 **전체 교체**입니다(`PUT /search-units/coverage/{doc_id}`).
화면에 남아 있는 목록을 그대로 보내므로 추가·수정·삭제가 저장 한 번으로 끝나고,
빠진 문장은 서버에서 지워집니다.

## 폴더 구조

```
src/
├── api/           서버 타입(types.ts)과 엔드포인트(console.ts, client.ts)
├── components/
│   ├── console/   목록·패널 등 운영 화면 전용 컴포넌트
│   ├── layout/    세그먼트 바가 있는 공통 레이아웃
│   └── ui/        shadcn/ui 컴포넌트
├── hooks/         useResource(단일 GET), useToast, useHealth 등
├── lib/           유틸리티 (cn, 날짜 포맷)
├── pages/         세그먼트별 화면
├── index.css      디자인 토큰
├── main.tsx
└── App.tsx
```

경로 별칭 `@/`는 `src/`를 가리킵니다.

```ts
import { Button } from '@/components/ui/button';
```

## 컴포넌트 추가

shadcn/ui 컴포넌트는 CLI로 가져옵니다.

```bash
npx shadcn@latest add dialog
```

`src/components/ui/`에 소스가 복사되며, 이후 자유롭게 수정할 수 있습니다.

### 가져올 수 있는 컴포넌트 확인

- 전체 목록과 동작 예시: https://ui.shadcn.com/docs/components
- Base UI 문서: https://base-ui.com/react/overview/quick-start

터미널에서 목록을 직접 고를 수도 있습니다.

```bash
npx shadcn@latest add
```

컴포넌트 이름 없이 실행하면 선택 가능한 목록이 표시됩니다.
방향키로 이동, 스페이스로 다중 선택, 엔터로 확정합니다.

## 커밋 규칙

커밋 시 아래 검사가 자동으로 실행되며, 통과해야 커밋됩니다.

- Prettier 포맷
- ESLint
- TypeScript 타입 검사

터미널과 VS Code 커밋 버튼 모두 동일하게 적용됩니다.
VS Code에서 커밋이 실패하면 원인은 아래에서 확인합니다.

```
소스 컨트롤 패널 → 우측 상단 ··· → View Git Output
```

검사를 건너뛰려면 `--no-verify`를 사용할 수 있으나 권장하지 않습니다.