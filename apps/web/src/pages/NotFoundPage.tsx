import { Button, Typography } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import PageLayout from '../components/PageLayout';

export default function NotFoundPage() {
  return (
    <PageLayout title="Page not found">
      <Typography align="center" color="text.secondary" sx={{ mb: 3 }}>
        That route doesn&apos;t exist.
      </Typography>
      <Typography align="center">
        <Button component={RouterLink} to="/" variant="contained">
          Go home
        </Button>
      </Typography>
    </PageLayout>
  );
}
