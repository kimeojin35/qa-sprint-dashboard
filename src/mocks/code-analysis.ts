import type { CodeAnalysisReport } from '@/types/report'

export const mockCodeAnalysis: Record<string, CodeAnalysisReport> = {
  'STORY-101': {
    storyId: 'STORY-101',
    repo: 'adrop-ads-console',
    analyzedAt: '2026-03-01T10:30:00Z',
    summary: '캠페인 생성 폼에 CPM 타입 옵션 추가. 총 5개 파일 변경.',
    changedFiles: [
      'src/pages/campaign/CampaignCreatePage.tsx',
      'src/components/campaign/CampaignForm.tsx',
      'src/components/campaign/BiddingTypeSelector.tsx',
      'src/types/campaign.ts',
      'src/api/campaign.ts',
    ],
    riskLevel: 'medium',
    markdownContent: `# 코드 분석: 캠페인 생성 - CPM 타입 추가

## 변경 요약
CPM(1000회 노출당 비용) 캠페인 타입을 생성 플로우에 추가하는 변경사항입니다.

## 주요 변경 사항

### 1. \`CampaignForm.tsx\`
- \`BiddingType\` enum에 \`CPM\` 추가
- 폼 유효성 검증 로직에 CPM 관련 필드 (최소/최대 입찰가) 추가
- CPM 선택 시 일일 예산 필드가 필수로 변경

### 2. \`BiddingTypeSelector.tsx\` (신규)
- CPC/CPM/CPA 선택 UI 컴포넌트
- 각 타입별 설명 툴팁 제공

### 3. \`campaign.ts\` (타입)
- \`CampaignBiddingType\` union type에 \`'cpm'\` 추가
- \`CpmConfig\` 인터페이스 추가

## 위험 요소
- **중간**: 기존 CPC 캠페인 생성 플로우에 영향 가능성
- 입찰가 유효성 검증 로직이 복잡해짐 → 경계값 테스트 필요
- API 연동 시 \`bidding_type\` 필드 매핑 확인 필요

## 테스트 권장 사항
1. CPM 캠페인 정상 생성 (happy path)
2. CPC → CPM 전환 시 폼 상태 초기화 확인
3. 최소 입찰가 > 최대 입찰가 설정 시 유효성 검증
4. 일일 예산 미입력 시 에러 메시지
`,
  },
  'STORY-103': {
    storyId: 'STORY-103',
    repo: 'adrop-ads-console',
    analyzedAt: '2026-03-02T14:00:00Z',
    summary: '소재 이미지 업로드 검증 로직 추가. 클라이언트 + 서버 양측 검증.',
    changedFiles: [
      'src/components/creative/ImageUploader.tsx',
      'src/lib/image-validator.ts',
      'src/hooks/useImageUpload.ts',
      'src/constants/creative.ts',
    ],
    riskLevel: 'low',
    markdownContent: `# 코드 분석: 광고 소재 이미지 유효성 검증

## 변경 요약
광고 소재 이미지 업로드 시 클라이언트 측에서 해상도, 파일 크기, 포맷을 사전 검증합니다.

## 주요 변경 사항

### 1. \`image-validator.ts\` (신규)
\`\`\`typescript
interface ImageValidationResult {
  valid: boolean
  errors: string[]
}
\`\`\`
- 지원 포맷: PNG, JPG, GIF (최대 5MB)
- 해상도 제한: 광고 유형별 최소/최대 해상도

### 2. \`ImageUploader.tsx\`
- 드래그 앤 드롭 업로드 지원 추가
- 검증 실패 시 인라인 에러 메시지 표시
- 업로드 진행률 표시

### 3. \`creative.ts\` (상수)
- 광고 유형별 이미지 규격 상수 정의

## 위험 요소
- **낮음**: 독립적인 유틸리티 함수로 기존 코드 영향 최소
- HEIF/WebP 포맷 미지원 (추후 대응 필요)

## 테스트 권장 사항
1. 각 지원 포맷(PNG/JPG/GIF) 업로드 성공
2. 미지원 포맷(BMP, TIFF) 업로드 시 에러
3. 5MB 초과 파일 업로드 시 에러
4. 최소 해상도 미달 이미지 업로드 시 에러
`,
  },
  'STORY-105': {
    storyId: 'STORY-105',
    repo: 'adrop-ads-console',
    analyzedAt: '2026-03-03T09:00:00Z',
    summary: '캠페인 상세 성능 차트 컴포넌트 추가. recharts 라이브러리 도입.',
    changedFiles: [
      'src/pages/campaign/CampaignDetailPage.tsx',
      'src/components/campaign/PerformanceChart.tsx',
      'src/components/campaign/MetricSelector.tsx',
      'src/hooks/useCampaignMetrics.ts',
      'src/api/metrics.ts',
      'package.json',
    ],
    riskLevel: 'high',
    markdownContent: `# 코드 분석: 캠페인 성능 지표 차트

## 변경 요약
캠페인 상세 페이지에 일별/주별 성능 지표를 시각화하는 차트 컴포넌트를 추가합니다.

## 주요 변경 사항

### 1. 새 의존성
- \`recharts\` 라이브러리 추가 (번들 사이즈 +120KB gzipped)

### 2. \`PerformanceChart.tsx\` (신규)
- 노출수(Impressions), 클릭수(Clicks), CTR 라인 차트
- 기간 선택: 7일 / 14일 / 30일
- 반응형 레이아웃

### 3. \`useCampaignMetrics.ts\` (신규)
- 메트릭 데이터 fetching + 캐싱 훅
- 기간별 데이터 집계 로직

### 4. \`metrics.ts\` (API)
- \`GET /api/campaigns/:id/metrics\` 엔드포인트 연동
- 날짜 범위 쿼리 파라미터 처리

## 위험 요소
- **높음**: 새 라이브러리 도입 → 번들 사이즈 증가
- 대량 데이터(30일) 렌더링 시 성능 영향 가능성
- API 응답 형식 변경 시 차트 깨질 수 있음

## 테스트 권장 사항
1. 각 기간(7/14/30일) 선택 시 차트 정상 렌더링
2. 데이터 없는 기간 선택 시 빈 상태 처리
3. API 오류 시 에러 메시지 표시
4. 모바일 반응형 레이아웃 확인
`,
  },
  'STORY-106': {
    storyId: 'STORY-106',
    repo: 'adrop-api',
    analyzedAt: '2026-03-02T16:00:00Z',
    summary: 'API 응답 지연 원인 분석. N+1 쿼리 및 인덱스 누락.',
    changedFiles: [
      'src/routes/dashboard.ts',
      'src/services/dashboard-service.ts',
      'src/repositories/campaign-repository.ts',
      'migrations/20260302_add_dashboard_index.sql',
    ],
    riskLevel: 'high',
    markdownContent: `# 코드 분석: 대시보드 API 응답 지연

## 변경 요약
대시보드 메인 API의 응답 시간이 3초 이상 걸리는 문제의 원인을 분석하고 수정합니다.

## 원인 분석

### 1. N+1 쿼리 문제
- \`dashboard-service.ts\`에서 캠페인 목록을 가져온 후, 각 캠페인의 메트릭을 개별 쿼리로 조회
- 캠페인 50개 기준 → 51개 쿼리 실행

### 2. 인덱스 누락
- \`campaign_metrics\` 테이블의 \`campaign_id + date\` 복합 인덱스 미설정
- Full table scan 발생

## 주요 변경 사항

### 1. \`campaign-repository.ts\`
- 배치 쿼리로 전환: \`WHERE campaign_id IN (...)\`
- JOIN을 활용한 단일 쿼리로 최적화

### 2. \`migrations/\`
- \`campaign_metrics (campaign_id, date)\` 복합 인덱스 추가

## 위험 요소
- **높음**: 프로덕션 DB 마이그레이션 필요
- 쿼리 변경으로 데이터 정합성 확인 필요
- 스테이징 환경에서 충분한 부하 테스트 필요

## 테스트 권장 사항
1. 스테이징 환경에서 API 응답 시간 측정 (목표: 500ms 이하)
2. 캠페인 0개 / 10개 / 100개 시나리오별 테스트
3. 인덱스 적용 전/후 쿼리 실행 계획 비교
4. 대시보드 UI에서 데이터 정합성 확인
`,
  },
}
