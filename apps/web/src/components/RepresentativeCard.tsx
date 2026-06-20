import { Avatar, Box, Typography } from '@mui/material';

export interface RepresentativeCardProps {
  /** Full display name, shown as the caption under the avatar. */
  fullName: string;
  /** Portrait URL. Falls back to the person's initials if absent or it fails to load. */
  photoUrl?: string;
  /** Optional secondary line: role title (Executive) or appointment info (Justices). */
  subtitle?: string;
  /** Avatar diameter in px. Default 120. */
  size?: number;
}

/**
 * The canonical representation of a single government figure: a circular,
 * flag-blue-bordered portrait with the name (and optional subtitle) beneath.
 *
 * Used identically on the Executive page, the Supreme Court page, and as the
 * content of member tooltips in <ChamberView>. This is the single source of
 * truth for "a person card" — pages must not re-style avatars inline.
 */
export default function RepresentativeCard({
  fullName,
  photoUrl,
  subtitle,
  size = 120,
}: RepresentativeCardProps) {
  const initials = fullName
    .split(' ')
    .map((part) => part[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('');

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 1,
        textAlign: 'center',
        width: size + 24,
      }}
    >
      <Avatar
        src={photoUrl}
        alt={fullName}
        sx={{
          width: size,
          height: size,
          border: '3px solid',
          borderColor: 'primary.main',
          bgcolor: 'background.paper',
          fontSize: size / 3,
        }}
      >
        {initials}
      </Avatar>
      <Typography variant="body1" sx={{ fontWeight: 500, lineHeight: 1.25 }}>
        {fullName}
      </Typography>
      {subtitle && (
        <Typography variant="body2" color="text.secondary">
          {subtitle}
        </Typography>
      )}
    </Box>
  );
}
