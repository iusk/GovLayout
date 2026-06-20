import { Box, Skeleton } from '@mui/material';
import PageLayout from '../components/PageLayout';
import RepresentativeCard from '../components/RepresentativeCard';
import LoadingGrid from '../components/LoadingGrid';
import ErrorMessage from '../components/ErrorMessage';
import { useExecutive } from '../api/hooks';

/** Responsive grid sized to match the role <RepresentativeCard>s below. */
const roleGridSx = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fill, minmax(144px, 1fr))',
  gap: 4,
  justifyItems: 'center',
} as const;

/** Executive branch: the President centered up top, essential roles below. */
export default function ExecutivePage() {
  const { data, loading, error, reload } = useExecutive();

  return (
    <PageLayout title="Executive">
      {loading && (
        <>
          <Box sx={{ display: 'flex', justifyContent: 'center', mb: 6 }}>
            <Skeleton variant="circular" width={160} height={160} />
          </Box>
          <LoadingGrid count={5} />
        </>
      )}

      {!loading && (error || !data) && <ErrorMessage message={error?.message} onRetry={reload} />}

      {!loading && !error && data && (
        <>
          <Box sx={{ display: 'flex', justifyContent: 'center', mb: 6 }}>
            <RepresentativeCard
              fullName={data.president.fullName}
              photoUrl={data.president.photoUrl}
              subtitle={data.president.roleTitle}
              size={160}
            />
          </Box>
          <Box sx={roleGridSx}>
            {data.roles.map((role) => (
              <RepresentativeCard
                key={role.id}
                fullName={role.fullName}
                photoUrl={role.photoUrl}
                subtitle={role.roleTitle}
              />
            ))}
          </Box>
        </>
      )}
    </PageLayout>
  );
}
