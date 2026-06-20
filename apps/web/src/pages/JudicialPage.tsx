import { Button, Stack, Typography } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import PageLayout from '../components/PageLayout';

export default function JudicialPage() {
  return (
    <PageLayout title="Judicial">
      <Stack spacing={2} alignItems="center" sx={{ maxWidth: 480, mx: 'auto' }}>
        <Button
          component={RouterLink}
          to="/judicial/supreme-court"
          variant="contained"
          fullWidth
          sx={{ minHeight: 80, fontSize: '1.25rem' }}
        >
          Supreme Court
        </Button>
        <Button variant="contained" disabled fullWidth sx={{ minHeight: 80, fontSize: '1.25rem' }}>
          U.S. Courts of Appeals
        </Button>
        <Button variant="contained" disabled fullWidth sx={{ minHeight: 80, fontSize: '1.25rem' }}>
          U.S. District Courts
        </Button>
        <Typography variant="caption" color="text.secondary" sx={{ pt: 2 }}>
          Stage 1 placeholder — hierarchy will be backend-driven in Stage 2.
        </Typography>
      </Stack>
    </PageLayout>
  );
}
