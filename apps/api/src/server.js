import "dotenv/config";
import app from "./app.js";

const PORT = Number(process.env.PORT) || 5000;

const server = app.listen(PORT, () => {
  console.log(`TeamFlow API running on http://localhost:${PORT}`);
});

function shutdown(signal) {
  console.log(`${signal} received. Closing server...`);

  server.close((error) => {
    if (error) {
      console.error("Error while closing server:", error);
      process.exitCode = 1;
    }

    process.exit();
  });
}

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));
