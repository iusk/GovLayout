import { Skeleton, Stack } from '@mui/material';
import PageLayout from '../components/PageLayout';
import BranchButton from '../components/BranchButton';
import ErrorMessage from '../components/ErrorMessage';
import { useChambers } from '../api/hooks';

/** Congress landing page: buttons for the Senate and the House. */
export default function LegislativePage() {
  const { data, loading, error, reload } = useChambers();

  return (
    <PageLayout title="Legislative (Congress)">
      {error ? (
        <ErrorMessage message={error.message} onRetry={reload} />
      ) : (
        <Stack
          direction={{ xs: 'column', md: 'row' }}
          spacing={3}
          justifyContent="center"
          sx={{ maxWidth: 720, mx: 'auto' }}
        >
          {loading ? (
            Array.from({ length: 2 }).map((_, i) => (
              <Skeleton
                key={i}
                variant="rounded"
                sx={{ flex: 1, height: { xs: 120, md: 160 }, borderRadius: 3 }}
              />
            ))
          ) : (
            <>
              <BranchButton label={data!.chambers.senate.label} to={data!.chambers.senate.route} />
              <BranchButton label={data!.chambers.house.label} to={data!.chambers.house.route} />
            </>
          )}
        </Stack>
      )}
    </PageLayout>
  );
}
