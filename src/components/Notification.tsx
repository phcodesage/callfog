import Alert from '@mui/material/Alert';
import Snackbar from '@mui/material/Snackbar';

interface NotificationProps {
  message: string;
  type: 'success' | 'error' | 'info';
  onClose: () => void;
}

// Material snackbar, lifted above the call controls.
export function Notification({ message, type, onClose }: NotificationProps) {
  return (
    <Snackbar
      open
      anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      autoHideDuration={type === 'error' ? 6000 : 4000}
      onClose={(_event, reason) => {
        if (reason !== 'clickaway') onClose();
      }}
      sx={{ bottom: { xs: 96, sm: 104 } }}
    >
      <Alert severity={type} variant="filled" onClose={onClose} sx={{ width: '100%', alignItems: 'center' }}>
        {message}
      </Alert>
    </Snackbar>
  );
}
