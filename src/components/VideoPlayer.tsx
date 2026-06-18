import { useEffect, useRef } from 'react';
import { User, MicOff } from 'lucide-react';

interface VideoPlayerProps {
  stream: MediaStream | null;
  userName: string;
  muted?: boolean;
  isLocal?: boolean;
}

export function VideoPlayer({ stream, userName, muted = false, isLocal = false }: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  const hasVideo = stream?.getVideoTracks().some(track => track.enabled);
  const hasAudio = stream?.getAudioTracks().some(track => track.enabled);

  return (
    <div className="relative w-full h-full glass rounded-3xl overflow-hidden aspect-video border-white/5 shadow-2xl group">
      {hasVideo ? (
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted={muted}
          className="w-full h-full object-cover"
          style={{ 
            maxWidth: '100%',
            width: '100%',
            height: '100%'
          }}
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

      {/* Floating Name Badge */}
      <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between">
        <div className="glass-panel px-4 py-2 rounded-xl flex items-center gap-2 backdrop-blur-md transition-transform duration-300 group-hover:translate-y-0 group-hover:opacity-100">
          <span className="text-white text-sm font-medium">
            {userName} {isLocal && '(You)'}
          </span>
          {!hasAudio && (
            <div className="bg-rose-500/20 p-1 rounded-md">
              <MicOff className="w-4 h-4 text-rose-400" />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
