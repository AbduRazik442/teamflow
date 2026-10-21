import "dotenv/config";
import { validateEnv } from "./config/validateEnv.js";
import mongoose from "mongoose";
import app from "./app.js";
import connectDB from "./config/database.js";

const PORT = Number(process.env.PORT) || 5000;

async function startServer() {
  validateEnv();
  await connectDB();

  const server = app.listen(PORT, () => {
    console.log(`TeamFlow API running on http://localhost:${PORT}`);
  });

  let shuttingDown = false;

  async function shutdown(signal) {
    if (shuttingDown) return;
    shuttingDown = true;

    console.log(`${signal} received. Closing TeamFlow...`);

    server.close(async (error) => {
      try {
        await mongoose.disconnect();
      } catch (disconnectError) {
        console.error("Database shutdown error:", disconnectError);
        process.exitCode = 1;
      }

      if (error) {
        console.error("Server shutdown error:", error);
        process.exitCode = 1;
      }

      if (process.exitCode !== 1) {
        process.exitCode = 0;
      }
    });
  }

  process.once("SIGINT", () => shutdown("SIGINT"));
  process.once("SIGTERM", () => shutdown("SIGTERM"));
}

startServer().catch((error) => {
  console.error("Failed to start TeamFlow API:", error.message);
  process.exitCode = 1;
});
