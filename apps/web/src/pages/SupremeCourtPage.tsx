import { Box } from '@mui/material';
import PageLayout from '../components/PageLayout';
import RepresentativeCard from '../components/RepresentativeCard';
import LoadingGrid from '../components/LoadingGrid';
import ErrorMessage from '../components/ErrorMessage';
import { useSupremeCourt } from '../api/hooks';

const justiceGridSx = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fill, minmax(144px, 1fr))',
  gap: 4,
  justifyItems: 'center',
} as const;

/** The 9 sitting Justices, each as a circular RepresentativeCard. */
export default function SupremeCourtPage() {
  const { data, loading, error, reload } = useSupremeCourt();

  return (
    <PageLayout title="Supreme Court">
      {loading && <LoadingGrid count={9} />}

      {!loading && (error || !data) && <ErrorMessage message={error?.message} onRetry={reload} />}

      {!loading && !error && data && (
        <Box sx={justiceGridSx}>
          {data.justices.map((justice) => (
            <RepresentativeCard
              key={justice.id}
              fullName={justice.fullName}
              photoUrl={justice.photoUrl}
              subtitle={`Appointed ${justice.year} · ${justice.appointedBy}`}
            />
          ))}
        </Box>
      )}
    </PageLayout>
  );
}
