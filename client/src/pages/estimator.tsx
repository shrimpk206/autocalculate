import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Calculator, Printer, Settings as SettingsIcon, Eye, FileSpreadsheet, Download } from "lucide-react";
import { calculateMaterials, formatCurrency, roundTo, convertToKoreanNumber } from "@/lib/calculations";
import { exportToExcel, exportMaterialsToExcel } from "@/lib/excelUtils";
import type { PriceConfiguration } from "@shared/schema";
import { Link } from "wouter";

const SYSTEMS = [
  { id: "RC", label: "타일부착형 단열재 (철근콘크리트)", description: "RC 후부착 시스템" },
  { id: "LGS", label: "타일부착형 단열재 (경량철골조)", description: "트랙식 경량철골조" },
  { id: "WOOD", label: "타일부착형 단열재 (목조)", description: "트랙식 목조" },
  { id: "FORM", label: "패턴거푸집", description: "패턴 거푸집 시스템" },
];

const VAT_RATE = 0.1;

export default function Estimator() {
  const [systemId, setSystemId] = useState<"RC" | "LGS" | "WOOD" | "FORM">("RC");
  const [area, setArea] = useState<string>("120");
  const [rcThickness, setRcThickness] = useState<number>(100);
  const [trackThickness, setTrackThickness] = useState<number>(100);
  const [formThickness, setFormThickness] = useState<number>(60);
  const [insulationLossRate, setInsulationLossRate] = useState<string>("8");
  const [tileLossRate, setTileLossRate] = useState<string>("10");
  const [vatIncluded, setVatIncluded] = useState(false);
  const [roundStep, setRoundStep] = useState<string>("10");
  const [isFireResistant, setIsFireResistant] = useState(false);
  const [designFeeEnabled, setDesignFeeEnabled] = useState(false);
  const [designFeeRate, setDesignFeeRate] = useState<string>("10");
  const [laborIncluded, setLaborIncluded] = useState(true);
  const [cornerTileLength, setCornerTileLength] = useState<string>("");
  const [showPreview, setShowPreview] = useState(false);
  
  // 인쇄 헤더 정보 상태
  const [printHeader, setPrintHeader] = useState({
    recipient: "(주)건완-영주역세권 주차타워",
    recipientPhone: "010-9310-2373",
    businessNumber: "140-81-75263",
    companyName: "(주)미트하임",
    phone: "043-753-7234",
    representative: "강태우",
    address: "충북 진천군 덕산면 신척1길 96-60",
    productType: "비드법 1종 1호. [180w 3d패턴]",
    deliveryDate: "",
    paymentCondition: "주문시 100% 선결제. 운송비 별도",
    deliveryLocation: "경북 영주시 휴천동 321-10외 4필지 (321-27.28.29.30)",
    bankAccount: "기업은행 118-154793-01-015 (주)미트하임"
  });

  const { data: priceConfig, isLoading } = useQuery<PriceConfiguration>({
    queryKey: ['/api/prices'],
  });

  const materials = useMemo(() => {
    if (!priceConfig || !area) return [];
    return calculateMaterials(
      {
        systemId,
        area: Number(area) || 0,
        rcThickness,
        trackThickness,
        formThickness,
        insulationLossRate: Number(insulationLossRate) || 8,
        tileLossRate: Number(tileLossRate) || 10,
        isFireResistant,
        cornerTileLength: Number(cornerTileLength) || undefined,
      },
      priceConfig,
      laborIncluded
    );
  }, [priceConfig, systemId, area, rcThickness, trackThickness, formThickness, insulationLossRate, tileLossRate, isFireResistant, laborIncluded, cornerTileLength]);

  const laborPerM2 = systemId === "FORM" ? (priceConfig?.laborRates["패턴거푸집 시공비"] ?? 12000) : 0;
  const laborSupply = laborIncluded ? (laborPerM2 * (Number(area) || 0)) : 0;
  
  // 설계예가가 적용된 자재 계산
  const designFeeMultiplier = designFeeEnabled ? (1 + Number(designFeeRate) / 100) : 1;
  const materialsSupply = materials.reduce((sum, m) => sum + (m.supply * designFeeMultiplier), 0);
  const subtotal = materialsSupply + laborSupply;
  
  const vat = subtotal * VAT_RATE;
  const total = vatIncluded ? subtotal + vat : subtotal;
  const totalRounded = roundTo(total, Number(roundStep) || 1);
  
  // 공제 금액 계산 (버림으로 인한 차액)
  const discountAmount = total - totalRounded;

  const onPrint = () => window.print();

  const onExportExcel = () => {
    if (!priceConfig) return;
    
    const systemLabel = SYSTEMS.find(s => s.id === systemId)?.label || systemId;
    
    exportToExcel({
      materials,
      printHeader,
      totals: {
        subtotal,
        vat,
        total: totalRounded
      },
      area: Number(area) || 0,
      systemId: systemLabel
    });
  };

  const onExportMaterialsExcel = () => {
    const systemLabel = SYSTEMS.find(s => s.id === systemId)?.label || systemId;
    exportMaterialsToExcel(materials, systemLabel);
  };

  const getAvailableThicknesses = () => {
    if (!priceConfig) return [];
    
    if (systemId === "RC") {
      return Object.keys(priceConfig.rcThicknessPrices).map(Number).sort((a, b) => a - b);
    } else if (systemId === "LGS" || systemId === "WOOD") {
      return Object.keys(priceConfig.trackThicknessPrices).map(Number).sort((a, b) => a - b);
    } else if (systemId === "FORM") {
      return Object.keys(priceConfig.formThicknessPrices).map(Number).sort((a, b) => a - b);
    }
    return [];
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent"></div>
          <p className="mt-4 text-muted-foreground">로딩 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background print:bg-white">
      <header className="border-b border-border bg-card print:hidden">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Calculator className="h-6 w-6 text-primary" />
              <h1 className="text-2xl font-semibold text-foreground">미트하임 자동견적 프로그램</h1>
            </div>
            <div className="flex gap-2">
              <Link href="/settings">
                <Button variant="outline" size="default" data-testid="button-settings">
                  <SettingsIcon className="h-4 w-4 mr-2" />
                  가격표 관리
                </Button>
              </Link>
              <Button onClick={() => setShowPreview(true)} variant="outline" size="default" data-testid="button-preview">
                <Eye className="h-4 w-4 mr-2" />
                미리보기
              </Button>
              <Button onClick={onExportExcel} variant="outline" size="default" data-testid="button-excel-full">
                <FileSpreadsheet className="h-4 w-4 mr-2" />
                견적서 엑셀
              </Button>
              <Button onClick={onExportMaterialsExcel} variant="outline" size="default" data-testid="button-excel-materials">
                <Download className="h-4 w-4 mr-2" />
                자재목록 엑셀
              </Button>
              <Button onClick={onPrint} variant="default" size="default" data-testid="button-print">
                <Printer className="h-4 w-4 mr-2" />
                인쇄 / PDF 저장
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="print:hidden">
        <div className="container mx-auto px-4 py-8 max-w-7xl">
          <div className="space-y-6">
            {/* System Selection */}
            <Card>
              <CardHeader>
                <CardTitle>시스템 선택</CardTitle>
              </CardHeader>
              <CardContent>
                <Tabs value={systemId} onValueChange={(v) => setSystemId(v as any)} className="w-full">
                  <TabsList className="grid w-full grid-cols-4 gap-4">
                    {SYSTEMS.map((sys) => (
                      <TabsTrigger 
                        key={sys.id} 
                        value={sys.id}
                        data-testid={`tab-system-${sys.id.toLowerCase()}`}
                        className="flex flex-col items-start gap-1 p-4 h-auto"
                      >
                        <span className="font-medium">{sys.id}</span>
                        <span className="text-xs text-muted-foreground font-normal">{sys.description}</span>
                      </TabsTrigger>
                    ))}
                  </TabsList>
                </Tabs>
              </CardContent>
            </Card>

            {/* Print Header Settings */}
            <Card>
              <CardHeader>
                <CardTitle>견적서 헤더 정보</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* 수신자 정보 */}
                  <div className="space-y-4">
                    <h3 className="font-medium text-sm text-muted-foreground">수신자 정보</h3>
                    <div className="space-y-3">
                      <div className="space-y-1">
                        <Label htmlFor="recipient" className="text-sm">수신자</Label>
                        <Input
                          id="recipient"
                          value={printHeader.recipient}
                          onChange={(e) => setPrintHeader(prev => ({...prev, recipient: e.target.value}))}
                          className="h-8"
                          data-testid="input-recipient"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label htmlFor="recipientPhone" className="text-sm">수신자 전화번호</Label>
                        <Input
                          id="recipientPhone"
                          value={printHeader.recipientPhone}
                          onChange={(e) => setPrintHeader(prev => ({...prev, recipientPhone: e.target.value}))}
                          className="h-8"
                          data-testid="input-recipient-phone"
                        />
                      </div>
                    </div>
                  </div>

                  {/* 발신자 정보 */}
                  <div className="space-y-4">
                    <h3 className="font-medium text-sm text-muted-foreground">발신자 정보</h3>
                    <div className="space-y-3">
                      <div className="grid grid-cols-2 gap-2">
                        <div className="space-y-1">
                          <Label htmlFor="businessNumber" className="text-sm">사업자번호</Label>
                          <Input
                            id="businessNumber"
                            value={printHeader.businessNumber}
                            onChange={(e) => setPrintHeader(prev => ({...prev, businessNumber: e.target.value}))}
                            className="h-8"
                            data-testid="input-business-number"
                          />
                        </div>
                        <div className="space-y-1">
                          <Label htmlFor="companyName" className="text-sm">상호</Label>
                          <Input
                            id="companyName"
                            value={printHeader.companyName}
                            onChange={(e) => setPrintHeader(prev => ({...prev, companyName: e.target.value}))}
                            className="h-8"
                            data-testid="input-company-name"
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div className="space-y-1">
                          <Label htmlFor="phone" className="text-sm">전화번호</Label>
                          <Input
                            id="phone"
                            value={printHeader.phone}
                            onChange={(e) => setPrintHeader(prev => ({...prev, phone: e.target.value}))}
                            className="h-8"
                            data-testid="input-phone"
                          />
                        </div>
                        <div className="space-y-1">
                          <Label htmlFor="representative" className="text-sm">대표자</Label>
                          <Input
                            id="representative"
                            value={printHeader.representative}
                            onChange={(e) => setPrintHeader(prev => ({...prev, representative: e.target.value}))}
                            className="h-8"
                            data-testid="input-representative"
                          />
                        </div>
                      </div>
                      <div className="space-y-1">
                        <Label htmlFor="address" className="text-sm">주소</Label>
                        <Input
                          id="address"
                          value={printHeader.address}
                          onChange={(e) => setPrintHeader(prev => ({...prev, address: e.target.value}))}
                          className="h-8"
                          data-testid="input-address"
                        />
                      </div>
                    </div>
                  </div>

                  {/* 제품 및 납품 정보 */}
                  <div className="space-y-4">
                    <h3 className="font-medium text-sm text-muted-foreground">제품 및 납품 정보</h3>
                    <div className="space-y-3">
                      <div className="space-y-1">
                        <Label htmlFor="productType" className="text-sm">제품형식</Label>
                        <Input
                          id="productType"
                          value={printHeader.productType}
                          onChange={(e) => setPrintHeader(prev => ({...prev, productType: e.target.value}))}
                          className="h-8"
                          data-testid="input-product-type"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label htmlFor="deliveryDate" className="text-sm">납품일자</Label>
                        <Input
                          id="deliveryDate"
                          value={printHeader.deliveryDate}
                          onChange={(e) => setPrintHeader(prev => ({...prev, deliveryDate: e.target.value}))}
                          className="h-8"
                          placeholder="예: 2025년 2월 15일"
                          data-testid="input-delivery-date"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label htmlFor="paymentCondition" className="text-sm">결제조건</Label>
                        <Input
                          id="paymentCondition"
                          value={printHeader.paymentCondition}
                          onChange={(e) => setPrintHeader(prev => ({...prev, paymentCondition: e.target.value}))}
                          className="h-8"
                          data-testid="input-payment-condition"
                        />
                      </div>
                    </div>
                  </div>

                  {/* 납품 및 계좌 정보 */}
                  <div className="space-y-4">
                    <h3 className="font-medium text-sm text-muted-foreground">납품 및 계좌 정보</h3>
                    <div className="space-y-3">
                      <div className="space-y-1">
                        <Label htmlFor="deliveryLocation" className="text-sm">납품장소</Label>
                        <Input
                          id="deliveryLocation"
                          value={printHeader.deliveryLocation}
                          onChange={(e) => setPrintHeader(prev => ({...prev, deliveryLocation: e.target.value}))}
                          className="h-8"
                          data-testid="input-delivery-location"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label htmlFor="bankAccount" className="text-sm">입금계좌</Label>
                        <Input
                          id="bankAccount"
                          value={printHeader.bankAccount}
                          onChange={(e) => setPrintHeader(prev => ({...prev, bankAccount: e.target.value}))}
                          className="h-8"
                          data-testid="input-bank-account"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Input Parameters */}
            <Card>
              <CardHeader>
                <CardTitle>입력 값</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3">
                  <div className="space-y-1">
                    <Label htmlFor="area" className="text-sm">면적 (m²)</Label>
                    <Input
                      id="area"
                      type="number"
                      value={area}
                      onChange={(e) => setArea(e.target.value)}
                      placeholder="120"
                      data-testid="input-area"
                      className="h-8"
                    />
                  </div>

                  {(systemId === "RC" || systemId === "LGS" || systemId === "WOOD") && (
                    <div className="space-y-1">
                      <Label htmlFor="thickness" className="text-sm">두께 (mm)</Label>
                      <Select
                        value={systemId === "RC" ? String(rcThickness) : String(trackThickness)}
                        onValueChange={(v) => {
                          if (systemId === "RC") {
                            setRcThickness(Number(v));
                          } else {
                            setTrackThickness(Number(v));
                          }
                        }}
                      >
                        <SelectTrigger id="thickness" data-testid="select-thickness" className="h-8">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {getAvailableThicknesses().map((t) => (
                            <SelectItem key={t} value={String(t)}>
                              {t}T
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  {systemId === "FORM" && (
                    <div className="space-y-1">
                      <Label htmlFor="formThickness" className="text-sm">두께 (mm)</Label>
                      <Select
                        value={String(formThickness)}
                        onValueChange={(v) => setFormThickness(Number(v))}
                      >
                        <SelectTrigger id="formThickness" data-testid="select-form-thickness" className="h-8">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {getAvailableThicknesses().map((t) => (
                            <SelectItem key={t} value={String(t)}>
                              {t}T
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  {(systemId === "RC" || systemId === "LGS" || systemId === "WOOD") && (
                    <>
                      <div className="space-y-1">
                        <Label htmlFor="insulationLoss" className="text-sm">단열재 로스율 (%)</Label>
                        <Input
                          id="insulationLoss"
                          type="number"
                          value={insulationLossRate}
                          onChange={(e) => setInsulationLossRate(e.target.value)}
                          placeholder="8"
                          data-testid="input-insulation-loss"
                          className="h-8"
                        />
                      </div>

                      <div className="space-y-1">
                        <Label htmlFor="tileLoss" className="text-sm">타일 로스율 (%)</Label>
                        <Input
                          id="tileLoss"
                          type="number"
                          value={tileLossRate}
                          onChange={(e) => setTileLossRate(e.target.value)}
                          placeholder="10"
                          data-testid="input-tile-loss"
                          className="h-8"
                        />
                      </div>

                      <div className="space-y-1">
                        <Label htmlFor="cornerTileLength" className="text-sm">코너타일 길이 (m)</Label>
                        <Input
                          id="cornerTileLength"
                          type="number"
                          value={cornerTileLength}
                          onChange={(e) => setCornerTileLength(e.target.value)}
                          placeholder="0"
                          data-testid="input-corner-tile-length"
                          className="h-8"
                        />
                        <p className="text-xs text-muted-foreground">
                          m당 16장
                        </p>
                      </div>

                      <div className="flex items-center space-x-2">
                        <Switch
                          id="fireResistant"
                          checked={isFireResistant}
                          onCheckedChange={setIsFireResistant}
                          data-testid="switch-fire-resistant"
                        />
                        <Label htmlFor="fireResistant" className="text-sm font-medium">
                          준불연 단열재 (두께당 200원)
                        </Label>
                      </div>
                    </>
                  )}

                  <div className="space-y-1">
                    <Label htmlFor="roundStep" className="text-sm">버림 단위 (원)</Label>
                    <Input
                      id="roundStep"
                      type="number"
                      value={roundStep}
                      onChange={(e) => setRoundStep(e.target.value)}
                      placeholder="10"
                      data-testid="input-round-step"
                      className="h-8"
                    />
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="designFee"
                        checked={designFeeEnabled}
                        onCheckedChange={setDesignFeeEnabled}
                        data-testid="switch-design-fee"
                      />
                      <Label htmlFor="designFee" className="cursor-pointer text-sm">설계예가 적용</Label>
                    </div>
                    
                    {designFeeEnabled && (
                      <div className="space-y-1">
                        <Label htmlFor="designFeeRate" className="text-sm">설계예가 비율 (%)</Label>
                        <Input
                          id="designFeeRate"
                          type="number"
                          value={designFeeRate}
                          onChange={(e) => setDesignFeeRate(e.target.value)}
                          placeholder="10"
                          data-testid="input-design-fee-rate"
                          className="h-8"
                        />
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="labor"
                        checked={laborIncluded}
                        onCheckedChange={setLaborIncluded}
                        data-testid="switch-labor"
                      />
                      <Label htmlFor="labor" className="cursor-pointer text-sm">시공비 포함</Label>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="vat"
                        checked={vatIncluded}
                        onCheckedChange={setVatIncluded}
                        data-testid="switch-vat"
                      />
                      <Label htmlFor="vat" className="cursor-pointer text-sm">부가세 포함</Label>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Results */}
            <Card>
              <CardHeader>
                <CardTitle>자재 내역</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="text-left py-3 px-4 font-medium">품명</th>
                        <th className="text-right py-3 px-4 font-medium">단위</th>
                        <th className="text-right py-3 px-4 font-medium">수량</th>
                        <th className="text-right py-3 px-4 font-medium">단가 (원)</th>
                        <th className="text-right py-3 px-4 font-medium">공급가 (원)</th>
                      </tr>
                    </thead>
                    <tbody className="font-mono text-sm">
                      {materials.map((mat, idx) => {
                        const adjustedUnitPrice = mat.unitPrice * designFeeMultiplier;
                        const adjustedSupply = mat.supply * designFeeMultiplier;
                        return (
                          <tr key={idx} className="border-b border-border hover-elevate" data-testid={`row-material-${idx}`}>
                            <td className="py-3 px-4">{mat.name}</td>
                            <td className="text-right py-3 px-4">{mat.unit}</td>
                            <td className="text-right py-3 px-4">
                              {mat.name.includes("단열재") && !mat.name.includes("부착용") && !mat.name.includes("노무비") 
                                ? mat.qty.toFixed(1) 
                                : Math.round(mat.qty).toString()}
                            </td>
                            <td className="text-right py-3 px-4">{formatCurrency(adjustedUnitPrice)}</td>
                            <td className="text-right py-3 px-4">{formatCurrency(adjustedSupply)}</td>
                          </tr>
                        );
                      })}
                      {laborPerM2 > 0 && laborIncluded && (
                        <tr className="border-b border-border hover-elevate" data-testid="row-labor">
                          <td className="py-3 px-4">시공 인건비</td>
                          <td className="text-right py-3 px-4">㎡</td>
                          <td className="text-right py-3 px-4">{Math.round(Number(area)).toString()}</td>
                          <td className="text-right py-3 px-4">{formatCurrency(laborPerM2)}</td>
                          <td className="text-right py-3 px-4">{formatCurrency(laborSupply)}</td>
                        </tr>
                      )}
                      {discountAmount > 0 && (
                        <tr className="border-b border-border hover-elevate bg-red-50" data-testid="row-discount">
                          <td className="py-3 px-4 font-medium text-red-700">공제 (버림 단위 적용)</td>
                          <td className="text-right py-3 px-4">원</td>
                          <td className="text-right py-3 px-4">1</td>
                          <td className="text-right py-3 px-4">{formatCurrency(discountAmount)}</td>
                          <td className="text-right py-3 px-4 font-medium text-red-700">-{formatCurrency(discountAmount)}</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                <div className="mt-6 space-y-3 border-t border-border pt-4">
                  {designFeeEnabled && (
                    <div className="flex justify-between items-center text-lg">
                      <span className="font-medium text-blue-700">설계예가 적용 ({designFeeRate}%)</span>
                      <span className="font-mono text-blue-700">단가 상승 적용</span>
                    </div>
                  )}
                  <div className="flex justify-between items-center text-lg font-medium pt-2 border-t border-border">
                    <span>소계</span>
                    <span className="font-mono" data-testid="text-subtotal">{formatCurrency(subtotal)} 원</span>
                  </div>
                  {vatIncluded && (
                    <div className="flex justify-between items-center text-lg">
                      <span className="font-medium">부가세 (10%)</span>
                      <span className="font-mono" data-testid="text-vat">{formatCurrency(vat)} 원</span>
                    </div>
                  )}
                  <div className="flex justify-between items-center text-lg font-medium pt-2 border-t border-border">
                    <span>계산 총액</span>
                    <span className="font-mono" data-testid="text-total-before">{formatCurrency(total)} 원</span>
                  </div>
                  {discountAmount > 0 && (
                    <div className="flex justify-between items-center text-lg">
                      <span className="font-medium text-red-700">공제 (버림 단위 적용)</span>
                      <span className="font-mono text-red-700" data-testid="text-discount">-{formatCurrency(discountAmount)} 원</span>
                    </div>
                  )}
                  <div className="flex justify-between items-center text-xl font-semibold pt-3 border-t border-border">
                    <span>최종 총액</span>
                    <span className="font-mono text-primary" data-testid="text-total">{formatCurrency(totalRounded)} 원</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Print View */}
      <div className="hidden print:block">
        <div className="w-full max-w-4xl mx-auto p-8 text-sm" style={{fontFamily: 'Arial, sans-serif', backgroundColor: 'white'}}>
          {/* Header */}
          <div className="mb-6">
            <div className="flex justify-between items-start mb-4">
              <div>
                <p className="text-sm mb-2" style={{color: '#333'}}>서기: {new Date().toLocaleDateString('ko-KR', {year: 'numeric', month: 'long', day: 'numeric'})}</p>
                <div className="mb-2">
                  <p className="font-bold text-lg" style={{color: '#000'}}>{printHeader.recipient} 귀하</p>
                  <p className="text-sm" style={{color: '#333'}}>대표전화 : {printHeader.recipientPhone}</p>
                </div>
                <p className="text-sm" style={{color: '#333'}}>아래와 같이 견적 합니다.</p>
              </div>
              <div className="border border-black p-3 text-xs" style={{borderWidth: '1px', borderStyle: 'solid'}}>
                <p style={{color: '#000'}}>공 사업번호: {printHeader.businessNumber}</p>
                <p style={{color: '#000'}}>상 호: {printHeader.companyName}</p>
                <p style={{color: '#000'}}>전화번호: {printHeader.phone}</p>
                <p style={{color: '#000'}}>대표자: {printHeader.representative}</p>
                <p style={{color: '#000'}}>주 소: {printHeader.address}</p>
              </div>
            </div>
            <div className="text-center mb-4">
              <h1 className="text-2xl font-bold" style={{color: '#000', textDecoration: 'underline'}}>견적서</h1>
            </div>
            <div className="text-right mb-4">
              <p className="font-bold text-lg" style={{color: '#000'}}>합계금액 : {convertToKoreanNumber(totalRounded)}</p>
              <p className="text-sm" style={{color: '#333'}}>({formatCurrency(totalRounded)}) 부가세포함</p>
            </div>
          </div>

          {/* Items Table */}
          <table className="w-full border-collapse mb-6" style={{border: '1px solid #000'}}>
            <thead>
              <tr style={{backgroundColor: '#f5f5f5'}}>
                <th className="p-2 text-center" style={{border: '1px solid #000', width: '50px', fontSize: '12px', fontWeight: 'bold'}}>No</th>
                <th className="p-2 text-center" style={{border: '1px solid #000', fontSize: '12px', fontWeight: 'bold'}}>품 명 / 규 격</th>
                <th className="p-2 text-center" style={{border: '1px solid #000', width: '60px', fontSize: '12px', fontWeight: 'bold'}}>단위</th>
                <th className="p-2 text-center" style={{border: '1px solid #000', width: '80px', fontSize: '12px', fontWeight: 'bold'}}>수량</th>
                <th className="p-2 text-center" style={{border: '1px solid #000', width: '100px', fontSize: '12px', fontWeight: 'bold'}}>단 가</th>
                <th className="p-2 text-center" style={{border: '1px solid #000', width: '120px', fontSize: '12px', fontWeight: 'bold'}}>금 액</th>
              </tr>
            </thead>
            <tbody>
              {materials.map((mat, idx) => {
                const adjustedUnitPrice = mat.unitPrice * designFeeMultiplier;
                const adjustedSupply = mat.supply * designFeeMultiplier;
                return (
                  <tr key={idx}>
                    <td className="p-2 text-center" style={{border: '1px solid #000', fontSize: '12px'}}>{idx + 1}</td>
                    <td className="p-2" style={{border: '1px solid #000', fontSize: '12px'}}>{mat.name}</td>
                    <td className="p-2 text-center" style={{border: '1px solid #000', fontSize: '12px'}}>{mat.unit}</td>
                    <td className="p-2 text-right" style={{border: '1px solid #000', fontSize: '12px'}}>
                      {mat.name.includes("단열재") && !mat.name.includes("부착용") && !mat.name.includes("노무비") 
                        ? mat.qty.toFixed(1) 
                        : Math.round(mat.qty).toString()}
                    </td>
                    <td className="p-2 text-right" style={{border: '1px solid #000', fontSize: '12px'}}>{formatCurrency(adjustedUnitPrice)}</td>
                    <td className="p-2 text-right" style={{border: '1px solid #000', fontSize: '12px'}}>{formatCurrency(adjustedSupply)}</td>
                  </tr>
                );
              })}
              {laborPerM2 > 0 && laborIncluded && (
                <tr>
                  <td className="p-2 text-center" style={{border: '1px solid #000', fontSize: '12px'}}>{materials.length + 1}</td>
                  <td className="p-2" style={{border: '1px solid #000', fontSize: '12px'}}>시공 인건비</td>
                  <td className="p-2 text-center" style={{border: '1px solid #000', fontSize: '12px'}}>㎡</td>
                  <td className="p-2 text-right" style={{border: '1px solid #000', fontSize: '12px'}}>{Math.round(Number(area)).toString()}</td>
                  <td className="p-2 text-right" style={{border: '1px solid #000', fontSize: '12px'}}>{formatCurrency(laborPerM2)}</td>
                  <td className="p-2 text-right" style={{border: '1px solid #000', fontSize: '12px'}}>{formatCurrency(laborSupply)}</td>
                </tr>
              )}
              {/* Empty rows for additional items */}
              {Array.from({length: 10}).map((_, idx) => (
                <tr key={`empty-${idx}`}>
                  <td className="p-2" style={{border: '1px solid #000', fontSize: '12px'}}></td>
                  <td className="p-2" style={{border: '1px solid #000', fontSize: '12px'}}></td>
                  <td className="p-2" style={{border: '1px solid #000', fontSize: '12px'}}></td>
                  <td className="p-2" style={{border: '1px solid #000', fontSize: '12px'}}></td>
                  <td className="p-2" style={{border: '1px solid #000', fontSize: '12px'}}></td>
                  <td className="p-2" style={{border: '1px solid #000', fontSize: '12px'}}></td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Footer */}
          <div className="grid grid-cols-2 gap-8">
            <div className="space-y-2" style={{fontSize: '12px', color: '#000'}}>
              <p>제품형식: {printHeader.productType}</p>
              <p>납품일자: {printHeader.deliveryDate}</p>
              <p>결제조건: {printHeader.paymentCondition}</p>
              <p>납품장소 : {printHeader.deliveryLocation}</p>
              <p>입금계좌: {printHeader.bankAccount}</p>
            </div>
            <div className="p-3 text-sm" style={{border: '1px solid #000', fontSize: '12px'}}>
              <div className="flex justify-between mb-1" style={{color: '#000'}}>
                <span>공급가:</span>
                <span>{formatCurrency(subtotal)}</span>
              </div>
              <div className="flex justify-between mb-1" style={{color: '#000'}}>
                <span>부가세:</span>
                <span>{formatCurrency(vat)}</span>
              </div>
              <div className="flex justify-between font-bold pt-1" style={{color: '#000', borderTop: '1px solid #000'}}>
                <span>합계금액:</span>
                <span>{formatCurrency(totalRounded)}</span>
              </div>
            </div>
          </div>

          <div className="text-right mt-4">
            <p className="text-xs" style={{color: '#000'}}>Page: 1/1</p>
          </div>
        </div>
      </div>

      {/* Preview Modal */}
      <Dialog open={showPreview} onOpenChange={setShowPreview}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-auto">
          <DialogHeader>
            <DialogTitle>견적서 미리보기</DialogTitle>
          </DialogHeader>
          <div className="bg-white p-8 text-sm" style={{fontFamily: 'Arial, sans-serif'}}>
            {/* Header */}
            <div className="mb-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <p className="text-sm mb-2" style={{color: '#333'}}>서기: {new Date().toLocaleDateString('ko-KR', {year: 'numeric', month: 'long', day: 'numeric'})}</p>
                  <div className="mb-2">
                    <p className="font-bold text-lg" style={{color: '#000'}}>{printHeader.recipient} 귀하</p>
                    <p className="text-sm" style={{color: '#333'}}>대표전화 : {printHeader.recipientPhone}</p>
                  </div>
                  <p className="text-sm" style={{color: '#333'}}>아래와 같이 견적 합니다.</p>
                </div>
                <div className="border border-black p-3 text-xs" style={{borderWidth: '1px', borderStyle: 'solid'}}>
                  <p style={{color: '#000'}}>공 사업번호: {printHeader.businessNumber}</p>
                  <p style={{color: '#000'}}>상 호: {printHeader.companyName}</p>
                  <p style={{color: '#000'}}>전화번호: {printHeader.phone}</p>
                  <p style={{color: '#000'}}>대표자: {printHeader.representative}</p>
                  <p style={{color: '#000'}}>주 소: {printHeader.address}</p>
                </div>
              </div>
              <div className="text-center mb-4">
                <h1 className="text-2xl font-bold" style={{color: '#000', textDecoration: 'underline'}}>견적서</h1>
              </div>
              <div className="text-right mb-4">
                <p className="font-bold text-lg" style={{color: '#000'}}>합계금액 : {convertToKoreanNumber(totalRounded)}</p>
                <p className="text-sm" style={{color: '#333'}}>({formatCurrency(totalRounded)}) 부가세포함</p>
              </div>
            </div>

            {/* Items Table */}
            <table className="w-full border-collapse mb-6" style={{border: '1px solid #000'}}>
              <thead>
                <tr style={{backgroundColor: '#f5f5f5'}}>
                  <th className="p-2 text-center" style={{border: '1px solid #000', width: '50px', fontSize: '12px', fontWeight: 'bold'}}>No</th>
                  <th className="p-2 text-center" style={{border: '1px solid #000', fontSize: '12px', fontWeight: 'bold'}}>품 명 / 규 격</th>
                  <th className="p-2 text-center" style={{border: '1px solid #000', width: '60px', fontSize: '12px', fontWeight: 'bold'}}>단위</th>
                  <th className="p-2 text-center" style={{border: '1px solid #000', width: '80px', fontSize: '12px', fontWeight: 'bold'}}>수량</th>
                  <th className="p-2 text-center" style={{border: '1px solid #000', width: '100px', fontSize: '12px', fontWeight: 'bold'}}>단 가</th>
                  <th className="p-2 text-center" style={{border: '1px solid #000', width: '120px', fontSize: '12px', fontWeight: 'bold'}}>금 액</th>
                </tr>
              </thead>
              <tbody>
                {materials.map((mat, idx) => {
                  const adjustedUnitPrice = mat.unitPrice * designFeeMultiplier;
                  const adjustedSupply = mat.supply * designFeeMultiplier;
                  return (
                    <tr key={idx}>
                      <td className="p-2 text-center" style={{border: '1px solid #000', fontSize: '12px'}}>{idx + 1}</td>
                      <td className="p-2" style={{border: '1px solid #000', fontSize: '12px'}}>{mat.name}</td>
                      <td className="p-2 text-center" style={{border: '1px solid #000', fontSize: '12px'}}>{mat.unit}</td>
                      <td className="p-2 text-right" style={{border: '1px solid #000', fontSize: '12px'}}>
                        {mat.name.includes("단열재") && !mat.name.includes("부착용") && !mat.name.includes("노무비") 
                          ? mat.qty.toFixed(1) 
                          : Math.round(mat.qty).toString()}
                      </td>
                      <td className="p-2 text-right" style={{border: '1px solid #000', fontSize: '12px'}}>{formatCurrency(adjustedUnitPrice)}</td>
                      <td className="p-2 text-right" style={{border: '1px solid #000', fontSize: '12px'}}>{formatCurrency(adjustedSupply)}</td>
                    </tr>
                  );
                })}
                {laborPerM2 > 0 && laborIncluded && (
                  <tr>
                    <td className="p-2 text-center" style={{border: '1px solid #000', fontSize: '12px'}}>{materials.length + 1}</td>
                    <td className="p-2" style={{border: '1px solid #000', fontSize: '12px'}}>시공 인건비</td>
                    <td className="p-2 text-center" style={{border: '1px solid #000', fontSize: '12px'}}>㎡</td>
                    <td className="p-2 text-right" style={{border: '1px solid #000', fontSize: '12px'}}>{Math.round(Number(area)).toString()}</td>
                    <td className="p-2 text-right" style={{border: '1px solid #000', fontSize: '12px'}}>{formatCurrency(laborPerM2)}</td>
                    <td className="p-2 text-right" style={{border: '1px solid #000', fontSize: '12px'}}>{formatCurrency(laborSupply)}</td>
                  </tr>
                )}
                {/* Empty rows for additional items */}
                {Array.from({length: 10}).map((_, idx) => (
                  <tr key={`empty-${idx}`}>
                    <td className="p-2" style={{border: '1px solid #000', fontSize: '12px'}}></td>
                    <td className="p-2" style={{border: '1px solid #000', fontSize: '12px'}}></td>
                    <td className="p-2" style={{border: '1px solid #000', fontSize: '12px'}}></td>
                    <td className="p-2" style={{border: '1px solid #000', fontSize: '12px'}}></td>
                    <td className="p-2" style={{border: '1px solid #000', fontSize: '12px'}}></td>
                    <td className="p-2" style={{border: '1px solid #000', fontSize: '12px'}}></td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Footer */}
            <div className="grid grid-cols-2 gap-8">
              <div className="space-y-2" style={{fontSize: '12px', color: '#000'}}>
                <p>제품형식: {printHeader.productType}</p>
                <p>납품일자: {printHeader.deliveryDate}</p>
                <p>결제조건: {printHeader.paymentCondition}</p>
                <p>납품장소 : {printHeader.deliveryLocation}</p>
                <p>입금계좌: {printHeader.bankAccount}</p>
              </div>
              <div className="p-3 text-sm" style={{border: '1px solid #000', fontSize: '12px'}}>
                <div className="flex justify-between mb-1" style={{color: '#000'}}>
                  <span>공급가:</span>
                  <span>{formatCurrency(subtotal)}</span>
                </div>
                <div className="flex justify-between mb-1" style={{color: '#000'}}>
                  <span>부가세:</span>
                  <span>{formatCurrency(vat)}</span>
                </div>
                <div className="flex justify-between font-bold pt-1" style={{color: '#000', borderTop: '1px solid #000'}}>
                  <span>합계금액:</span>
                  <span>{formatCurrency(totalRounded)}</span>
                </div>
              </div>
            </div>

            <div className="text-right mt-4">
              <p className="text-xs" style={{color: '#000'}}>Page: 1/1</p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
