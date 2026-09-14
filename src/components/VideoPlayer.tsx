import { useCallback } from 'react';
import Avatar from '@mui/material/Avatar';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import MicOffRounded from '@mui/icons-material/MicOffRounded';

interface VideoPlayerProps {
  stream: MediaStream | null;
  label: string;
  videoEnabled: boolean;
  audioEnabled: boolean;
  fit?: 'cover' | 'contain';
  mirror?: boolean;
  compact?: boolean;
}

// Video only: remote audio is played through elements attached by useCallfog,
// so every <video> here is muted.
export function VideoPlayer({
  stream,
  label,
  videoEnabled,
  audioEnabled,
  fit = 'cover',
  mirror = false,
  compact = false,
}: VideoPlayerProps) {
  // A callback ref re-attaches the stream whenever the <video> remounts or the stream changes.
  const attachStream = useCallback((video: HTMLVideoElement | null) => {
    if (video && video.srcObject !== stream) {
      video.srcObject = stream;
    }
  }, [stream]);

  const showVideo = videoEnabled && !!stream;
  const initial = label.trim().charAt(0).toUpperCase() || '?';

  return (
    <Box
      sx={{
        position: 'relative',
        width: '100%',
        height: '100%',
        overflow: 'hidden',
        bgcolor: 'surface.main',
        borderRadius: compact ? '16px' : { xs: '20px', sm: '28px' },
      }}
    >
      {showVideo ? (
        <video
          ref={attachStream}
          autoPlay
          playsInline
          muted
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            objectFit: fit,
            transform: mirror ? 'scaleX(-1)' : undefined,
            background: '#000',
          }}
        />
      ) : (
        <Box sx={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center' }}>
          <Avatar
            sx={{
              width: compact ? 48 : { xs: 88, sm: 128 },
              height: compact ? 48 : { xs: 88, sm: 128 },
              fontSize: compact ? '1.25rem' : { xs: '2.25rem', sm: '3.25rem' },
              fontWeight: 600,
              bgcolor: 'tonal.main',
              color: 'tonal.contrastText',
            }}
          >
            {initial}
          </Avatar>
        </Box>
      )}

      <Box
        sx={{
          position: 'absolute',
          left: compact ? 6 : 12,
          bottom: compact ? 6 : 12,
          maxWidth: compact ? 'calc(100% - 12px)' : 'calc(100% - 24px)',
          display: 'flex',
          alignItems: 'center',
          gap: 0.5,
          px: compact ? 1 : 1.5,
          py: 0.5,
          borderRadius: '999px',
          bgcolor: 'rgba(0, 0, 0, 0.62)',
          color: '#FFFFFF',
        }}
      >
        {!audioEnabled && (
          <Box role="img" aria-label="Microphone muted" sx={{ display: 'flex' }}>
            <MicOffRounded sx={{ fontSize: compact ? 14 : 18 }} />
          </Box>
        )}
        <Typography variant={compact ? 'caption' : 'body2'} noWrap sx={{ fontWeight: 500 }}>
          {label}
        </Typography>
      </Box>
    </Box>
  );
}
