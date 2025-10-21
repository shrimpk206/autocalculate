import { pgTable, text, varchar, jsonb, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Price configuration table
export const priceConfigurations = pgTable("price_configurations", {
  id: varchar("id").primaryKey().default('default'),
  rcThicknessPrices: jsonb("rc_thickness_prices").notNull().$type<Record<number, number>>(),
  trackThicknessPrices: jsonb("track_thickness_prices").notNull().$type<Record<number, number>>(),
  formThicknessPrices: jsonb("form_thickness_prices").notNull().$type<Record<number, number>>(),
  materialPrices: jsonb("material_prices").notNull().$type<Record<string, number>>(),
  laborRates: jsonb("labor_rates").notNull().$type<Record<string, number>>(),
});

export const insertPriceConfigurationSchema = createInsertSchema(priceConfigurations);
export type InsertPriceConfiguration = z.infer<typeof insertPriceConfigurationSchema>;
export type PriceConfiguration = typeof priceConfigurations.$inferSelect;

// TypeScript interfaces for the application
export interface MaterialItem {
  name: string;
  unit: string;
  qty: number;
  unitPrice: number;
  supply: number;
}

export interface CalculationParams {
  systemId: 'RC' | 'LGS' | 'WOOD' | 'FORM';
  area: number;
  rcThickness?: number;
  trackThickness?: number;
  formThickness?: number;
  insulationLossRate: number;
  tileLossRate: number;
}

export interface CalculationResult {
  materials: MaterialItem[];
  laborSupply: number;
  subtotal: number;
  vat: number;
  total: number;
  totalRounded: number;
}

// Default price configuration
export const defaultPriceConfiguration: Omit<PriceConfiguration, 'id'> = {
  rcThicknessPrices: {
    100: 16000, 120: 18700, 125: 19300, 130: 19700, 135: 19900,
    150: 22400, 155: 23200, 160: 24000, 170: 24800, 180: 26000,
    190: 27400, 200: 28800, 220: 31700, 240: 34600, 250: 36100, 300: 43300
  },
  trackThicknessPrices: {
    100: 16000, 120: 18700, 125: 19300, 130: 19700, 135: 19900,
    150: 22400, 155: 23200, 160: 24000, 170: 24800, 180: 26000,
    190: 27400, 200: 28800, 220: 31700, 240: 34600, 250: 36100, 300: 43300
  },
  formThicknessPrices: {
    60: 17600, 65: 18700, 70: 19800, 80: 22000, 90: 24200,
    100: 26400, 110: 28600, 120: 30800, 130: 32000, 140: 34000,
    150: 36300, 160: 37500, 180: 38500
  },
  materialPrices: {
    "Terra Flex 20kg": 21000,
    "메지 시멘트": 6500,
    "접착 몰탈": 35000,
    "단열재 부착용 폼본드": 6500,
    "드릴비트": 5000,
    "디스크 앙카": 400,
    "알루미늄 트랙": 1000,
    "철판피스": 40,
    "델타피스": 40,
    "벽돌타일 (로스율 10%)": 18000,
    "코너타일": 1200,
    "박리제": 55000
  },
  laborRates: {
    "단열재 노무비": 23000,
    "타일 노무비": 23000,
    "메지 시공비": 10000,
    "단열재 노무비(리모델링)": 25000,
    "패턴거푸집 시공비": 12000
  }
};
