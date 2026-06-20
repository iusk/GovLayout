import { Box, Button, Container, Stack, Typography } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';

// Stage 1: placeholder hardcoded labels so navigation is testable.
// Stage 2: these come from GET /api/branches via useBranches().
const PLACEHOLDER_BRANCHES = [
  { id: 'executive', label: 'Executive', route: '/executive' },
  { id: 'judicial', label: 'Judicial', route: '/judicial' },
  { id: 'legislative', label: 'Legislative', route: '/legislative' },
];

export default function IndexPage() {
  return (
    <Container maxWidth="md" sx={{ py: 8, minHeight: '100vh' }}>
      <Typography variant="h2" align="center" sx={{ mb: 1 }}>
        U.S. Government Layout
      </Typography>
      <Typography variant="body1" align="center" color="text.secondary" sx={{ mb: 6 }}>
        The three branches of the U.S. federal government, simplified.
      </Typography>
      <Stack
        direction={{ xs: 'column', md: 'row' }}
        spacing={3}
        justifyContent="center"
        alignItems="stretch"
      >
        {PLACEHOLDER_BRANCHES.map((branch) => (
          <Button
            key={branch.id}
            component={RouterLink}
            to={branch.route}
            variant="contained"
            color="primary"
            sx={{
              flex: 1,
              minHeight: 160,
              fontSize: '1.5rem',
              borderRadius: 3,
            }}
          >
            {branch.label}
          </Button>
        ))}
      </Stack>
      <Box sx={{ mt: 8, textAlign: 'center' }}>
        <Typography variant="caption" color="text.secondary">
          Stage 1 scaffold — branch list will be backend-driven in Stage 2.
        </Typography>
      </Box>
    </Container>
  );
}
