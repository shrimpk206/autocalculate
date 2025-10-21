import type { PriceConfiguration } from "@shared/schema";
import { defaultPriceConfiguration } from "@shared/schema";

export interface IStorage {
  getPriceConfiguration(): Promise<PriceConfiguration>;
  updatePriceConfiguration(config: PriceConfiguration): Promise<PriceConfiguration>;
}

export class MemStorage implements IStorage {
  private priceConfig: PriceConfiguration;

  constructor() {
    this.priceConfig = {
      id: 'default',
      ...defaultPriceConfiguration
    };
  }

  async getPriceConfiguration(): Promise<PriceConfiguration> {
    return this.priceConfig;
  }

  async updatePriceConfiguration(config: PriceConfiguration): Promise<PriceConfiguration> {
    this.priceConfig = config;
    return this.priceConfig;
  }
}

export const storage = new MemStorage();
