
import { Router } from "express";
import mongoose from "mongoose";

const router = Router();

router.get("/", (req, res) => {
  const databaseConnected = mongoose.connection.readyState === 1;

  res.status(databaseConnected ? 200 : 503).json({
    success: databaseConnected,
    status: databaseConnected ? "healthy" : "unavailable",
    services: {
      api: "up",
      database: databaseConnected ? "connected" : "disconnected",
    },
    timestamp: new Date().toISOString(),
  });
});

export default router;