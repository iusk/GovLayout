import { Skeleton, Stack } from '@mui/material';
import PageLayout from '../components/PageLayout';
import CourtButton from '../components/CourtButton';
import ErrorMessage from '../components/ErrorMessage';
import { useJudicialCourts } from '../api/hooks';
import type { Court } from '@usgov/shared';

// The only clickable court (Supreme Court) has a detail page; map it to its route.
function routeFor(court: Court): string | undefined {
  return court.clickable && court.level === 'supreme' ? '/judicial/supreme-court' : undefined;
}

/** Court hierarchy as a vertical stack; only the Supreme Court is clickable. */
export default function JudicialPage() {
  const { data, loading, error, reload } = useJudicialCourts();

  return (
    <PageLayout title="Judicial">
      <Stack spacing={2} alignItems="center" sx={{ maxWidth: 480, mx: 'auto' }}>
        {loading &&
          Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} variant="rounded" sx={{ width: '100%', height: 80, borderRadius: 3 }} />
          ))}

        {!loading && (error || !data) && <ErrorMessage message={error?.message} onRetry={reload} />}

        {!loading &&
          !error &&
          data?.courts.map((court) => (
            <CourtButton
              key={court.id}
              label={court.name}
              clickable={court.clickable}
              to={routeFor(court)}
            />
          ))}
      </Stack>
    </PageLayout>
  );
}
