// Load .env file when running locally (no-op in Replit where env vars are injected)
import "dotenv/config";
import app from "./app";
import { logger } from "./lib/logger";
import { syncMandiData, getMandiPriceCount } from "./lib/syncMandiData";

const SYNC_INTERVAL_MS = 6 * 60 * 60 * 1000; // 6 hours

async function runSyncSafely() {
  try {
    await syncMandiData();
  } catch (err) {
    logger.error({ err }, "live mandi data sync failed");
  }
}

async function startMandiDataSync() {
  const existingCount = await getMandiPriceCount();
  logger.info({ existingCount }, "checking mandi price data on startup");
  // Always sync once on boot so today's real prices are available immediately.
  void runSyncSafely();
  setInterval(() => void runSyncSafely(), SYNC_INTERVAL_MS);
}

void startMandiDataSync();

const rawPort = process.env["PORT"];

if (!rawPort) {
  throw new Error(
    "PORT environment variable is required but was not provided.",
  );
}

const port = Number(rawPort);

if (Number.isNaN(port) || port <= 0) {
  throw new Error(`Invalid PORT value: "${rawPort}"`);
}

app.listen(port, (err) => {
  if (err) {
    logger.error({ err }, "Error listening on port");
    process.exit(1);
  }

  logger.info({ port }, "Server listening");
});
