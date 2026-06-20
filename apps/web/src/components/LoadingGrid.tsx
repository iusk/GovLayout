import { Box, Skeleton } from '@mui/material';

export interface LoadingGridProps {
  /** How many skeleton cards to render. */
  count: number;
  /** Avatar diameter in px — match the <RepresentativeCard> size of the page. */
  size?: number;
}

/**
 * Drop-in loading state for the card-grid pages (Executive, Supreme Court).
 * Renders a responsive grid of circular + text skeletons sized to match
 * <RepresentativeCard> so the layout doesn't jump when real data arrives.
 */
export default function LoadingGrid({ count, size = 120 }: LoadingGridProps) {
  return (
    <Box
      sx={{
        display: 'grid',
        gridTemplateColumns: `repeat(auto-fill, minmax(${size + 24}px, 1fr))`,
        gap: 4,
        justifyItems: 'center',
      }}
    >
      {Array.from({ length: count }).map((_, i) => (
        <Box
          key={i}
          sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}
        >
          <Skeleton variant="circular" width={size} height={size} />
          <Skeleton variant="text" width={size * 0.8} />
        </Box>
      ))}
    </Box>
  );
}
