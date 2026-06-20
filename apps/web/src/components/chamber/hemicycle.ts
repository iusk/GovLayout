/**
 * Geometry for the Congress "U-shape" (hemicycle) seating chart.
 *
 * Seats are laid out on concentric semicircular rows forming a bowl that opens
 * upward (a U): both ends sit at the top, the curve bulges down. Outer rows are
 * longer so they hold proportionally more seats, which keeps the spacing between
 * dots roughly constant across rows.
 *
 * Each seat carries a `side` (left/right of the vertical centerline). <ChamberView>
 * renders the two sides as two independent SVGs so they sit together as one U on
 * wide screens and stack vertically (top → bottom) on narrow screens.
 *
 * All coordinates are in abstract units centered on x = 0; the SVG viewBox scales
 * them to the container, so only the ratio of seat radius to spacing matters.
 */

export interface SeatGeom {
  x: number;
  y: number;
  /** Angular position along the U: 0 = far left end, 1 = far right end. */
  t: number;
  side: 'left' | 'right';
}

export interface HemicycleConfig {
  /** Number of concentric rows. */
  rows: number;
  /** Radius of the innermost row. */
  innerRadius: number;
  /** Radial distance between adjacent rows. */
  rowStep: number;
  /** Dot radius, in the same units as the radii. */
  seatRadius: number;
}

// Tuned so dot spacing reads well: ~100 seats over 4 rows, ~435 over 9 rows.
export const SENATE_CONFIG: HemicycleConfig = {
  rows: 4,
  innerRadius: 100,
  rowStep: 16,
  seatRadius: 5,
};

export const HOUSE_CONFIG: HemicycleConfig = {
  rows: 9,
  innerRadius: 85,
  rowStep: 11,
  seatRadius: 2.6,
};

/**
 * Compute `count` seat positions for the given config, ordered by `t` ascending
 * (far-left to far-right). Callers zip this with a same-length, seating-sorted
 * member list so member i sits at seat i.
 */
export function computeSeats(count: number, config: HemicycleConfig): SeatGeom[] {
  if (count <= 0) return [];

  const radii = Array.from({ length: config.rows }, (_, j) => config.innerRadius + j * config.rowStep);
  const sumR = radii.reduce((a, b) => a + b, 0);

  // Seats per row proportional to radius -> near-constant arc spacing.
  const perRow = radii.map((r) => Math.round((count * r) / sumR));
  // Push any rounding drift onto the outer (longest) row.
  const drift = count - perRow.reduce((a, b) => a + b, 0);
  perRow[perRow.length - 1] = Math.max(0, perRow[perRow.length - 1]! + drift);

  const seats: SeatGeom[] = [];
  radii.forEach((r, j) => {
    const n = perRow[j]!;
    for (let k = 0; k < n; k++) {
      const t = (k + 0.5) / n; // centered in the row, never exactly at the rim
      const angle = Math.PI * t;
      seats.push({
        x: -r * Math.cos(angle), // t=0 -> -r (left), t=1 -> +r (right)
        y: r * Math.sin(angle), //  t=0.5 -> +r (bottom of the bowl)
        t,
        side: t < 0.5 ? 'left' : 'right',
      });
    }
  });

  seats.sort((a, b) => a.t - b.t || Math.hypot(a.x, a.y) - Math.hypot(b.x, b.y));
  return seats;
}

export interface ViewBox {
  minX: number;
  minY: number;
  width: number;
  height: number;
}

/** Tight bounding box around a set of seats, padded for the dot radius. */
export function viewBoxFor(seats: SeatGeom[], seatRadius: number): ViewBox {
  if (seats.length === 0) return { minX: 0, minY: 0, width: 1, height: 1 };

  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  for (const s of seats) {
    if (s.x < minX) minX = s.x;
    if (s.y < minY) minY = s.y;
    if (s.x > maxX) maxX = s.x;
    if (s.y > maxY) maxY = s.y;
  }

  // Pad generously so hover-scaled dots near the edge aren't clipped.
  const pad = seatRadius * 2.2;
  return {
    minX: minX - pad,
    minY: minY - pad,
    width: maxX - minX + pad * 2,
    height: maxY - minY + pad * 2,
  };
}
