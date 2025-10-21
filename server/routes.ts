import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import type { PriceConfiguration } from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  // Get price configuration
  app.get("/api/prices", async (_req, res) => {
    try {
      const priceConfig = await storage.getPriceConfiguration();
      res.json(priceConfig);
    } catch (error) {
      console.error('Error fetching price configuration:', error);
      res.status(500).json({ error: 'Failed to fetch price configuration' });
    }
  });

  // Update price configuration
  app.put("/api/prices", async (req, res) => {
    try {
      const updatedConfig: PriceConfiguration = req.body;
      const savedConfig = await storage.updatePriceConfiguration(updatedConfig);
      res.json(savedConfig);
    } catch (error) {
      console.error('Error updating price configuration:', error);
      res.status(500).json({ error: 'Failed to update price configuration' });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
