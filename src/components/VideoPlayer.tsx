import { useCallback } from 'react';
import { User, MicOff } from 'lucide-react';

interface VideoPlayerProps {
  stream: MediaStream | null;
  label: string;
  videoEnabled: boolean;
  audioEnabled: boolean;
  fit?: 'cover' | 'contain';
  mirror?: boolean;
}

// Video only: remote audio is played through elements attached by useCallfog,
// so every <video> here is muted.
export function VideoPlayer({ stream, label, videoEnabled, audioEnabled, fit = 'cover', mirror = false }: VideoPlayerProps) {
  // A callback ref re-attaches the stream whenever the <video> remounts or the stream changes.
  const attachStream = useCallback((video: HTMLVideoElement | null) => {
    if (video && video.srcObject !== stream) {
      video.srcObject = stream;
    }
  }, [stream]);

  const showVideo = videoEnabled && !!stream;

  return (
    <div className="relative w-full h-full glass rounded-3xl overflow-hidden aspect-video border-white/5 shadow-2xl group">
      {showVideo ? (
        <video
          ref={attachStream}
          autoPlay
          playsInline
          muted
          className={`w-full h-full ${fit === 'contain' ? 'object-contain' : 'object-cover'} ${mirror ? '-scale-x-100' : ''}`}
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center bg-slate-900/80 backdrop-blur-sm">
          <div className="text-center animate-slide-in">
            <div className="inline-flex items-center justify-center w-24 h-24 bg-indigo-500/20 rounded-full mb-4 shadow-[0_0_30px_rgba(79,70,229,0.2)] border border-indigo-500/30">
              <User className="w-12 h-12 text-indigo-400" />
            </div>
            <p className="text-white font-medium">Camera off</p>
          </div>
        </div>
      )}

      <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between">
        <div className="glass-panel px-4 py-2 rounded-xl flex items-center gap-2 backdrop-blur-md">
          <span className="text-white text-sm font-medium">{label}</span>
          {!audioEnabled && (
            <div className="bg-rose-500/20 p-1 rounded-md" aria-label="Microphone muted">
              <MicOff className="w-4 h-4 text-rose-400" />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
