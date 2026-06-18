import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Mic, MicOff, Video, VideoOff, Phone, MonitorUp, Monitor } from 'lucide-react';
import { DeviceSelector } from './DeviceSelector';

interface MediaControlsProps {
  onToggleAudio: () => boolean;
  onToggleVideo: () => boolean;
  onToggleScreenShare?: () => Promise<boolean>;
  onLeave: () => void;
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

export function MediaControls({ 
  onToggleAudio, 
  onToggleVideo, 
  onToggleScreenShare,
  onLeave, 
  isAudioOnly = false, 
  isScreenSharing = false,
  isRoomCreator = false,
  onAudioInputChange,
  onAudioOutputChange,
  onVideoInputChange,
  audioInputDeviceId,
  audioOutputDeviceId,
  videoInputDeviceId
}: MediaControlsProps) {
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [isVideoEnabled, setIsVideoEnabled] = useState(!isAudioOnly);
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleToggleAudio = () => {
    const enabled = onToggleAudio();
    setIsAudioEnabled(enabled);
  };

  const handleToggleVideo = () => {
    const enabled = onToggleVideo();
    setIsVideoEnabled(enabled);
  };

  const handleLeave = () => {
    setShowLeaveConfirm(true);
  };

  const confirmLeave = () => {
    onLeave();
  };

  return (
    <>
      <div className="flex items-center justify-center gap-2 sm:gap-4">
        {/* Device selector */}
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
          onClick={handleToggleAudio}
          className={`p-3 sm:p-4 rounded-full transition-all duration-300 hover:scale-110 active:scale-95 shadow-xl border ${
            isAudioEnabled
              ? 'glass-button text-indigo-100 border-white/10'
              : 'bg-rose-500 hover:bg-rose-600 text-white border-rose-400/50 shadow-[0_0_15px_rgba(244,63,94,0.4)]'
          }`}
          title={isAudioEnabled ? 'Mute microphone' : 'Unmute microphone'}
        >
          {isAudioEnabled ? <Mic className="w-5 h-5 sm:w-6 sm:h-6" /> : <MicOff className="w-5 h-5 sm:w-6 sm:h-6" />}
        </button>

        <button
          onClick={handleToggleVideo}
          disabled={isAudioOnly}
          className={`p-3 sm:p-4 rounded-full transition-all duration-300 hover:scale-110 active:scale-95 shadow-xl border ${
            isAudioOnly
              ? 'bg-slate-800/50 text-slate-500 cursor-not-allowed border-transparent'
              : isVideoEnabled
              ? 'glass-button text-indigo-100 border-white/10'
              : 'bg-rose-500 hover:bg-rose-600 text-white border-rose-400/50 shadow-[0_0_15px_rgba(244,63,94,0.4)]'
          }`}
          title={
            isAudioOnly
              ? 'Camera unavailable (audio-only mode)'
              : isVideoEnabled
              ? 'Turn off camera'
              : 'Turn on camera'
          }
        >
          {isVideoEnabled && !isAudioOnly ? <Video className="w-5 h-5 sm:w-6 sm:h-6" /> : <VideoOff className="w-5 h-5 sm:w-6 sm:h-6" />}
        </button>

        {/* Screen sharing button */}
        {onToggleScreenShare && !isAudioOnly && (
          <button
            onClick={() => {
              if (onToggleScreenShare) onToggleScreenShare();
            }}
            className={`p-3 sm:p-4 rounded-full transition-all duration-300 hover:scale-110 active:scale-95 shadow-xl border ${
              isScreenSharing
                ? 'bg-indigo-500 hover:bg-indigo-600 text-white border-indigo-400/50 shadow-[0_0_15px_rgba(99,102,241,0.4)]'
                : 'glass-button text-indigo-100 border-white/10'
            }`}
            title={isScreenSharing ? 'Stop sharing screen' : 'Share your screen'}
          >
            {isScreenSharing ? <Monitor className="w-5 h-5 sm:w-6 sm:h-6" /> : <MonitorUp className="w-5 h-5 sm:w-6 sm:h-6" />}
          </button>
        )}

        <button
          onClick={handleLeave}
          className="p-3 sm:p-4 rounded-full bg-rose-600 hover:bg-rose-500 text-white transition-all duration-300 hover:scale-110 active:scale-95 shadow-[0_0_15px_rgba(225,29,72,0.5)] border border-rose-500/50 sm:ml-2"
          title={isRoomCreator ? "End call" : "Leave call"}
        >
          <Phone className="w-5 h-5 sm:w-6 sm:h-6" />
        </button>
      </div>

      {mounted && showLeaveConfirm && createPortal(
        <div className="fixed inset-0 flex items-center justify-center z-[100] p-4">
          {/* Backdrop overlay */}
          <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm" onClick={() => setShowLeaveConfirm(false)}></div>
          
          <div className="relative glass rounded-[2rem] p-8 max-w-sm w-full shadow-[0_0_50px_rgba(0,0,0,0.5)] border-white/10 animate-slide-in">
            <div className="w-16 h-16 bg-rose-500/20 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <Phone className="w-8 h-8 text-rose-400 rotate-[135deg]" />
            </div>
            
            <h3 className="text-2xl font-bold text-white mb-3 text-center">
              {isRoomCreator ? "End the call?" : "Leave the call?"}
            </h3>
            <p className="text-slate-300 mb-8 text-center">
              {isRoomCreator 
                ? "Are you sure you want to end this call? This will disconnect all participants." 
                : "Are you sure you want to leave this call?"
              }
            </p>
            <div className="flex gap-4">
              <button
                onClick={() => setShowLeaveConfirm(false)}
                className="flex-1 glass-button text-white font-medium py-3.5 px-6 rounded-xl transition-all hover:scale-[1.02] active:scale-95"
              >
                Cancel
              </button>
              <button
                onClick={confirmLeave}
                className="flex-1 bg-rose-600 hover:bg-rose-500 text-white font-medium py-3.5 px-6 rounded-xl transition-all hover:scale-[1.02] active:scale-95 shadow-[0_0_15px_rgba(225,29,72,0.4)]"
              >
                {isRoomCreator ? "End Call" : "Leave"}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}
