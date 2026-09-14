import type { ReactNode } from 'react';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';

type Tone = 'neutral' | 'off' | 'active';

interface ControlButtonProps {
  label: string;
  onClick: () => void;
  tone?: Tone;
  pressed?: boolean;
  children: ReactNode;
}

const tones: Record<Tone, { bg: string; fg: string; hover: string }> = {
  neutral: { bg: 'surface.highest', fg: 'text.primary', hover: 'surface.high' },
  off: { bg: 'danger.main', fg: 'danger.contrastText', hover: 'danger.main' },
  active: { bg: 'primary.main', fg: 'primary.contrastText', hover: 'primary.main' },
};

// Round call-control button: 44px on phones, 52px from the sm breakpoint.
export function ControlButton({ label, onClick, tone = 'neutral', pressed, children }: ControlButtonProps) {
  const colors = tones[tone];
  return (
    <Tooltip title={label}>
      <IconButton
        aria-label={label}
        aria-pressed={pressed}
        onClick={onClick}
        sx={{
          width: { xs: 44, sm: 52 },
          height: { xs: 44, sm: 52 },
          bgcolor: colors.bg,
          color: colors.fg,
          '&:hover': { bgcolor: colors.hover, filter: tone === 'neutral' ? undefined : 'brightness(1.08)' },
        }}
      >
        {children}
      </IconButton>
    </Tooltip>
  );
}
