import { memo, useCallback, useMemo, useState, type MouseEvent } from 'react';
import {
  Box,
  FormControl,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Skeleton,
  Stack,
  Typography,
  type SelectChangeEvent,
} from '@mui/material';
import { styled } from '@mui/material/styles';
import type { Chamber, ColorMode, Member, Party } from '@usgov/shared';
import { useChamberMembers } from '../../api/hooks';
import ErrorMessage from '../ErrorMessage';
import RepresentativeCard from '../RepresentativeCard';
import { MONEY_COLORS, PARTY_COLORS, dotColor } from './colors';
import {
  HOUSE_CONFIG,
  SENATE_CONFIG,
  computeSeats,
  viewBoxFor,
  type HemicycleConfig,
  type SeatGeom,
  type ViewBox,
} from './hemicycle';

const PARTY_LABEL: Record<Party, string> = {
  D: 'Democrat',
  R: 'Republican',
  I: 'Independent',
};

// Seat members left-to-right by party so party mode reads as a real chamber:
// Democrats on the left, Independents in the middle, Republicans on the right.
const PARTY_SEATING_ORDER: Record<Party, number> = { D: 0, I: 1, R: 2 };

interface SeatedMember {
  seat: SeatGeom;
  member: Member;
}

interface HalfLayout {
  items: SeatedMember[];
  viewBox: ViewBox;
}

interface ChamberLayout {
  seatRadius: number;
  left: HalfLayout;
  right: HalfLayout;
}

function buildLayout(members: Member[], config: HemicycleConfig): ChamberLayout {
  const sorted = [...members].sort(
    (a, b) =>
      PARTY_SEATING_ORDER[a.party] - PARTY_SEATING_ORDER[b.party] ||
      a.state.localeCompare(b.state) ||
      a.fullName.localeCompare(b.fullName),
  );
  const seats = computeSeats(sorted.length, config);
  const seated: SeatedMember[] = seats.map((seat, i) => ({ seat, member: sorted[i]! }));

  const leftItems = seated.filter((s) => s.seat.side === 'left');
  const rightItems = seated.filter((s) => s.seat.side === 'right');

  return {
    seatRadius: config.seatRadius,
    left: { items: leftItems, viewBox: viewBoxFor(leftItems.map((s) => s.seat), config.seatRadius) },
    right: { items: rightItems, viewBox: viewBoxFor(rightItems.map((s) => s.seat), config.seatRadius) },
  };
}

const Dot = styled('circle')({
  cursor: 'pointer',
  transformBox: 'fill-box',
  transformOrigin: 'center',
  transition: 'transform 120ms ease',
  '&:hover': { transform: 'scale(1.9)' },
});

interface HoverInfo {
  member: Member;
  x: number;
  y: number;
}

type HoverHandler = (member: Member, event: MouseEvent) => void;

function HalfChart({
  half,
  seatRadius,
  mode,
  onEnter,
  onLeave,
}: {
  half: HalfLayout;
  seatRadius: number;
  mode: ColorMode;
  onEnter: HoverHandler;
  onLeave: () => void;
}) {
  const { viewBox } = half;
  return (
    <Box sx={{ flex: 1, minWidth: 0, maxWidth: { md: '50%' } }}>
      <svg
        viewBox={`${viewBox.minX} ${viewBox.minY} ${viewBox.width} ${viewBox.height}`}
        preserveAspectRatio="xMidYMid meet"
        style={{ width: '100%', height: 'auto', display: 'block', overflow: 'visible' }}
      >
        {half.items.map(({ seat, member }) => (
          <Dot
            key={member.id}
            cx={seat.x}
            cy={seat.y}
            r={seatRadius}
            fill={dotColor(member, mode)}
            onMouseEnter={(e) => onEnter(member, e)}
            onMouseLeave={onLeave}
            onClick={() =>
              window.open(member.opensecretsUrl, '_blank', 'noopener,noreferrer')
            }
          >
            <title>{member.fullName}</title>
          </Dot>
        ))}
      </svg>
    </Box>
  );
}

/**
 * The full U-shape rendered as two independent half-SVGs in a flex container.
 * Memoized so hovering a dot (which only moves the tooltip) does not re-render
 * all 100–435 circles. Wide screens place the halves side by side (one U);
 * below ~900px they stack vertically (top → bottom) per the requirements.
 */
