import { Box, Button } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';

export interface CourtButtonProps {
  /** Court name shown on the button. */
  label: string;
  /** When clickable, the router path to navigate to. */
  to?: string;
  /** Whether this court has its own page. Non-clickable courts render dimmed. */
  clickable: boolean;
}

/**
 * The full-width button used in the Judicial page's vertical court hierarchy.
 * Shares the visual language of <BranchButton> but is always full-width. When
 * `clickable` is false it renders as a dimmed, non-interactive <Box> (the lower
 * courts have no detail page); when true it renders as a real link button.
 */
export default function CourtButton({ label, to, clickable }: CourtButtonProps) {
  const sharedSx = {
    width: '100%',
    minHeight: 80,
    px: 3,
    fontSize: '1.25rem',
    fontWeight: 600,
    borderRadius: 3,
  } as const;

  if (clickable && to) {
    return (
      <Button
        component={RouterLink}
        to={to}
        variant="contained"
        color="primary"
        sx={{
          ...sharedSx,
          boxShadow: 3,
          transition: 'transform 120ms ease, box-shadow 120ms ease',
          '&:hover': { transform: 'translateY(-2px)', boxShadow: 6 },
        }}
      >
        {label}
      </Button>
    );
  }

  return (
    <Box
      aria-disabled
      sx={{
        ...sharedSx,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        color: 'text.disabled',
        bgcolor: 'action.disabledBackground',
        border: '1px dashed',
        borderColor: 'divider',
        userSelect: 'none',
      }}
    >
      {label}
    </Box>
  );
}
