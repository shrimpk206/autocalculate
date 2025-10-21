import type { MaterialItem, CalculationParams, PriceConfiguration } from "@shared/schema";

const RC_UNIT_MAP: Record<string, string> = {
  "단열재 (로스율 8%)": "㎡",
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

export function calculateMaterials(
  params: CalculationParams,
  priceConfig: PriceConfiguration
): MaterialItem[] {
  const { systemId, area, rcThickness, trackThickness, formThickness, insulationLossRate, tileLossRate } = params;
  const items: MaterialItem[] = [];
  const lossMultiplier = 1 + (insulationLossRate / 100);
  const tileLossMultiplier = 1 + (tileLossRate / 100);

  if (systemId === "RC" && rcThickness) {
    const tPrice = priceConfig.rcThicknessPrices[rcThickness] ?? 16000;
    const rcItems: [string, number, number][] = [
      [`단열재 (로스율 ${insulationLossRate}%)`, lossMultiplier, tPrice],
      ["디스크 앙카", 5.3, priceConfig.materialPrices["디스크 앙카"] ?? 400],
      ["접착 몰탈", 0.05, priceConfig.materialPrices["접착 몰탈"] ?? 35000],
      ["단열재 부착용 폼본드", 0.1666667, priceConfig.materialPrices["단열재 부착용 폼본드"] ?? 6500],
      ["드릴비트", 0.1, priceConfig.materialPrices["드릴비트"] ?? 5000],
      ["Terra Flex 20kg", 0.1666667, priceConfig.materialPrices["Terra Flex 20kg"] ?? 21000],
      [`벽돌타일 (로스율 ${tileLossRate}%)`, tileLossMultiplier, priceConfig.materialPrices["벽돌타일 (로스율 10%)"] ?? 18000],
      ["메지 시멘트", 0.2631579, priceConfig.materialPrices["메지 시멘트"] ?? 6500],
      ["단열재 노무비", 1.0, priceConfig.laborRates["단열재 노무비"] ?? 23000],
      ["타일 노무비", 1.0, priceConfig.laborRates["타일 노무비"] ?? 23000],
      ["메지 시공비", 1.0, priceConfig.laborRates["메지 시공비"] ?? 10000],
    ];

    rcItems.forEach(([name, perM2, unitPrice]) => {
      let qty = perM2 * area;
      if (name === "메지 시멘트" || name === "단열재 부착용 폼본드" || name === "Terra Flex 20kg") {
        qty = Math.ceil(qty);
      }
      items.push({ 
        name, 
        unit: RC_UNIT_MAP[name] || "ea", 
        qty, 
        unitPrice,
        supply: unitPrice * qty 
      });
    });
  }

  if ((systemId === "LGS" || systemId === "WOOD") && trackThickness) {
    let tPrice = priceConfig.trackThicknessPrices[trackThickness] ?? 16000;
    if (systemId === "WOOD") {
      tPrice += 1000;
    }
    // Use base disk anchor price and apply thickness multiplier
    const baseDiskPrice = priceConfig.materialPrices["디스크 앙카"] ?? 400;
    const diskUnit = trackThickness > 160 ? baseDiskPrice * 1.25 : trackThickness > 120 ? baseDiskPrice * 1.125 : baseDiskPrice;

    const trackItems: [string, number, number][] = [
      [`단열재 (로스율 ${insulationLossRate}%)`, lossMultiplier, tPrice],
      ["알루미늄 트랙", 2.7, priceConfig.materialPrices["알루미늄 트랙"] ?? 1000],
      ["디스크 앙카", 3, diskUnit],
      systemId === "WOOD" 
        ? ["델타피스", 5, priceConfig.materialPrices["델타피스"] ?? 40] 
        : ["철판피스", 5, priceConfig.materialPrices["철판피스"] ?? 40],
      ["단열재 부착용 폼본드", 0.1538, priceConfig.materialPrices["단열재 부착용 폼본드"] ?? 6500],
      ["Terra Flex 20kg", 0.1666667, priceConfig.materialPrices["Terra Flex 20kg"] ?? 21000],
      [`벽돌타일 (로스율 ${tileLossRate}%)`, tileLossMultiplier, priceConfig.materialPrices["벽돌타일 (로스율 10%)"] ?? 18000],
      ["메지 시멘트", 0.2631579, priceConfig.materialPrices["메지 시멘트"] ?? 6500],
      ["단열재 노무비", 1.0, priceConfig.laborRates["단열재 노무비"] ?? 23000],
      ["타일 노무비", 1.0, priceConfig.laborRates["타일 노무비"] ?? 23000],
      ["메지 시공비", 1.0, priceConfig.laborRates["메지 시공비"] ?? 10000],
    ];

    trackItems.forEach(([name, perM2, unitPrice]) => {
      let qty = perM2 * area;
      if (name === "메지 시멘트" || name === "단열재 부착용 폼본드" || name === "Terra Flex 20kg") {
        qty = Math.ceil(qty);
      }
      items.push({ 
        name, 
        unit: TRACK_UNIT_MAP[name] || "ea", 
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