const Hemicycle = memo(function Hemicycle({
  layout,
  mode,
  onEnter,
  onLeave,
}: {
  layout: ChamberLayout;
  mode: ColorMode;
  onEnter: HoverHandler;
  onLeave: () => void;
}) {
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: { xs: 'column', md: 'row' },
        alignItems: 'center',
        justifyContent: 'center',
        gap: { xs: 4, md: 2 },
        maxWidth: 920,
        mx: 'auto',
      }}
    >
      <HalfChart half={layout.left} seatRadius={layout.seatRadius} mode={mode} onEnter={onEnter} onLeave={onLeave} />
      <HalfChart half={layout.right} seatRadius={layout.seatRadius} mode={mode} onEnter={onEnter} onLeave={onLeave} />
    </Box>
  );
});

function Legend({ mode }: { mode: ColorMode }) {
  const entries =
    mode === 'party'
      ? [
          { color: PARTY_COLORS.D, label: 'Democrat' },
          { color: PARTY_COLORS.R, label: 'Republican' },
          { color: PARTY_COLORS.I, label: 'Independent' },
        ]
      : [
          { color: MONEY_COLORS.green, label: 'No PAC money (0%)' },
          { color: MONEY_COLORS.yellow, label: 'Some (< 25%)' },
          { color: MONEY_COLORS.red, label: 'A lot (≥ 25%)' },
        ];

  return (
    <Stack direction="row" flexWrap="wrap" justifyContent="center" rowGap={1} columnGap={3}>
      {entries.map((e) => (
        <Stack key={e.label} direction="row" alignItems="center" spacing={1}>
          <Box sx={{ width: 14, height: 14, borderRadius: '50%', bgcolor: e.color }} />
          <Typography variant="body2" color="text.secondary">
            {e.label}
          </Typography>
        </Stack>
      ))}
    </Stack>
  );
}

export interface ChamberViewProps {
  chamber: Chamber;
}

/**
 * Shared Senate/House view: a Party/Money dropdown, a color legend, and the
 * U-shape dot chart. Each dot is a member — hover expands it and shows a card,
 * clicking opens that member's OpenSecrets page. All data comes from the API.
 */
export default function ChamberView({ chamber }: ChamberViewProps) {
  const { data, loading, error, reload } = useChamberMembers(chamber);
  const [mode, setMode] = useState<ColorMode>('party');
  const [hovered, setHovered] = useState<HoverInfo | null>(null);

  const config = chamber === 'SENATE' ? SENATE_CONFIG : HOUSE_CONFIG;
  const members = data?.members;
  const layout = useMemo(
    () => (members ? buildLayout(members, config) : null),
    [members, config],
  );

  const handleEnter = useCallback<HoverHandler>((member, event) => {
    setHovered({ member, x: event.clientX, y: event.clientY });
  }, []);
  const handleLeave = useCallback(() => setHovered(null), []);
  const handleModeChange = (event: SelectChangeEvent) =>
    setMode(event.target.value as ColorMode);

  const tooltipSubtitle = (member: Member): string => {
    if (mode === 'money') return `PAC money: ${member.pacPct}%`;
    const where = member.district ? `${member.state}-${member.district}` : member.state;
    return `${PARTY_LABEL[member.party]} · ${where}`;
  };

  // Keep the cursor-following tooltip inside the viewport on the right edge.
  const tipLeft =
    hovered && hovered.x > window.innerWidth - 190 ? hovered.x - 180 : (hovered?.x ?? 0) + 16;

  return (
    <Box>
      <Stack spacing={2} alignItems="center" sx={{ mb: 3 }}>
        <FormControl size="small" sx={{ minWidth: 180 }}>
          <InputLabel id="chamber-mode-label">Color by</InputLabel>
          <Select
            labelId="chamber-mode-label"
            value={mode}
            label="Color by"
            onChange={handleModeChange}
          >
            <MenuItem value="party">Party</MenuItem>
            <MenuItem value="money">Money</MenuItem>
          </Select>
        </FormControl>
        <Legend mode={mode} />
      </Stack>

      {loading && <Skeleton variant="rounded" height={300} sx={{ maxWidth: 920, mx: 'auto' }} />}

      {!loading && (error || !layout) && (
        <ErrorMessage message={error?.message} onRetry={reload} />
      )}

      {!loading && !error && layout && (
        <Hemicycle layout={layout} mode={mode} onEnter={handleEnter} onLeave={handleLeave} />
      )}

      {hovered && (
        <Box
          sx={{
            position: 'fixed',
            left: tipLeft,
            top: hovered.y + 16,
            zIndex: 2000,
            pointerEvents: 'none',
          }}
        >
          <Paper elevation={8} sx={{ p: 1.5 }}>
            <RepresentativeCard
              fullName={hovered.member.fullName}
              photoUrl={hovered.member.photoUrl}
              subtitle={tooltipSubtitle(hovered.member)}
              size={56}
            />
          </Paper>
        </Box>
      )}
    </Box>
  );
}
