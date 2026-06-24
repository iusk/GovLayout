import { useEffect, useState } from 'react';
import { Alert, CircularProgress, Fab, Snackbar, Tooltip } from '@mui/material';
import SyncIcon from '@mui/icons-material/Sync';
import { API_ROUTES, type AppConfigResponse, type SyncResponse } from '@usgov/shared';
import { apiFetch, ApiError } from '../api/client';

/**
 * Floating, bottom-left "Sync Data" button for local development. It triggers an
 * immediate full re-sync of the backend's data (Congress, FEC, Supreme Court,
 * Executive) and reloads the page so fresh data shows.
 *
 * Visibility is gated twice: it only mounts under the Vite dev server
 * (`import.meta.env.DEV`, so it's absent from production builds) AND only shows
 * if the API reports `allowSync` (the deployed API disables the sync endpoint by
 * default). When deployed, data is refreshed by the server's scheduled job
 * instead — there is no button.
 */
type Status = 'idle' | 'syncing' | 'success' | 'error';

export default function SyncDataButton() {
  const [allowed, setAllowed] = useState(false);
  const [status, setStatus] = useState<Status>('idle');
  const [snack, setSnack] = useState<string | null>(null);

  // Confirm the API permits manual sync before showing anything.
  useEffect(() => {
    // Vite strips this branch from production builds.
    if (!import.meta.env.DEV) return;
    const controller = new AbortController();
    apiFetch<AppConfigResponse>(API_ROUTES.config, controller.signal)
      .then((cfg) => setAllowed(cfg.allowSync))
      .catch(() => setAllowed(false));
    return () => controller.abort();
  }, []);

  if (!import.meta.env.DEV || !allowed) return null;

  const runSync = async () => {
    if (status === 'syncing') return;
    setStatus('syncing');
    setSnack('Syncing data from Congress.gov, FEC, and Wikidata…');
    try {
      const res = await fetch(API_ROUTES.sync, {
        method: 'POST',
        headers: { Accept: 'application/json' },
      });
      const body = (await res.json()) as SyncResponse;
      if (!res.ok || !body.started) {
        throw new ApiError(body.reason ?? `Sync failed (${res.status})`, res.status);
      }
      const failed = (body.results ?? []).filter((r) => r.status === 'error');
      if (failed.length > 0) {
        setStatus('error');
        setSnack(`Sync finished with errors: ${failed.map((f) => f.key).join(', ')}.`);
        return;
      }
      setStatus('success');
      setSnack('Data synced. Reloading…');
      // Reload so every page re-fetches the freshly synced data.
      setTimeout(() => window.location.reload(), 900);
    } catch (err) {
      setStatus('error');
      setSnack(err instanceof Error ? err.message : 'Sync failed.');
    }
  };

  const syncing = status === 'syncing';

  return (
    <>
      <Tooltip title={syncing ? 'Syncing…' : 'Re-sync all data from upstream APIs (local only)'} placement="right">
        {/* span wrapper so the tooltip works while the Fab is disabled */}
        <span style={{ position: 'fixed', bottom: 24, left: 24, zIndex: 1300 }}>
          <Fab
            color="primary"
            variant="extended"
            onClick={runSync}
            disabled={syncing}
            aria-label="Sync data"
          >
            {syncing ? (
              <CircularProgress size={20} color="inherit" sx={{ mr: 1 }} />
            ) : (
              <SyncIcon sx={{ mr: 1 }} />
            )}
            {syncing ? 'Syncing…' : 'Sync Data'}
          </Fab>
        </span>
      </Tooltip>

      <Snackbar
        open={snack !== null}
        autoHideDuration={status === 'syncing' ? null : 6000}
        onClose={() => setSnack(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
        sx={{ mb: 10 }}
      >
        <Alert
          severity={status === 'error' ? 'error' : status === 'success' ? 'success' : 'info'}
          variant="filled"
          onClose={() => setSnack(null)}
        >
          {snack}
        </Alert>
      </Snackbar>
    </>
  );
}
