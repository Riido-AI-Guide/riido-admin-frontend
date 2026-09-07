# riido-admin-frontend

뤼이도 AI 가이드 운영콘솔 - 관리자용 프론트엔드

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
VITE_API_BASE_URL=http://localhost:8080
```

| 키 | 설명 |
|---|---|
| `VITE_API_BASE_URL` | 백엔드 API 주소 |

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

## 폴더 구조

```
src/
├── components/
│   ├── ui/        shadcn/ui 컴포넌트
├── lib/           유틸리티 (cn, api 등)
├── types/         타입 정의
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