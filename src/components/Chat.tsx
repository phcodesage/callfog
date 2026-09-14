import { useEffect, useRef, useState, type ChangeEvent, type FormEvent } from 'react';
import Box from '@mui/material/Box';
import Divider from '@mui/material/Divider';
import IconButton from '@mui/material/IconButton';
import TextField from '@mui/material/TextField';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import CloseRounded from '@mui/icons-material/CloseRounded';
import DeleteOutlineRounded from '@mui/icons-material/DeleteOutlineRounded';
import SendRounded from '@mui/icons-material/SendRounded';
import type { ChatMessage } from '../hooks/useCallfog';

interface ChatProps {
  onSendMessage: (message: string) => void;
  messages: ChatMessage[];
  onTyping: (isTyping: boolean) => void;
  remoteTyping: boolean;
  remoteName: string;
  onClearChat: () => void;
  onClose: () => void;
}

const formatTime = (timestamp: number) =>
  new Date(timestamp).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });

export function Chat({ onSendMessage, messages, onTyping, remoteTyping, remoteName, onClearChat, onClose }: ChatProps) {
  const [inputValue, setInputValue] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const list = scrollRef.current;
    if (list) list.scrollTop = list.scrollHeight;
  }, [messages, remoteTyping]);

  useEffect(() => () => {
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
  }, []);

  const handleInputChange = (event: ChangeEvent<HTMLInputElement>) => {
    setInputValue(event.target.value);
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);

    if (event.target.value.length > 0) {
      onTyping(true);
      typingTimeoutRef.current = setTimeout(() => onTyping(false), 2000);
    } else {
      onTyping(false);
    }
  };

  const handleSend = (event: FormEvent) => {
    event.preventDefault();
    const text = inputValue.trim();
    if (!text) return;
    onSendMessage(text);
    setInputValue('');
    onTyping(false);
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, pl: 3, pr: 1, py: 1 }}>
        <Typography variant="h6" component="h2" noWrap sx={{ flex: 1, fontSize: '1.125rem' }}>
          Chat
        </Typography>
        <Tooltip title="Clear messages">
          <span>
            <IconButton aria-label="Clear messages" onClick={onClearChat} disabled={messages.length === 0}>
              <DeleteOutlineRounded />
            </IconButton>
          </span>
        </Tooltip>
        <IconButton aria-label="Close chat" onClick={onClose}>
          <CloseRounded />
        </IconButton>
      </Box>
      <Divider />

      <Box
        ref={scrollRef}
        role="log"
        aria-live="polite"
        sx={{ flex: 1, minHeight: 0, overflowY: 'auto', px: 2, py: 2, display: 'flex', flexDirection: 'column', gap: 1 }}
      >
        {messages.length === 0 ? (
          <Box sx={{ m: 'auto', textAlign: 'center', px: 3 }}>
            <Typography variant="body1">No messages yet</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
              Messages last only as long as this call.
            </Typography>
          </Box>
        ) : (
          messages.map((message, index) => {
            const startsRun = index === 0 || messages[index - 1].isLocal !== message.isLocal;
            return (
              <Box
                key={message.id}
                sx={{ alignSelf: message.isLocal ? 'flex-end' : 'flex-start', maxWidth: '82%', mt: startsRun && index > 0 ? 1 : 0 }}
              >
                {startsRun && !message.isLocal && (
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block', px: 1.5, mb: 0.25 }}>
                    {message.sender}
                  </Typography>
                )}
                <Box
                  sx={{
                    px: 1.75,
                    py: 1,
                    borderRadius: message.isLocal ? '20px 20px 6px 20px' : '20px 20px 20px 6px',
                    bgcolor: message.isLocal ? 'primary.main' : 'surface.highest',
                    color: message.isLocal ? 'primary.contrastText' : 'text.primary',
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-word',
                  }}
                >
                  <Typography variant="body2">{message.text}</Typography>
                </Box>
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{ display: 'block', px: 1.5, mt: 0.25, textAlign: message.isLocal ? 'right' : 'left' }}
                >
                  {formatTime(message.timestamp)}
                </Typography>
              </Box>
            );
          })
        )}

        {remoteTyping && (
          <Typography variant="caption" color="text.secondary" sx={{ px: 1.5 }}>
            {remoteName} is typing…
          </Typography>
        )}
      </Box>

      <Box
        component="form"
        onSubmit={handleSend}
        sx={{ display: 'flex', alignItems: 'center', gap: 1, px: 1.5, pt: 1, pb: 'calc(12px + env(safe-area-inset-bottom))' }}
      >
        <TextField
          fullWidth
          size="small"
          placeholder="Message"
          value={inputValue}
          onChange={handleInputChange}
          autoComplete="off"
          slotProps={{
            htmlInput: { maxLength: 500, 'aria-label': `Message ${remoteName}` },
            input: { sx: { borderRadius: '999px', bgcolor: 'surface.main' } },
          }}
        />
        <IconButton
          type="submit"
          aria-label="Send message"
          disabled={!inputValue.trim()}
          sx={{
            bgcolor: 'primary.main',
            color: 'primary.contrastText',
            '&:hover': { bgcolor: 'primary.main', filter: 'brightness(1.08)' },
            '&.Mui-disabled': { bgcolor: 'surface.high', color: 'text.secondary' },
          }}
        >
          <SendRounded />
        </IconButton>
      </Box>
    </Box>
  );
}
