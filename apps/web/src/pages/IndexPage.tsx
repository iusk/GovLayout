import { Container, Skeleton, Stack, Typography } from '@mui/material';
import BranchButton from '../components/BranchButton';
import ErrorMessage from '../components/ErrorMessage';
import { useBranches } from '../api/hooks';

/** Landing page: the three branches, loaded from GET /api/branches. */
export default function IndexPage() {
  const { data, loading, error, reload } = useBranches();

  return (
    <Container maxWidth="md" sx={{ py: 8, minHeight: '100vh' }}>
      <Typography variant="h2" align="center" sx={{ mb: 1 }}>
        U.S. Government Layout
      </Typography>
      <Typography variant="body1" align="center" color="text.secondary" sx={{ mb: 6 }}>
        The three branches of the U.S. federal government, simplified.
      </Typography>

      {error ? (
        <ErrorMessage message={error.message} onRetry={reload} />
      ) : (
        <Stack
          direction={{ xs: 'column', md: 'row' }}
          spacing={3}
          justifyContent="center"
          alignItems="stretch"
        >
          {loading
            ? Array.from({ length: 3 }).map((_, i) => (
                <Skeleton
                  key={i}
                  variant="rounded"
                  sx={{ flex: 1, height: { xs: 120, md: 160 }, borderRadius: 3 }}
                />
              ))
            : data?.branches.map((branch) => (
                <BranchButton key={branch.id} label={branch.label} to={branch.route} />
              ))}
        </Stack>
      )}
    </Container>
  );
}
