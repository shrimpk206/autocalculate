import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calculator, Printer, Settings as SettingsIcon } from "lucide-react";
import { calculateMaterials, formatCurrency, roundTo } from "@/lib/calculations";
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
      },
      priceConfig
    );
  }, [priceConfig, systemId, area, rcThickness, trackThickness, formThickness, insulationLossRate, tileLossRate]);

  const laborPerM2 = systemId === "FORM" ? (priceConfig?.laborRates["패턴거푸집 시공비"] ?? 12000) : 0;
  const laborSupply = laborPerM2 * (Number(area) || 0);
  const materialsSupply = materials.reduce((sum, m) => sum + m.supply, 0);
  const subtotal = materialsSupply + laborSupply;
  const vat = subtotal * VAT_RATE;
  const total = vatIncluded ? subtotal + vat : subtotal;
  const totalRounded = roundTo(total, Number(roundStep) || 1);

  const onPrint = () => window.print();

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

            {/* Input Parameters */}
            <Card>
              <CardHeader>
                <CardTitle>입력 값</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="area">면적 (m²)</Label>
                    <Input
                      id="area"
                      type="number"
                      value={area}
                      onChange={(e) => setArea(e.target.value)}
                      placeholder="120"
                      data-testid="input-area"
                    />
                  </div>

                  {(systemId === "RC" || systemId === "LGS" || systemId === "WOOD") && (
                    <div className="space-y-2">
                      <Label htmlFor="thickness">두께 (mm)</Label>
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
                        <SelectTrigger id="thickness" data-testid="select-thickness">
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
                    <div className="space-y-2">
                      <Label htmlFor="formThickness">두께 (mm)</Label>
                      <Select
                        value={String(formThickness)}
                        onValueChange={(v) => setFormThickness(Number(v))}
                      >
                        <SelectTrigger id="formThickness" data-testid="select-form-thickness">
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
                      <div className="space-y-2">
                        <Label htmlFor="insulationLoss">단열재 로스율 (%)</Label>
                        <Input
                          id="insulationLoss"
                          type="number"
                          value={insulationLossRate}
                          onChange={(e) => setInsulationLossRate(e.target.value)}
                          placeholder="8"
                          data-testid="input-insulation-loss"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="tileLoss">타일 로스율 (%)</Label>
                        <Input
                          id="tileLoss"
                          type="number"
                          value={tileLossRate}
                          onChange={(e) => setTileLossRate(e.target.value)}
                          placeholder="10"
                          data-testid="input-tile-loss"
                        />
                      </div>
                    </>
                  )}

                  <div className="space-y-2">
                    <Label htmlFor="roundStep">반올림 단위 (원)</Label>
                    <Input
                      id="roundStep"
                      type="number"
                      value={roundStep}
                      onChange={(e) => setRoundStep(e.target.value)}
                      placeholder="10"
                      data-testid="input-round-step"
                    />
                  </div>

                  <div className="flex items-end">
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="vat"
                        checked={vatIncluded}
                        onCheckedChange={setVatIncluded}
                        data-testid="switch-vat"
                      />
                      <Label htmlFor="vat" className="cursor-pointer">부가세 포함</Label>
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
                      {materials.map((mat, idx) => (
                        <tr key={idx} className="border-b border-border hover-elevate" data-testid={`row-material-${idx}`}>
                          <td className="py-3 px-4">{mat.name}</td>
                          <td className="text-right py-3 px-4">{mat.unit}</td>
                          <td className="text-right py-3 px-4">{mat.qty.toFixed(2)}</td>
                          <td className="text-right py-3 px-4">{formatCurrency(mat.unitPrice)}</td>
                          <td className="text-right py-3 px-4">{formatCurrency(mat.supply)}</td>
                        </tr>
                      ))}
                      {laborPerM2 > 0 && (
                        <tr className="border-b border-border hover-elevate" data-testid="row-labor">
                          <td className="py-3 px-4">시공 인건비</td>
                          <td className="text-right py-3 px-4">㎡</td>
                          <td className="text-right py-3 px-4">{Number(area).toFixed(2)}</td>
                          <td className="text-right py-3 px-4">{formatCurrency(laborPerM2)}</td>
                          <td className="text-right py-3 px-4">{formatCurrency(laborSupply)}</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                <div className="mt-6 space-y-3 border-t border-border pt-4">
                  <div className="flex justify-between items-center text-lg">
                    <span className="font-medium">소계</span>
                    <span className="font-mono" data-testid="text-subtotal">{formatCurrency(subtotal)} 원</span>
                  </div>
                  {vatIncluded && (
                    <div className="flex justify-between items-center text-lg">
                      <span className="font-medium">부가세 (10%)</span>
                      <span className="font-mono" data-testid="text-vat">{formatCurrency(vat)} 원</span>
                    </div>
                  )}
                  <div className="flex justify-between items-center text-xl font-semibold pt-3 border-t border-border">
                    <span>총액</span>
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
        <div className="container mx-auto px-8 py-6">
          <div className="text-center mb-8 pb-6 border-b-2 border-gray-900">
            <h1 className="text-3xl font-bold mb-2">미트하임 자재 견적서</h1>
            <p className="text-sm text-gray-600">
              발행일: {new Date().toLocaleDateString('ko-KR')}
            </p>
          </div>

          <div className="mb-6 grid grid-cols-2 gap-4 text-sm">
            <div className="space-y-1">
              <p><strong>시스템:</strong> {SYSTEMS.find(s => s.id === systemId)?.label}</p>
              <p><strong>면적:</strong> {area} m²</p>
            </div>
            <div className="space-y-1">
              {systemId === "RC" && <p><strong>두께:</strong> {rcThickness}mm</p>}
              {(systemId === "LGS" || systemId === "WOOD") && <p><strong>두께:</strong> {trackThickness}mm</p>}
              {systemId === "FORM" && <p><strong>두께:</strong> {formThickness}mm</p>}
              <p><strong>부가세:</strong> {vatIncluded ? "포함" : "별도"}</p>
            </div>
          </div>

          <table className="w-full mb-8 text-sm border-collapse">
            <thead>
              <tr className="border-b-2 border-gray-900">
                <th className="text-left py-2 px-2">품명</th>
                <th className="text-right py-2 px-2">단위</th>
                <th className="text-right py-2 px-2">수량</th>
                <th className="text-right py-2 px-2">단가</th>
                <th className="text-right py-2 px-2">공급가</th>
              </tr>
            </thead>
            <tbody>
              {materials.map((mat, idx) => (
                <tr key={idx} className="border-b border-gray-300">
                  <td className="py-2 px-2">{mat.name}</td>
                  <td className="text-right py-2 px-2">{mat.unit}</td>
                  <td className="text-right py-2 px-2">{mat.qty.toFixed(2)}</td>
                  <td className="text-right py-2 px-2">{formatCurrency(mat.unitPrice)}</td>
                  <td className="text-right py-2 px-2">{formatCurrency(mat.supply)}</td>
                </tr>
              ))}
              {laborPerM2 > 0 && (
                <tr className="border-b border-gray-300">
                  <td className="py-2 px-2">시공 인건비</td>
                  <td className="text-right py-2 px-2">㎡</td>
                  <td className="text-right py-2 px-2">{Number(area).toFixed(2)}</td>
                  <td className="text-right py-2 px-2">{formatCurrency(laborPerM2)}</td>
                  <td className="text-right py-2 px-2">{formatCurrency(laborSupply)}</td>
                </tr>
              )}
            </tbody>
          </table>

          <div className="space-y-2 text-right">
            <p className="text-lg"><strong>소계:</strong> {formatCurrency(subtotal)} 원</p>
            {vatIncluded && (
              <p className="text-lg"><strong>부가세 (10%):</strong> {formatCurrency(vat)} 원</p>
            )}
            <p className="text-2xl font-bold border-t-2 border-gray-900 pt-2 mt-2">
              <strong>총액:</strong> {formatCurrency(totalRounded)} 원
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
