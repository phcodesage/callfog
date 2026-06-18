import { useState, useEffect } from 'react';
import { Settings, Mic, Video, Volume2 } from 'lucide-react';
import { getAudioInputDevices, getAudioOutputDevices, getVideoInputDevices } from '../utils/webrtc';

interface DeviceSelectorProps {
  onAudioInputChange: (deviceId: string) => void;
  onAudioOutputChange: (deviceId: string) => void;
  onVideoInputChange: (deviceId: string) => void;
  currentAudioInputId?: string;
  currentAudioOutputId?: string;
  currentVideoInputId?: string;
}

export function DeviceSelector({
  onAudioInputChange,
  onAudioOutputChange,
  onVideoInputChange,
  currentAudioInputId,
  currentAudioOutputId,
  currentVideoInputId
}: DeviceSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [audioInputDevices, setAudioInputDevices] = useState<MediaDeviceInfo[]>([]);
  const [audioOutputDevices, setAudioOutputDevices] = useState<MediaDeviceInfo[]>([]);
  const [videoInputDevices, setVideoInputDevices] = useState<MediaDeviceInfo[]>([]);
  const [loading, setLoading] = useState(false);

  // Fetch available devices
  const loadDevices = async () => {
    try {
      setLoading(true);
      const [audioInputs, audioOutputs, videoInputs] = await Promise.all([
        getAudioInputDevices(),
        getAudioOutputDevices(),
        getVideoInputDevices()
      ]);
      
      setAudioInputDevices(audioInputs);
      setAudioOutputDevices(audioOutputs);
      setVideoInputDevices(videoInputs);
    } catch (error) {
      console.error('Error loading devices:', error);
    } finally {
      setLoading(false);
    }
  };

  // Load devices when the selector is opened
  useEffect(() => {
    if (isOpen) {
      loadDevices();
    }
  }, [isOpen]);

  // Listen for device changes
  useEffect(() => {
    const handleDeviceChange = () => {
      if (isOpen) {
        loadDevices();
      }
    };

    navigator.mediaDevices.addEventListener('devicechange', handleDeviceChange);
    return () => {
      navigator.mediaDevices.removeEventListener('devicechange', handleDeviceChange);
    };
  }, [isOpen]);

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-3 rounded-full glass-button hover:scale-110 active:scale-95 text-slate-200 shadow-[0_0_15px_rgba(255,255,255,0.05)]"
        title="Device settings"
      >
        <Settings size={22} className={isOpen ? "text-indigo-400 rotate-90 transition-transform duration-300" : "transition-transform duration-300"} />
      </button>

      {isOpen && (
        <div className="absolute bottom-full mb-4 right-0 glass rounded-3xl p-6 w-80 z-50 animate-slide-in shadow-[0_0_30px_rgba(0,0,0,0.5)]">
          <div className="flex justify-between items-center mb-5">
            <h3 className="font-semibold text-white text-lg">Device Settings</h3>
            <button 
              onClick={() => setIsOpen(false)}
              className="text-slate-400 hover:text-white bg-slate-800/50 hover:bg-slate-700/50 rounded-full p-1.5 transition-colors"
            >
              ✕
            </button>
          </div>

          {loading ? (
            <div className="text-center py-8 text-slate-400 flex flex-col items-center gap-3">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-400"></div>
              Loading devices...
            </div>
          ) : (
            <div className="space-y-5">
              {/* Microphone selection */}
              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-slate-300 mb-2">
                  <Mic size={16} className="text-indigo-400" /> Microphone
                </label>
                <select
                  value={currentAudioInputId || ''}
                  onChange={(e) => onAudioInputChange(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-950/50 border border-white/10 text-white rounded-xl text-sm focus:ring-2 focus:ring-indigo-500/50 outline-none appearance-none"
                >
                  {audioInputDevices.length === 0 ? (
                    <option value="">No microphones found</option>
                  ) : (
                    <>
                      <option value="">Default System Microphone</option>
                      {audioInputDevices.map((device) => (
                        <option key={device.deviceId} value={device.deviceId}>
                          {device.label || `Microphone ${device.deviceId.slice(0, 5)}...`}
                        </option>
                      ))}
                    </>
                  )}
                </select>
              </div>

              {/* Speaker selection */}
              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-slate-300 mb-2">
                  <Volume2 size={16} className="text-emerald-400" /> Speaker
                </label>
                <select
                  value={currentAudioOutputId || ''}
                  onChange={(e) => onAudioOutputChange(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-950/50 border border-white/10 text-white rounded-xl text-sm focus:ring-2 focus:ring-indigo-500/50 outline-none appearance-none"
                >
                  {audioOutputDevices.length === 0 ? (
                    <option value="">No speakers found</option>
                  ) : (
                    <>
                      <option value="">Default System Speaker</option>
                      {audioOutputDevices.map((device) => (
                        <option key={device.deviceId} value={device.deviceId}>
                          {device.label || `Speaker ${device.deviceId.slice(0, 5)}...`}
                        </option>
                      ))}
                    </>
                  )}
                </select>
              </div>

              {/* Camera selection */}
              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-slate-300 mb-2">
                  <Video size={16} className="text-cyan-400" /> Camera
                </label>
                <select
                  value={currentVideoInputId || ''}
                  onChange={(e) => onVideoInputChange(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-950/50 border border-white/10 text-white rounded-xl text-sm focus:ring-2 focus:ring-indigo-500/50 outline-none appearance-none"
                >
                  {videoInputDevices.length === 0 ? (
                    <option value="">No cameras found</option>
                  ) : (
                    <>
                      <option value="">Default System Camera</option>
                      {videoInputDevices.map((device) => (
                        <option key={device.deviceId} value={device.deviceId}>
                          {device.label || `Camera ${device.deviceId.slice(0, 5)}...`}
                        </option>
                      ))}
                    </>
                  )}
                </select>
              </div>

              <div className="pt-2">
                <button
                  onClick={() => loadDevices()}
                  className="w-full py-3 text-sm glass-button text-indigo-300 rounded-xl font-medium"
                >
                  Refresh devices
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
