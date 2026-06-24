import type { Request, Response } from 'express';
import { getMemberPhotoSource } from './repo.js';

/**
 * Thin photo proxy: `GET /api/photos/:bioguideId` 302-redirects to the member's
 * cached upstream portrait URL. If we have no URL for that member (not synced,
 * or upstream returned no image), it serves a generic silhouette SVG instead.
 * This isolates the frontend from upstream URL churn — the `<img src>` is always
 * our own stable path.
 */

// Neutral silhouette on the app's dark background, drawn inline so there's no
// asset dependency. Cached aggressively since it never changes.
const SILHOUETTE_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="300" height="300" viewBox="0 0 300 300" role="img" aria-label="No photo available">
  <rect width="300" height="300" fill="#1b1b22"/>
  <circle cx="150" cy="120" r="55" fill="#3a3a45"/>
  <path d="M60 270c0-50 40-80 90-80s90 30 90 80z" fill="#3a3a45"/>
</svg>`;

function sendSilhouette(res: Response): void {
  res
    .status(200)
    .type('image/svg+xml')
    .set('Cache-Control', 'public, max-age=86400')
    .send(SILHOUETTE_SVG);
}

export async function photoHandler(req: Request, res: Response): Promise<void> {
  const bioguideId = req.params.bioguideId ?? '';
  const source = await getMemberPhotoSource(bioguideId);

  if (!source || !/^https?:\/\//i.test(source)) {
    sendSilhouette(res);
    return;
  }

  // Redirect rather than stream: cheap, and lets the browser cache the upstream
  // image directly. A short cache keeps us responsive to re-syncs.
  res.set('Cache-Control', 'public, max-age=3600').redirect(302, source);
}
