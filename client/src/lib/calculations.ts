import type { MaterialItem, CalculationParams, PriceConfiguration } from "@shared/schema";

const RC_UNIT_MAP: Record<string, string> = {
  "단열재 (로스율 8%)": "㎡",
  "단열재 (로스율 8%) - 준불연": "㎡",
  "디스크 앙카": "set",
  "접착 몰탈": "통",
  "단열재 부착용 폼본드": "ea",
  "드릴비트": "ea",
  "Terra Flex 20kg": "포",
  "벽돌타일 (로스율 10%)": "㎡",
  "메지 시멘트": "포",
  "단열재 노무비": "㎡",
  "타일 노무비": "㎡",
  "메지 시공비": "㎡",
  "코너타일": "장",
};

const TRACK_UNIT_MAP: Record<string, string> = {
  "단열재": "㎡",
  "단열재 (로스율 8%) - 준불연": "㎡",
  "알루미늄 트랙": "ea",
  "디스크 앙카": "set",
  "철판피스": "ea",
  "델타피스": "ea",
  "단열재 부착용 폼본드": "ea",
  "Terra Flex 20kg": "포",
  "벽돌타일 (10% 포함)": "㎡",
  "메지 시멘트": "포",
  "단열재 노무비": "㎡",
  "타일 노무비": "㎡",
  "메지 시공비": "㎡",
  "코너타일": "장",
};

// 단열재 두께에 따른 디스크 앙카 크기 선택 함수
function getDiskAnchorSize(thickness: number): { size: string; priceKey: string } {
  if (thickness <= 120) {
    return { size: "120mm", priceKey: "디스크 앙카 120mm" };
  } else if (thickness <= 160) {
    return { size: "150mm", priceKey: "디스크 앙카 150mm" };
  } else if (thickness <= 200) {
    return { size: "200mm", priceKey: "디스크 앙카 200mm" };
  } else {
    return { size: "250mm", priceKey: "디스크 앙카 250mm" };
  }
}

// 수량을 지정된 단위로 올림 처리하는 함수
function roundUpToUnit(quantity: number, unit: number): number {
  return Math.ceil(quantity / unit) * unit;
}

