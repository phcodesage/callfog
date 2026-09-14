import { useCallback, useEffect, useState } from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import CloseRounded from '@mui/icons-material/CloseRounded';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import LinearProgress from '@mui/material/LinearProgress';
import MenuItem from '@mui/material/MenuItem';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import { useTheme } from '@mui/material/styles';
import useMediaQuery from '@mui/material/useMediaQuery';
import SettingsRounded from '@mui/icons-material/SettingsRounded';
import { ControlButton } from './ControlButton';
import { getAudioInputDevices, getAudioOutputDevices, getVideoInputDevices } from '../utils/devices';

interface DeviceSelectorProps {
  onAudioInputChange: (deviceId: string) => void;
  onAudioOutputChange: (deviceId: string) => void;
  onVideoInputChange: (deviceId: string) => void;
  currentAudioInputId?: string;
  currentAudioOutputId?: string;
  currentVideoInputId?: string;
}

interface DeviceFieldProps {
  label: string;
  fallbackName: string;
  devices: MediaDeviceInfo[];
  value?: string;
  onChange: (deviceId: string) => void;
  emptyHelp: string;
}

function DeviceField({ label, fallbackName, devices, value, onChange, emptyHelp }: DeviceFieldProps) {
  const choices = devices.filter((device) => device.deviceId && device.deviceId !== 'default');
  const selected = choices.some((device) => device.deviceId === value) ? value : '';

  return (
    <TextField
      select
      fullWidth
      label={label}
      value={selected}
      onChange={(event) => onChange(event.target.value)}
      disabled={choices.length === 0}
      helperText={choices.length === 0 ? emptyHelp : undefined}
      slotProps={{ inputLabel: { shrink: true }, select: { displayEmpty: true } }}
    >
      <MenuItem value="">System default</MenuItem>
      {choices.map((device, index) => (
        <MenuItem key={device.deviceId} value={device.deviceId}>
          {device.label || `${fallbackName} ${index + 1}`}
        </MenuItem>
      ))}
    </TextField>
  );
}

export function DeviceSelector({
  onAudioInputChange,
  onAudioOutputChange,
  onVideoInputChange,
  currentAudioInputId,
  currentAudioOutputId,
  currentVideoInputId,
}: DeviceSelectorProps) {
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down('sm'), { noSsr: true });
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [microphones, setMicrophones] = useState<MediaDeviceInfo[]>([]);
  const [speakers, setSpeakers] = useState<MediaDeviceInfo[]>([]);
  const [cameras, setCameras] = useState<MediaDeviceInfo[]>([]);

  const loadDevices = useCallback(async () => {
    setLoading(true);
    try {
      const [audioInputs, audioOutputs, videoInputs] = await Promise.all([
        getAudioInputDevices(),
        getAudioOutputDevices(),
        getVideoInputDevices(),
      ]);
      setMicrophones(audioInputs);
      setSpeakers(audioOutputs);
      setCameras(videoInputs);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    loadDevices();
    navigator.mediaDevices.addEventListener('devicechange', loadDevices);
    return () => navigator.mediaDevices.removeEventListener('devicechange', loadDevices);
  }, [isOpen, loadDevices]);

  return (
    <>
      <ControlButton label="Audio and video settings" onClick={() => setIsOpen(true)}>
        <SettingsRounded />
      </ControlButton>

      <Dialog
        open={isOpen}
        onClose={() => setIsOpen(false)}
        fullScreen={fullScreen}
        fullWidth
        maxWidth="xs"
        aria-labelledby="device-dialog-title"
        slotProps={{ paper: { sx: { bgcolor: 'surface.high', borderRadius: fullScreen ? 0 : '28px' } } }}
      >
        <LinearProgress sx={{ visibility: loading ? 'visible' : 'hidden' }} />
        <DialogTitle id="device-dialog-title" sx={{ display: 'flex', alignItems: 'center', gap: 1, pr: 1.5 }}>
          <Box component="span" sx={{ flex: 1 }}>Audio and video</Box>
          {fullScreen && (
            <IconButton aria-label="Close settings" onClick={() => setIsOpen(false)}>
              <CloseRounded />
            </IconButton>
          )}
        </DialogTitle>
        <DialogContent>
          <Stack spacing={3} sx={{ pt: 1 }}>
            <DeviceField
              label="Microphone"
              fallbackName="Microphone"
              devices={microphones}
              value={currentAudioInputId}
              onChange={onAudioInputChange}
              emptyHelp="No microphone found"
            />
            <DeviceField
              label="Speaker"
              fallbackName="Speaker"
              devices={speakers}
              value={currentAudioOutputId}
              onChange={onAudioOutputChange}
              emptyHelp="This browser plays sound through your system speaker"
            />
            <DeviceField
              label="Camera"
              fallbackName="Camera"
              devices={cameras}
              value={currentVideoInputId}
              onChange={onVideoInputChange}
              emptyHelp="No camera found"
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <Button onClick={loadDevices}>Refresh list</Button>
          <Button variant="contained" onClick={() => setIsOpen(false)}>
            Done
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
