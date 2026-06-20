import 'dotenv/config';
import cors from 'cors';
import express, { type ErrorRequestHandler, type RequestHandler } from 'express';
import { API_ROUTES } from '@usgov/shared';

const app = express();

app.use(cors({ origin: true, credentials: true }));
app.use(express.json());

const healthHandler: RequestHandler = (_req, res) => {
  res.json({ ok: true });
};
app.get(API_ROUTES.health, healthHandler);

// Stage 2 will register branch/executive/judicial/legislative routes here.

const notFoundHandler: RequestHandler = (req, res) => {
  res.status(404).json({ error: 'Not found', path: req.path });
};
app.use(notFoundHandler);

const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  const message = err instanceof Error ? err.message : 'Internal server error';
  // eslint-disable-next-line no-console
  console.error('[api] error:', err);
  res.status(500).json({ error: message });
};
app.use(errorHandler);

const port = Number(process.env.PORT ?? 4000);
app.listen(port, () => {
  // eslint-disable-next-line no-console
  console.log(`[api] listening on http://localhost:${port}`);
});
