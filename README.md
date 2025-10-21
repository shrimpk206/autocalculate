# 미트하임 자동견적 프로그램

건축 단열재 견적을 자동으로 계산하는 웹 애플리케이션입니다.

## 주요 기능

### 🏗️ 지원 시스템
- **RC 시스템**: 철근콘크리트 구조
- **LGS 시스템**: 경량철골 구조  
- **WOOD 시스템**: 목구조
- **FORM 시스템**: 패턴거푸집

### 💰 견적 기능
- **자재비 자동 계산**: 면적, 두께, 로스율 기반
- **준불연 단열재**: 두께당 200원 적용
- **디스크 앙카 자동 선택**: 단열재 두께에 따른 크기 결정
  - 120mm 이하: 120mm 앙카
  - 125-160mm: 150mm 앙카  
  - 165-200mm: 200mm 앙카
  - 205mm 이상: 250mm 앙카
- **수량 올림 처리**: 디스크 앙카/알루미늄 트랙(100단위), 철판피스/델타피스(500단위)
- **설계예가 적용**: 품목별 단가 상승 (설정 가능한 비율)

### 🎯 특별 기능
- **실시간 견적 계산**: 입력값 변경 시 즉시 업데이트
- **부가세 포함/제외**: 선택 가능
- **반올림 단위 설정**: 10원 단위 등 사용자 정의
- **견적서 인쇄**: 브라우저 인쇄 기능

## 기술 스택

- **Frontend**: React + TypeScript + Vite
- **Backend**: Express + Node.js
- **UI**: Tailwind CSS + shadcn/ui
- **상태관리**: React Query
- **데이터베이스**: Drizzle ORM

## 설치 및 실행

### 개발 환경
```bash
# 의존성 설치
npm install

# 개발 서버 실행
npm run dev
```

### 프로덕션 빌드
```bash
# 빌드
npm run build

# 프로덕션 실행
npm start
```

## 사용법

1. **시스템 선택**: RC, LGS, WOOD, FORM 중 선택
2. **면적 입력**: 시공할 면적을 ㎡ 단위로 입력
3. **두께 설정**: 단열재 두께를 mm 단위로 설정
4. **로스율 설정**: 단열재 및 타일 로스율 설정
5. **옵션 설정**:
   - 준불연 단열재 적용 여부
   - 설계예가 적용 및 비율
   - 부가세 포함 여부
   - 반올림 단위 설정

## 자재 내역

견적서에는 다음 자재들이 포함됩니다:

### RC 시스템
- 단열재 (두께별)
- 디스크 앙카 (두께별 자동 선택)
- 접착 몰탈
- 단열재 부착용 폼본드
- 드릴비트
- Terra Flex 20kg
- 벽돌타일
- 메지 시멘트

### LGS/WOOD 시스템  
- 단열재 (두께별)
- 디스크 앙카 (두께별 자동 선택)
- 알루미늄 트랙
- 철판피스
- 델타피스
- 접착 몰탈
- 단열재 부착용 폼본드
- 드릴비트
- Terra Flex 20kg
- 벽돌타일
- 메지 시멘트

### FORM 시스템
- 패턴거푸집 시공비

## 라이선스

MIT License

## 기여하기

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request