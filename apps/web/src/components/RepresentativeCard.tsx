import { Avatar, Box, Typography } from '@mui/material';

interface RepresentativeCardProps {
  fullName: string;
  photoUrl?: string;
  subtitle?: string;
  size?: number;
}

export default function RepresentativeCard({
  fullName,
  photoUrl,
  subtitle,
  size = 120,
}: RepresentativeCardProps) {
  const initials = fullName
    .split(' ')
    .map((part) => part[0])
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
      <Typography variant="body1" sx={{ fontWeight: 500 }}>
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
