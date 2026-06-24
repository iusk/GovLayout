import 'dotenv/config';
import cors from 'cors';
import express, { type ErrorRequestHandler, type RequestHandler } from 'express';
import { API_ROUTES } from '@usgov/shared';
import { apiRouter } from './routes.js';
import { startScheduler } from './sync/scheduler.js';

const app = express();

app.use(cors({ origin: true, credentials: true }));
app.use(express.json());

const healthHandler: RequestHandler = (_req, res) => {
  res.json({ ok: true });
};
app.get(API_ROUTES.health, healthHandler);

// Branch / executive / judicial / legislative endpoints (Prisma-backed in Stage 3).
app.use(apiRouter);

const notFoundHandler: RequestHandler = (req, res) => {
  res.status(404).json({ error: 'Not found', path: req.path });
};
app.use(notFoundHandler);

const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  const message = err instanceof Error ? err.message : 'Internal server error';
  console.error('[api] error:', err);
  res.status(500).json({ error: message });
};
app.use(errorHandler);

const port = Number(process.env.PORT ?? 4000);
app.listen(port, () => {
  console.log(`[api] listening on http://localhost:${port}`);
  // Scheduled auto-sync (deployed only; controlled by SYNC_CRON). No-op locally
  // unless SYNC_CRON is set — local refreshes use the "Sync Data" button.
  startScheduler();
});
