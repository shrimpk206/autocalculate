# 미트하임 자동견적 프로그램

건축 자재 견적을 자동으로 계산하고 PDF로 출력하는 전문가용 시스템입니다.

## 프로젝트 구조

```
├── client/src/
│   ├── pages/
│   │   ├── estimator.tsx       # 견적 계산 페이지 (메인)
│   │   └── settings.tsx        # 가격표 관리 페이지
│   ├── lib/
│   │   ├── calculations.ts     # 견적 계산 로직 (핵심)
│   │   └── queryClient.ts      # React Query 설정
│   ├── components/ui/          # Shadcn UI 컴포넌트
│   └── App.tsx                 # 라우팅 설정
├── server/
│   ├── routes.ts               # API 엔드포인트
│   ├── storage.ts              # 데이터 저장소
│   └── index.ts                # Express 서버
└── shared/
    └── schema.ts               # 공유 타입 정의
```

## 개발 시작

```bash
# 서버 자동 실행됨 (npm run dev)
# http://localhost:5000 에서 확인
```

## 주요 기능

### 1. 견적 계산 (estimator.tsx)
- 4가지 시스템: RC, LGS, WOOD, FORM
- 면적 입력 → 자재 자동 계산
- 두께별 단가 적용
- 로스율 설정
- VAT 계산
- PDF 출력

### 2. 가격 관리 (settings.tsx)
- 두께별 단가 수정
- 부자재 가격 수정
- 인건비 수정
- 변경사항 즉시 반영

### 3. 계산 로직 (calculations.ts)
**핵심 함수:** `calculateMaterials()`

#### RC 시스템
```typescript
// 디스크 앙카: 5.3개/㎡
// 접착 몰탈: 0.05통/㎡
// 폼본드: 0.1666667개/㎡
// Terra Flex: 0.1666667포/㎡
```

#### LGS/WOOD 시스템
```typescript
// 알루미늄 트랙: 2.7개/㎡
// 디스크 앙카: 3세트/㎡ (두께별 배율)
// - 기본: priceConfig.materialPrices["디스크 앙카"]
// - >120mm: 기본가 × 1.125
// - >160mm: 기본가 × 1.25
```

#### FORM 시스템
```typescript
// 패턴 거푸집 패널: 면적 × 두께별 단가
// 박리제: 50㎡당 1통
// 시공비: priceConfig.laborRates["패턴거푸집 시공비"]
```

## 데이터 모델

### PriceConfiguration (shared/schema.ts)
```typescript
{
  rcThicknessPrices: { [mm: number]: number },    // RC 두께별 단가
  trackThicknessPrices: { [mm: number]: number }, // 트랙 두께별 단가
  formThicknessPrices: { [mm: number]: number },  // 폼 두께별 단가
  materialPrices: { [품명: string]: number },     // 부자재 가격
  laborRates: { [항목: string]: number }          // 인건비
}
```

### CalculatedMaterial
```typescript
{
  name: string,      // 자재명
  quantity: number,  // 수량
  unit: string,      // 단위
  unitPrice: number, // 단가
  supply: number     // 공급가 (수량 × 단가)
}
```

## API 엔드포인트

### GET /api/prices
가격 설정 조회
```typescript
Response: PriceConfiguration
```

### PUT /api/prices
가격 설정 업데이트
```typescript
Request Body: PriceConfiguration
Response: PriceConfiguration
```

## 수정 시 주의사항

### ⚠️ 계산 로직 수정 시
- **모든 가격은 `priceConfig`에서 가져와야 함**
- 하드코딩 금지 (fallback만 허용)
- 예시:
  ```typescript
  // ✅ 올바른 방법
  const price = priceConfig.materialPrices["Terra Flex"] ?? 20000;
  
  // ❌ 잘못된 방법
  const price = 20000;
  ```

### 💡 새 자재 추가 시
1. `shared/schema.ts`의 `defaultPriceConfig.materialPrices`에 추가
2. `calculations.ts`에서 계산 로직 추가
3. `settings.tsx`의 부자재 테이블에 입력 필드 추가

### 🎨 UI 수정 시
- Tailwind CSS 사용
- Shadcn UI 컴포넌트 활용
- `design_guidelines.md` 참고
- 인쇄 CSS는 `@media print` 사용

### 📦 패키지 설치
```bash
# Replit Agent 도구 사용 (package.json 직접 수정 금지)
# packager_tool 사용
```

## 테스트

### 기본 시나리오
1. 견적 계산 페이지에서 RC 선택
2. 면적 100 입력
3. 두께 100mm 선택
4. 자재 목록 및 총액 확인
5. 가격표 관리 페이지로 이동
6. Terra Flex 가격 변경
7. 다시 견적 페이지 → 가격 반영 확인

### PDF 출력 테스트
1. 견적 작성 완료
2. 인쇄 버튼 클릭
3. 브라우저 인쇄 대화상자 → PDF로 저장

## 디버깅 팁

### 계산이 안 맞을 때
1. `calculations.ts`에서 `console.log` 추가
2. 브라우저 개발자 도구 Console 확인
3. `priceConfig` 값 확인

### 가격 변경이 반영 안 될 때
1. React Query 캐시 무효화 확인
2. `/api/prices` PUT 요청 성공 확인
3. `queryClient.invalidateQueries` 호출 확인

### 스타일이 안 맞을 때
1. Tailwind CSS 클래스명 확인
2. `index.css`의 커스텀 변수 확인
3. `design_guidelines.md` 참고

## 기술 스택

- **Frontend**: React 18, TypeScript, Wouter, TanStack Query, Shadcn UI, Tailwind CSS
- **Backend**: Express.js, In-memory storage
- **Build**: Vite

## 향후 개발 예정

- [ ] 견적 히스토리 및 저장 기능
- [ ] 견적서 템플릿 커스터마이징
- [ ] 자재 가격 변동 추이 그래프
- [ ] 여러 프로젝트 비교 기능
- [ ] Excel 파일 내보내기
