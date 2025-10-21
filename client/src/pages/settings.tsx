import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Plus, Save, X } from "lucide-react";
import { Link } from "wouter";
import type { PriceConfiguration } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";

export default function Settings() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("rc");
  const [newThickness, setNewThickness] = useState("");
  const [newPrice, setNewPrice] = useState("");

  const { data: priceConfig, isLoading } = useQuery<PriceConfiguration>({
    queryKey: ['/api/prices'],
  });

  const [localConfig, setLocalConfig] = useState<PriceConfiguration | null>(null);

  // Initialize local config when data loads
  if (priceConfig && !localConfig) {
    setLocalConfig(priceConfig);
  }

  const updateMutation = useMutation({
    mutationFn: async (config: PriceConfiguration) => {
      return await apiRequest<PriceConfiguration>('PUT', '/api/prices', config);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/prices'] });
      toast({
        title: "저장 완료",
        description: "가격표가 성공적으로 저장되었습니다.",
      });
    },
    onError: () => {
      toast({
        title: "저장 실패",
        description: "가격표 저장 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    },
  });

  const handleSave = () => {
    if (localConfig) {
      updateMutation.mutate(localConfig);
    }
  };

  const updateThicknessPrice = (category: keyof Pick<PriceConfiguration, 'rcThicknessPrices' | 'trackThicknessPrices' | 'formThicknessPrices'>, thickness: number, price: number) => {
    if (!localConfig) return;
    setLocalConfig({
      ...localConfig,
      [category]: {
        ...localConfig[category],
        [thickness]: price,
      },
    });
  };

  const removeThickness = (category: keyof Pick<PriceConfiguration, 'rcThicknessPrices' | 'trackThicknessPrices' | 'formThicknessPrices'>, thickness: number) => {
    if (!localConfig) return;
    const newPrices = { ...localConfig[category] };
    delete newPrices[thickness];
    setLocalConfig({
      ...localConfig,
      [category]: newPrices,
    });
  };

  const addNewThickness = () => {
    if (!localConfig || !newThickness || !newPrice) return;
    
    const thickness = Number(newThickness);
    const price = Number(newPrice);
    
    if (activeTab === "rc") {
      updateThicknessPrice('rcThicknessPrices', thickness, price);
    } else if (activeTab === "track") {
      updateThicknessPrice('trackThicknessPrices', thickness, price);
    } else if (activeTab === "form") {
      updateThicknessPrice('formThicknessPrices', thickness, price);
    }
    
    setNewThickness("");
    setNewPrice("");
  };

  const updateMaterialPrice = (material: string, price: number) => {
    if (!localConfig) return;
    setLocalConfig({
      ...localConfig,
      materialPrices: {
        ...localConfig.materialPrices,
        [material]: price,
      },
    });
  };

  const updateLaborRate = (labor: string, rate: number) => {
    if (!localConfig) return;
    setLocalConfig({
      ...localConfig,
      laborRates: {
        ...localConfig.laborRates,
        [labor]: rate,
      },
    });
  };

  if (isLoading || !localConfig) {
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
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Link href="/">
                <Button variant="ghost" size="icon" data-testid="button-back">
                  <ArrowLeft className="h-5 w-5" />
                </Button>
              </Link>
              <h1 className="text-2xl font-semibold text-foreground">가격표 관리</h1>
            </div>
            <Button 
              onClick={handleSave} 
              variant="default" 
              size="default"
              disabled={updateMutation.isPending}
              data-testid="button-save"
            >
              <Save className="h-4 w-4 mr-2" />
              {updateMutation.isPending ? "저장 중..." : "저장"}
            </Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-5 mb-6">
            <TabsTrigger value="rc" data-testid="tab-rc">RC 두께별 단가</TabsTrigger>
            <TabsTrigger value="track" data-testid="tab-track">트랙식 두께별 단가</TabsTrigger>
            <TabsTrigger value="form" data-testid="tab-form">패턴거푸집 두께별 단가</TabsTrigger>
            <TabsTrigger value="materials" data-testid="tab-materials">부자재 가격</TabsTrigger>
            <TabsTrigger value="labor" data-testid="tab-labor">인건비</TabsTrigger>
          </TabsList>

          {/* RC Thickness Prices */}
          <TabsContent value="rc">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>RC 두께별 단가 (원/㎡)</CardTitle>
                  <div className="flex gap-2">
                    <Input
                      type="number"
                      placeholder="두께 (mm)"
                      value={newThickness}
                      onChange={(e) => setNewThickness(e.target.value)}
                      className="w-28"
                      data-testid="input-new-thickness"
                    />
                    <Input
                      type="number"
                      placeholder="가격 (원)"
                      value={newPrice}
                      onChange={(e) => setNewPrice(e.target.value)}
                      className="w-32"
                      data-testid="input-new-price"
                    />
                    <Button onClick={addNewThickness} size="default" data-testid="button-add-thickness">
                      <Plus className="h-4 w-4 mr-2" />
                      추가
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {Object.entries(localConfig.rcThicknessPrices)
                    .sort(([a], [b]) => Number(a) - Number(b))
                    .map(([thickness, price]) => (
                      <div key={thickness} className="flex items-center gap-2 p-4 border border-border rounded-md">
                        <Label className="font-medium min-w-[60px]">{thickness}T</Label>
                        <Input
                          type="number"
                          value={price}
                          onChange={(e) => updateThicknessPrice('rcThicknessPrices', Number(thickness), Number(e.target.value))}
                          className="flex-1"
                          data-testid={`input-rc-${thickness}`}
                        />
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => removeThickness('rcThicknessPrices', Number(thickness))}
                          data-testid={`button-remove-rc-${thickness}`}
                        >
                          <X className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Track Thickness Prices */}
          <TabsContent value="track">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>트랙식 두께별 단가 (원/㎡)</CardTitle>
                  <div className="flex gap-2">
                    <Input
                      type="number"
                      placeholder="두께 (mm)"
                      value={newThickness}
                      onChange={(e) => setNewThickness(e.target.value)}
                      className="w-28"
                      data-testid="input-new-thickness"
                    />
                    <Input
                      type="number"
                      placeholder="가격 (원)"
                      value={newPrice}
                      onChange={(e) => setNewPrice(e.target.value)}
                      className="w-32"
                      data-testid="input-new-price"
                    />
                    <Button onClick={addNewThickness} size="default" data-testid="button-add-thickness">
                      <Plus className="h-4 w-4 mr-2" />
                      추가
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {Object.entries(localConfig.trackThicknessPrices)
                    .sort(([a], [b]) => Number(a) - Number(b))
                    .map(([thickness, price]) => (
                      <div key={thickness} className="flex items-center gap-2 p-4 border border-border rounded-md">
                        <Label className="font-medium min-w-[60px]">{thickness}T</Label>
                        <Input
                          type="number"
                          value={price}
                          onChange={(e) => updateThicknessPrice('trackThicknessPrices', Number(thickness), Number(e.target.value))}
                          className="flex-1"
                          data-testid={`input-track-${thickness}`}
                        />
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => removeThickness('trackThicknessPrices', Number(thickness))}
                          data-testid={`button-remove-track-${thickness}`}
                        >
                          <X className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Form Thickness Prices */}
          <TabsContent value="form">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>패턴거푸집 두께별 단가 (원/㎡)</CardTitle>
                  <div className="flex gap-2">
                    <Input
                      type="number"
                      placeholder="두께 (mm)"
                      value={newThickness}
                      onChange={(e) => setNewThickness(e.target.value)}
                      className="w-28"
                      data-testid="input-new-thickness"
                    />
                    <Input
                      type="number"
                      placeholder="가격 (원)"
                      value={newPrice}
                      onChange={(e) => setNewPrice(e.target.value)}
                      className="w-32"
                      data-testid="input-new-price"
                    />
                    <Button onClick={addNewThickness} size="default" data-testid="button-add-thickness">
                      <Plus className="h-4 w-4 mr-2" />
                      추가
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {Object.entries(localConfig.formThicknessPrices)
                    .sort(([a], [b]) => Number(a) - Number(b))
                    .map(([thickness, price]) => (
                      <div key={thickness} className="flex items-center gap-2 p-4 border border-border rounded-md">
                        <Label className="font-medium min-w-[60px]">{thickness}T</Label>
                        <Input
                          type="number"
                          value={price}
                          onChange={(e) => updateThicknessPrice('formThicknessPrices', Number(thickness), Number(e.target.value))}
                          className="flex-1"
                          data-testid={`input-form-${thickness}`}
                        />
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => removeThickness('formThicknessPrices', Number(thickness))}
                          data-testid={`button-remove-form-${thickness}`}
                        >
                          <X className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Material Prices */}
          <TabsContent value="materials">
            <Card>
              <CardHeader>
                <CardTitle>부자재 가격 (원)</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {Object.entries(localConfig.materialPrices).map(([material, price]) => (
                    <div key={material} className="flex items-center gap-2 p-4 border border-border rounded-md">
                      <Label className="font-medium min-w-[180px]">{material}</Label>
                      <Input
                        type="number"
                        value={price}
                        onChange={(e) => updateMaterialPrice(material, Number(e.target.value))}
                        className="flex-1"
                        data-testid={`input-material-${material.replace(/\s+/g, '-')}`}
                      />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Labor Rates */}
          <TabsContent value="labor">
            <Card>
              <CardHeader>
                <CardTitle>인건비 (원/㎡)</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {Object.entries(localConfig.laborRates).map(([labor, rate]) => (
                    <div key={labor} className="flex items-center gap-2 p-4 border border-border rounded-md">
                      <Label className="font-medium min-w-[180px]">{labor}</Label>
                      <Input
                        type="number"
                        value={rate}
                        onChange={(e) => updateLaborRate(labor, Number(e.target.value))}
                        className="flex-1"
                        data-testid={`input-labor-${labor.replace(/\s+/g, '-')}`}
                      />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
