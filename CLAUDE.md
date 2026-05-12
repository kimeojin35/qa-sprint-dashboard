# QA Sprint Dashboard

QA 스프린트 진행 상황을 시각화하는 React 대시보드.

## Tech Stack

- React 19 + TypeScript + Vite
- Tailwind CSS v4
- Zustand (상태 관리)
- React Router v7
- Path alias: `@/` → `src/`
- Express API 서버 (Notion SDK)

## Project Structure

```
server/
├── index.ts             # Express API server (port 3001)
└── notion.ts            # Notion API client + data transformation

src/
├── components/
│   ├── layout/          # AppLayout, Sidebar, Header
│   ├── ui/              # Badge, Button, Card, Input, Tabs, ProgressBar
│   ├── story/           # StoryCard, StoryDetail, CodeAnalysisTab, QAPlanTab, TestResultsTab
│   ├── dashboard/       # SprintSummaryCard, StatusChart, RepoCard
│   └── notion/          # StoryTree, SprintInfo (Notion 계층 뷰)
├── pages/               # DashboardPage, StoriesPage, NotionPage, SettingsPage
├── stores/              # sprint-store, settings-store, notion-store (Zustand)
├── types/               # sprint.ts, report.ts, settings.ts, notion.ts
├── lib/                 # csv-parser, cn, api
└── mocks/               # Mock data
```

## Data Model

- **Sprint** → 여러 **Story** 포함
- Story 상태: todo | in-progress | in-review | done | blocked
- Story 유형: feature | bug | improvement | task
- Notion CSV import 지원 (한국어/영어 컬럼명 자동 매핑)

### Notion 연동 데이터 모델

- **마스터 스토리** → 하위에 기획/개발/QA 스토리 포함
- 구분: 마스터 스토리 | 기획 스토리 | 개발 스토리 | QA 스토리
- 상태: 미진행 | 시작 전 | 진행 중 | 검토 중 | 거절 | 승인 | 완료 | 보관
- 계층: 상위 작업 ↔ 하위 작업 (self-relation)
- 스프린트 DB와 relation으로 연결

## Notion Integration Setup

1. https://www.notion.so/my-integrations 에서 Internal Integration 생성
2. 스토리 DB + 스프린트 DB를 Integration에 Share
3. `.env.example`을 `.env`로 복사 후 API 키/DB ID 입력
4. `npm run dev` 실행 (API 서버 + Vite 동시 실행)

### API Endpoints

- `GET /api/notion/sync` — 활성 스토리 + 스프린트 계층 데이터 반환
- `GET /api/notion/status` — Notion 연결 상태 확인

### Notion DB IDs

- 스토리 DB: `b6906a5bcd344a2faff870a31b41b518`
- 스프린트 DB: `1bb0f49c38d6818d890fd8bdee376102`

## Commands

- `npm run dev` — API 서버 + Vite 개발 서버 동시 실행
- `npm run dev:client` — Vite 개발 서버만 실행
- `npm run server` — API 서버만 실행
- `npm run build` — TypeScript 체크 + 빌드
- `npm run lint` — ESLint

## Conventions

- 한국어 UI, 한국어 주석 허용
- Tailwind CSS utility-first 스타일링
- Zustand store로 전역 상태 관리
- 컴포넌트는 named export 사용
- Vite proxy: `/api` → `http://localhost:3001`