export function calculateMaterials(
  params: CalculationParams,
  priceConfig: PriceConfiguration,
  laborIncluded: boolean = true
): MaterialItem[] {
  const { systemId, area, rcThickness, trackThickness, formThickness, insulationLossRate, tileLossRate, isFireResistant, cornerTileLength } = params;
  const items: MaterialItem[] = [];
  const lossMultiplier = 1 + (insulationLossRate / 100);
  const tileLossMultiplier = 1 + (tileLossRate / 100);

  if (systemId === "RC" && rcThickness) {
    let tPrice = priceConfig.rcThicknessPrices[rcThickness] ?? 16000;
    
    // 준불연 옵션이 활성화된 경우 단열재 가격을 두께당 200원으로 계산
    if (isFireResistant) {
      tPrice = rcThickness * 200;
    }
    
    // 단열재 두께에 따른 디스크 앙카 크기 선택
    const diskAnchor = getDiskAnchorSize(rcThickness);
    
    const rcItems: [string, number, number][] = [
      [`단열재 (로스율 ${insulationLossRate}%)${isFireResistant ? ' - 준불연' : ''}`, lossMultiplier, tPrice],
      [`디스크 앙카 ${diskAnchor.size}`, 5.3, priceConfig.materialPrices[diskAnchor.priceKey] ?? 400],
      ["접착 몰탈", 0.05, priceConfig.materialPrices["접착 몰탈"] ?? 35000],
      ["단열재 부착용 폼본드", 0.1666667, priceConfig.materialPrices["단열재 부착용 폼본드"] ?? 6500],
      ["드릴비트", 0.1, priceConfig.materialPrices["드릴비트"] ?? 5000],
      ["Terra Flex 20kg", 0.1666667, priceConfig.materialPrices["Terra Flex 20kg"] ?? 21000],
      [`벽돌타일 (로스율 ${tileLossRate}%)`, tileLossMultiplier, priceConfig.materialPrices["벽돌타일 (로스율 10%)"] ?? 18000],
    ];

    // 코너타일 추가 (RC 시스템) - 벽돌타일 바로 다음에
    if (cornerTileLength && cornerTileLength > 0) {
      const cornerTileQuantity = Math.ceil(cornerTileLength * 16); // m당 16장
      rcItems.push(["코너타일", cornerTileQuantity, priceConfig.materialPrices["코너타일"] ?? 1300]);
    }

    rcItems.push(["메지 시멘트", 0.2631579, priceConfig.materialPrices["메지 시멘트"] ?? 6500]);

    // 노무비/시공비 항목 추가 (laborIncluded가 true일 때만)
    if (laborIncluded) {
      rcItems.push(
        ["단열재 노무비", 1.0, priceConfig.laborRates["단열재 노무비"] ?? 23000],
        ["타일 노무비", 1.0, priceConfig.laborRates["타일 노무비"] ?? 23000],
        ["메지 시공비", 1.0, priceConfig.laborRates["메지 시공비"] ?? 10000]
      );
    }

    rcItems.forEach(([name, perM2, unitPrice]) => {
      let qty;
      
      // 코너타일은 면적에 관계없이 절대 수량으로 처리
      if (name === "코너타일") {
        qty = perM2; // 이미 절대 수량으로 계산됨
      } else {
        qty = perM2 * area;
        
        // 단열재가 아닌 경우 소수점 제거
        if (!name.includes("단열재")) {
          qty = Math.ceil(qty);
        }
        
        // 기존 올림 처리 (메지 시멘트, 폼본드, Terra Flex)
        if (name === "메지 시멘트" || name === "단열재 부착용 폼본드" || name === "Terra Flex 20kg") {
          qty = Math.ceil(qty);
        }
        // 디스크 앙카를 100단위로 올림 처리
        else if (name.includes("디스크 앙카")) {
          qty = roundUpToUnit(qty, 100);
        }
      }
      
      // 단위 설정: 단열재는 ㎡, 코너타일은 장, 나머지는 매핑에서 찾거나 기본값 사용
      const unit = name.includes("단열재") ? "㎡" : 
                   name === "코너타일" ? "장" : 
                   (RC_UNIT_MAP[name] || "ea");
      
      items.push({ 
        name, 
        unit, 
        qty, 
        unitPrice,
        supply: unitPrice * qty 
      });
    });
  }

  if ((systemId === "LGS" || systemId === "WOOD") && trackThickness) {
    let tPrice = priceConfig.trackThicknessPrices[trackThickness] ?? 16000;
    
    // 준불연 옵션이 활성화된 경우 단열재 가격을 두께당 200원으로 계산
    if (isFireResistant) {
      tPrice = trackThickness * 200;
    } else if (systemId === "WOOD") {
      tPrice += 1000;
    }
    
    // 단열재 두께에 따른 디스크 앙카 크기 선택
    const diskAnchor = getDiskAnchorSize(trackThickness);

    const trackItems: [string, number, number][] = [
      [`단열재 (로스율 ${insulationLossRate}%)${isFireResistant ? ' - 준불연' : ''}`, lossMultiplier, tPrice],
      ["알루미늄 트랙", 2.7, priceConfig.materialPrices["알루미늄 트랙"] ?? 1000],
      [`디스크 앙카 ${diskAnchor.size}`, 3, priceConfig.materialPrices[diskAnchor.priceKey] ?? 400],
      systemId === "WOOD" 
        ? ["델타피스", 5, priceConfig.materialPrices["델타피스"] ?? 40] 
        : ["철판피스", 5, priceConfig.materialPrices["철판피스"] ?? 40],
      ["단열재 부착용 폼본드", 0.1538, priceConfig.materialPrices["단열재 부착용 폼본드"] ?? 6500],
      ["Terra Flex 20kg", 0.1666667, priceConfig.materialPrices["Terra Flex 20kg"] ?? 21000],
      [`벽돌타일 (로스율 ${tileLossRate}%)`, tileLossMultiplier, priceConfig.materialPrices["벽돌타일 (로스율 10%)"] ?? 18000],
    ];

    // 코너타일 추가 (LGS/WOOD 시스템) - 벽돌타일 바로 다음에
    if (cornerTileLength && cornerTileLength > 0) {
      const cornerTileQuantity = Math.ceil(cornerTileLength * 16); // m당 16장
      trackItems.push(["코너타일", cornerTileQuantity, priceConfig.materialPrices["코너타일"] ?? 1300]);
    }

    trackItems.push(["메지 시멘트", 0.2631579, priceConfig.materialPrices["메지 시멘트"] ?? 6500]);

    // 노무비/시공비 항목 추가 (laborIncluded가 true일 때만)
    if (laborIncluded) {
      trackItems.push(
        ["단열재 노무비", 1.0, priceConfig.laborRates["단열재 노무비"] ?? 23000],
        ["타일 노무비", 1.0, priceConfig.laborRates["타일 노무비"] ?? 23000],
        ["메지 시공비", 1.0, priceConfig.laborRates["메지 시공비"] ?? 10000]
      );
    }

    trackItems.forEach(([name, perM2, unitPrice]) => {
      let qty;
      
      // 코너타일은 면적에 관계없이 절대 수량으로 처리
      if (name === "코너타일") {
        qty = perM2; // 이미 절대 수량으로 계산됨
      } else {
        qty = perM2 * area;
        
        // 단열재가 아닌 경우 소수점 제거
        if (!name.includes("단열재")) {
          qty = Math.ceil(qty);
        }
        
        // 기존 올림 처리 (메지 시멘트, 폼본드, Terra Flex)
        if (name === "메지 시멘트" || name === "단열재 부착용 폼본드" || name === "Terra Flex 20kg") {
          qty = Math.ceil(qty);
        }
        // 디스크 앙카와 알루미늄 트랙을 100단위로 올림 처리
        else if (name.includes("디스크 앙카") || name === "알루미늄 트랙") {
          qty = roundUpToUnit(qty, 100);
        }
        // 철판피스와 델타피스를 500단위로 올림 처리
        else if (name === "철판피스" || name === "델타피스") {
          qty = roundUpToUnit(qty, 500);
        }
      }
      
      // 단위 설정: 단열재는 ㎡, 코너타일은 장, 나머지는 매핑에서 찾거나 기본값 사용
      const unit = name.includes("단열재") ? "㎡" : 
                   name === "코너타일" ? "장" : 
                   (TRACK_UNIT_MAP[name] || "ea");
      
      items.push({ 
        name, 
        unit, 
        qty, 
        unitPrice,
        supply: unitPrice * qty 
      });
    });
  }

  if (systemId === "FORM" && formThickness) {
    const formPrice = priceConfig.formThicknessPrices[formThickness] ?? 17600;
    const releaserPrice = priceConfig.materialPrices["박리제"] ?? 55000;
    
    items.push({ 
      name: `패턴 거푸집 패널 (${formThickness}T)`, 
      unit: "m²", 
      qty: area, 
      unitPrice: formPrice,
      supply: formPrice * area 
    });
    items.push({ 
      name: "박리제", 
      unit: "통", 
      qty: Math.ceil(area / 50), 
      unitPrice: releaserPrice,
      supply: releaserPrice * Math.ceil(area / 50)
    });
  }

  return items;
}

