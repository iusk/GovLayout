import { Button, Stack } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import PageLayout from '../components/PageLayout';

export default function LegislativePage() {
  return (
    <PageLayout title="Legislative (Congress)">
      <Stack
        direction={{ xs: 'column', md: 'row' }}
        spacing={3}
        justifyContent="center"
        sx={{ maxWidth: 720, mx: 'auto' }}
      >
        <Button
          component={RouterLink}
          to="/legislative/senate"
          variant="contained"
          sx={{ flex: 1, minHeight: 120, fontSize: '1.25rem' }}
        >
          Upper Body / Senate
        </Button>
        <Button
          component={RouterLink}
          to="/legislative/house"
          variant="contained"
          sx={{ flex: 1, minHeight: 120, fontSize: '1.25rem' }}
        >
          Lower Body / House
        </Button>
      </Stack>
    </PageLayout>
  );
}
