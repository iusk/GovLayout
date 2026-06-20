import { Button } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';

export interface BranchButtonProps {
  /** Text shown on the button. */
  label: string;
  /** Router path to navigate to on click. Omit when using `onClick`. */
  to?: string;
  /** Click handler. Ignored when `to` is provided. */
  onClick?: () => void;
  /** Render as non-interactive/dimmed. */
  disabled?: boolean;
}

/**
 * The large, prominent card-style button used on the Index page (the three
 * branches) and the Legislative page (Senate / House). This is the single
 * source of truth for that look — pages pass a label + destination, never an
 * inline `sx`.
 */
export default function BranchButton({ label, to, onClick, disabled }: BranchButtonProps) {
  return (
    <Button
      {...(to && !disabled ? { component: RouterLink, to } : { onClick })}
      disabled={disabled}
      variant="contained"
      color="primary"
      sx={{
        flex: 1,
        width: '100%',
        minHeight: { xs: 120, md: 160 },
        px: 4,
        fontSize: { xs: '1.25rem', md: '1.5rem' },
        fontWeight: 600,
        borderRadius: 3,
        textAlign: 'center',
        lineHeight: 1.3,
        boxShadow: 3,
        transition: 'transform 120ms ease, box-shadow 120ms ease',
        '&:hover': { transform: 'translateY(-3px)', boxShadow: 6 },
      }}
    >
      {label}
    </Button>
  );
}