export function formatCurrency(n: number): string {
  return n.toLocaleString("ko-KR");
}

export function roundTo(n: number, step: number): number {
  return Math.floor(n / step) * step;
}

// 한글 숫자 변환 함수
export function convertToKoreanNumber(num: number): string {
  const units = ['', '만', '억', '조'];
  const digits = ['', '일', '이', '삼', '사', '오', '육', '칠', '팔', '구'];
  
  if (num === 0) return '영원정';
  
  let result = '';
  let unitIndex = 0;
  
  while (num > 0) {
    const remainder = num % 10000;
    if (remainder > 0) {
      let unitResult = '';
      const thousands = Math.floor(remainder / 1000);
      const hundreds = Math.floor((remainder % 1000) / 100);
      const tensDigit = Math.floor((remainder % 100) / 10);
      const ones = remainder % 10;
      
      if (thousands > 0) {
        if (thousands === 1) {
          unitResult += '천';
        } else {
          unitResult += digits[thousands] + '천';
        }
      }
      if (hundreds > 0) {
        if (hundreds === 1) {
          unitResult += '백';
        } else {
          unitResult += digits[hundreds] + '백';
        }
      }
      if (tensDigit > 0) {
        if (tensDigit === 1) {
          unitResult += '십';
        } else {
          unitResult += digits[tensDigit] + '십';
        }
      }
      if (ones > 0) {
        unitResult += digits[ones];
      }
      
      result = unitResult + units[unitIndex] + result;
    }
    num = Math.floor(num / 10000);
    unitIndex++;
  }
  
  return result + '원정';
}
