import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Mic, MicOff, Video, VideoOff, Phone, MonitorUp, Monitor } from 'lucide-react';
import { DeviceSelector } from './DeviceSelector';

interface MediaControlsProps {
  onToggleAudio: () => void;
  onToggleVideo: () => void;
  onToggleScreenShare?: () => void;
  onLeave: () => void;
  isAudioEnabled: boolean;
  isVideoEnabled: boolean;
  isAudioOnly?: boolean;
  isScreenSharing?: boolean;
  isRoomCreator?: boolean;
  onAudioInputChange?: (deviceId: string) => void;
  onAudioOutputChange?: (deviceId: string) => void;
  onVideoInputChange?: (deviceId: string) => void;
  audioInputDeviceId?: string;
  audioOutputDeviceId?: string;
  videoInputDeviceId?: string;
}

const iconClass = 'w-5 h-5 sm:w-6 sm:h-6';
const buttonBase = 'p-3 sm:p-4 rounded-full transition-all duration-300 hover:scale-110 active:scale-95 shadow-xl border';
const idleButton = 'glass-button text-indigo-100 border-white/10';
const offButton = 'bg-rose-500 hover:bg-rose-600 text-white border-rose-400/50 shadow-[0_0_15px_rgba(244,63,94,0.4)]';

export function MediaControls({
  onToggleAudio,
  onToggleVideo,
  onToggleScreenShare,
  onLeave,
  isAudioEnabled,
  isVideoEnabled,
  isAudioOnly = false,
  isScreenSharing = false,
  isRoomCreator = false,
  onAudioInputChange,
  onAudioOutputChange,
  onVideoInputChange,
  audioInputDeviceId,
  audioOutputDeviceId,
  videoInputDeviceId,
}: MediaControlsProps) {
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!showLeaveConfirm) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setShowLeaveConfirm(false);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [showLeaveConfirm]);

  const micLabel = isAudioEnabled ? 'Mute microphone' : 'Unmute microphone';
  const cameraLabel = isAudioOnly
    ? 'Try turning on camera'
    : isVideoEnabled
    ? 'Turn off camera'
    : 'Turn on camera';
  const shareLabel = isScreenSharing ? 'Stop sharing screen' : 'Share your screen';
  const leaveLabel = isRoomCreator ? 'End call for everyone' : 'Leave call';

  return (
    <>
      <div className="flex items-center justify-center gap-2 sm:gap-4">
        {onAudioInputChange && onAudioOutputChange && onVideoInputChange && (
          <DeviceSelector
            onAudioInputChange={onAudioInputChange}
            onAudioOutputChange={onAudioOutputChange}
            onVideoInputChange={onVideoInputChange}
            currentAudioInputId={audioInputDeviceId}
            currentAudioOutputId={audioOutputDeviceId}
            currentVideoInputId={videoInputDeviceId}
          />
        )}

        <button
          onClick={onToggleAudio}
          className={`${buttonBase} ${isAudioEnabled ? idleButton : offButton}`}
          title={micLabel}
          aria-label={micLabel}
          aria-pressed={!isAudioEnabled}
        >
          {isAudioEnabled ? <Mic className={iconClass} /> : <MicOff className={iconClass} />}
        </button>

        <button
          onClick={onToggleVideo}
          className={`${buttonBase} ${isVideoEnabled ? idleButton : offButton}`}
          title={cameraLabel}
          aria-label={cameraLabel}
          aria-pressed={!isVideoEnabled}
        >
          {isVideoEnabled ? <Video className={iconClass} /> : <VideoOff className={iconClass} />}
        </button>

        {onToggleScreenShare && (
          <button
            onClick={onToggleScreenShare}
            className={`${buttonBase} ${
              isScreenSharing
                ? 'bg-indigo-500 hover:bg-indigo-600 text-white border-indigo-400/50 shadow-[0_0_15px_rgba(99,102,241,0.4)]'
                : idleButton
            }`}
            title={shareLabel}
            aria-label={shareLabel}
            aria-pressed={isScreenSharing}
          >
            {isScreenSharing ? <Monitor className={iconClass} /> : <MonitorUp className={iconClass} />}
          </button>
        )}

        <button
          onClick={() => setShowLeaveConfirm(true)}
          className="p-3 sm:p-4 rounded-full bg-rose-600 hover:bg-rose-500 text-white transition-all duration-300 hover:scale-110 active:scale-95 shadow-[0_0_15px_rgba(225,29,72,0.5)] border border-rose-500/50 sm:ml-2"
          title={leaveLabel}
          aria-label={leaveLabel}
        >
          <Phone className={`${iconClass} rotate-[135deg]`} />
        </button>
      </div>

      {mounted && showLeaveConfirm && createPortal(
        <div className="fixed inset-0 flex items-center justify-center z-[100] p-4" role="dialog" aria-modal="true" aria-labelledby="leave-dialog-title">
          <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm" onClick={() => setShowLeaveConfirm(false)}></div>

          <div className="relative glass rounded-[2rem] p-8 max-w-sm w-full shadow-[0_0_50px_rgba(0,0,0,0.5)] border-white/10 animate-slide-in">
            <div className="w-16 h-16 bg-rose-500/20 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <Phone className="w-8 h-8 text-rose-400 rotate-[135deg]" />
            </div>

            <h3 id="leave-dialog-title" className="text-2xl font-bold text-white mb-3 text-center">
              {isRoomCreator ? 'End the call?' : 'Leave the call?'}
            </h3>
            <p className="text-slate-300 mb-8 text-center">
              {isRoomCreator
                ? 'You started this call. Ending it disconnects everyone and closes the room.'
                : 'Are you sure you want to leave this call?'}
            </p>
            <div className="flex gap-4">
              <button
                onClick={() => setShowLeaveConfirm(false)}
                autoFocus
                className="flex-1 glass-button text-white font-medium py-3.5 px-6 rounded-xl transition-all hover:scale-[1.02] active:scale-95"
              >
                Cancel
              </button>
              <button
                onClick={onLeave}
                className="flex-1 bg-rose-600 hover:bg-rose-500 text-white font-medium py-3.5 px-6 rounded-xl transition-all hover:scale-[1.02] active:scale-95 shadow-[0_0_15px_rgba(225,29,72,0.4)]"
              >
                {isRoomCreator ? 'End call' : 'Leave'}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}
