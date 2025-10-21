import * as XLSX from 'xlsx';
import type { MaterialItem } from '@shared/schema';
import { formatCurrency, convertToKoreanNumber } from './calculations';

export interface ExcelExportData {
  materials: MaterialItem[];
  printHeader: {
    recipient: string;
    recipientPhone: string;
    businessNumber: string;
    companyName: string;
    phone: string;
    representative: string;
    address: string;
    productType: string;
    deliveryDate: string;
    paymentCondition: string;
    deliveryLocation: string;
    bankAccount: string;
  };
  totals: {
    subtotal: number;
    vat: number;
    total: number;
  };
  area: number;
  systemId: string;
}

export function exportToExcel(data: ExcelExportData) {
  // 새로운 워크북 생성
  const workbook = XLSX.utils.book_new();

  // 견적서 데이터 시트 생성
  const estimateData = [
    // 헤더 정보
    ['견적서'],
    [''],
    [`서기: ${new Date().toLocaleDateString('ko-KR', {year: 'numeric', month: 'long', day: 'numeric'})}`],
    [''],
    [`${data.printHeader.recipient} 귀하`],
    [`대표전화: ${data.printHeader.recipientPhone}`],
    ['아래와 같이 견적 합니다.'],
    [''],
    [''],
    // 발신자 정보
    ['발신자 정보'],
    [`공 사업번호: ${data.printHeader.businessNumber}`],
    [`상 호: ${data.printHeader.companyName}`],
    [`전화번호: ${data.printHeader.phone}`],
    [`대표자: ${data.printHeader.representative}`],
    [`주 소: ${data.printHeader.address}`],
    [''],
    [''],
    // 합계금액
    [`합계금액: ${convertToKoreanNumber(data.totals.total)}`],
    [`(${formatCurrency(data.totals.total)}) 부가세포함`],
    [''],
    [''],
    // 테이블 헤더
    ['No', '품명/규격', '단위', '수량', '단가', '금액'],
    // 자재 데이터
    ...data.materials.map((mat, idx) => [
      idx + 1,
      mat.name,
      mat.unit,
      mat.name.includes("단열재") && !mat.name.includes("부착용") && !mat.name.includes("노무비") 
        ? mat.qty.toFixed(1) 
        : Math.round(mat.qty).toString(),
      formatCurrency(mat.unitPrice),
      formatCurrency(mat.supply)
    ]),
    [''],
    [''],
    // 푸터 정보
    [`제품형식: ${data.printHeader.productType}`],
    [`납품일자: ${data.printHeader.deliveryDate}`],
    [`결제조건: ${data.printHeader.paymentCondition}`],
    [`납품장소: ${data.printHeader.deliveryLocation}`],
    [`입금계좌: ${data.printHeader.bankAccount}`],
    [''],
    // 금액 요약
    ['공급가:', formatCurrency(data.totals.subtotal)],
    ['부가세:', formatCurrency(data.totals.vat)],
    ['합계금액:', formatCurrency(data.totals.total)],
    [''],
    ['Page: 1/1']
  ];

  // 시트 생성
  const worksheet = XLSX.utils.aoa_to_sheet(estimateData);

  // 컬럼 너비 설정
  const colWidths = [
    { wch: 5 },   // No
    { wch: 30 },  // 품명/규격
    { wch: 10 },  // 단위
    { wch: 10 },  // 수량
    { wch: 15 },  // 단가
    { wch: 15 }   // 금액
  ];
  worksheet['!cols'] = colWidths;

  // 워크북에 시트 추가
  XLSX.utils.book_append_sheet(workbook, worksheet, '견적서');

  // 파일명 생성
  const fileName = `견적서_${data.printHeader.recipient}_${new Date().toISOString().split('T')[0]}.xlsx`;

  // 엑셀 파일 다운로드
  XLSX.writeFile(workbook, fileName);
}

// 자재 목록만 엑셀로 내보내는 함수
export function exportMaterialsToExcel(materials: MaterialItem[], systemInfo: string) {
  const workbook = XLSX.utils.book_new();

  // 자재 목록 데이터
  const materialsData = [
    ['시스템', systemInfo],
    [''],
    ['No', '품명', '단위', '수량', '단가', '공급가'],
    ...materials.map((mat, idx) => [
      idx + 1,
      mat.name,
      mat.unit,
      mat.name.includes("단열재") && !mat.name.includes("부착용") && !mat.name.includes("노무비") 
        ? mat.qty.toFixed(1) 
        : Math.round(mat.qty).toString(),
      formatCurrency(mat.unitPrice),
      formatCurrency(mat.supply)
    ])
  ];

  const worksheet = XLSX.utils.aoa_to_sheet(materialsData);
  
  // 컬럼 너비 설정
  worksheet['!cols'] = [
    { wch: 5 },   // No
    { wch: 30 },  // 품명
    { wch: 10 },  // 단위
    { wch: 10 },  // 수량
    { wch: 15 },  // 단가
    { wch: 15 }   // 공급가
  ];

  XLSX.utils.book_append_sheet(workbook, worksheet, '자재목록');

  const fileName = `자재목록_${new Date().toISOString().split('T')[0]}.xlsx`;
  XLSX.writeFile(workbook, fileName);
}
