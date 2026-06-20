import { Alert, AlertTitle, Box, Button } from '@mui/material';
import ReplayIcon from '@mui/icons-material/Replay';

export interface ErrorMessageProps {
  /** Detail line under the title. Defaults to a generic message. */
  message?: string;
  /** Retry handler — wire to the `reload` returned by the data hook. */
  onRetry?: () => void;
}

/**
 * The error state for every data-fetched page: a centered MUI Alert with an
 * optional retry button. Pages pass the hook's `error.message` and `reload`.
 */
export default function ErrorMessage({ message, onRetry }: ErrorMessageProps) {
  return (
    <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
      <Alert
        severity="error"
        sx={{ maxWidth: 480 }}
        action={
          onRetry && (
            <Button color="inherit" size="small" startIcon={<ReplayIcon />} onClick={onRetry}>
              Retry
            </Button>
          )
        }
      >
        <AlertTitle>Couldn&apos;t load data</AlertTitle>
        {message ?? 'Something went wrong while contacting the server.'}
      </Alert>
    </Box>
  );
}
