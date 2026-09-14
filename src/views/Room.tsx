import { useCallback, useEffect, useState } from 'react';
import { Copy, AlertCircle, MessageSquare, Volume2 } from 'lucide-react';
import { useCallfog } from '../hooks/useCallfog';
import { VideoPlayer } from '../components/VideoPlayer';
import { MediaControls } from '../components/MediaControls';
import { Notification } from '../components/Notification';
import { Chat } from '../components/Chat';

interface RoomProps {
  roomId: string;
  userName: string;
  creatorKey: string | null;
  onLeave: (message?: string) => void;
}

export function Room({ roomId, userName, creatorKey, onLeave }: RoomProps) {
  const {
    connectionStatus,
    isConnected,
    joinError,
    error,
    clearError,
    endedReason,
    isRoomCreator,
    localStream,
    isMicEnabled,
    isCameraEnabled,
    isAudioOnly,
    isScreenSharing,
    canScreenShare,
    peer,
    audioBlocked,
    startAudio,
    toggleAudio,
    toggleVideo,
    toggleScreenShare,
    leaveCall,
    endCall,
    switchAudioDevice,
    switchVideoDevice,
    setAudioOutput,
    audioInputDeviceId,
    videoInputDeviceId,
    audioOutputDeviceId,
    messages,
    remoteTyping,
    sendMessage,
    sendTypingIndicator,
    clearChat,
  } = useCallfog({ roomId, userName, creatorKey });

  const [notification, setNotification] = useState<{
    message: string;
    type: 'success' | 'error' | 'info';
  } | null>(null);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [readCount, setReadCount] = useState(0);

  const closeNotification = useCallback(() => {
    setNotification(null);
    clearError();
  }, [clearError]);

  useEffect(() => {
    if (error) setNotification({ message: error, type: 'error' });
  }, [error]);

  useEffect(() => {
    if (endedReason) onLeave(endedReason);
  }, [endedReason, onLeave]);

  const remoteMessageCount = messages.filter((message) => !message.isLocal).length;
  useEffect(() => {
    if (isChatOpen) setReadCount(remoteMessageCount);
  }, [isChatOpen, remoteMessageCount]);
  const unreadCount = isChatOpen ? 0 : Math.max(0, remoteMessageCount - readCount);

  const handleClearChat = () => {
    clearChat();
    setReadCount(0);
  };

  const copyInviteLink = async () => {
    try {
      await navigator.clipboard.writeText(`${window.location.origin}/room/${roomId}`);
      setNotification({ message: 'Invite link copied to clipboard!', type: 'success' });
    } catch {
      setNotification({ message: 'Failed to copy link', type: 'error' });
    }
  };

  const handleLeave = async () => {
    if (isRoomCreator) await endCall();
    else await leaveCall();
    onLeave();
  };

  const localTile = (
    <VideoPlayer
      stream={localStream}
      label={`${userName} (You)`}
      videoEnabled={isCameraEnabled}
      audioEnabled={isMicEnabled}
      mirror
    />
  );

  return (
    <div className="min-h-screen flex flex-col pt-4 px-4 pb-28">
      <header className="glass-panel rounded-3xl px-6 sm:px-8 py-5 mx-auto w-full max-w-7xl flex flex-col sm:flex-row items-center justify-between gap-4 z-10">
        <div className="min-w-0 text-center sm:text-left">
          <h1 className="text-xl font-semibold text-white flex items-center justify-center sm:justify-start gap-2">
            <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
            Room: {roomId}
          </h1>
          <p className="text-sm text-slate-400 mt-1" role="status">{connectionStatus}</p>
        </div>
        {!peer ? (
          <button
            onClick={copyInviteLink}
            className="flex items-center gap-2 glass-button text-white font-medium py-2.5 px-5 rounded-xl transition-all duration-300 hover:scale-[1.02] active:scale-95 shadow-[0_0_15px_rgba(255,255,255,0.05)]"
          >
            <Copy className="w-4 h-4" />
            Copy invite link
          </button>
        ) : (
          <div className="flex items-center gap-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-medium py-2 px-5 rounded-xl backdrop-blur-md">
            <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse-glow" />
            <span>Call with {peer.name}</span>
          </div>
        )}
      </header>

      {audioBlocked && peer && (
        <button
          onClick={startAudio}
          className="mx-auto mt-4 flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white font-medium py-2.5 px-5 rounded-xl shadow-[0_0_15px_rgba(79,70,229,0.3)]"
        >
          <Volume2 className="w-4 h-4" />
          Tap to hear {peer.name}
        </button>
      )}

      <main className="flex-1 flex overflow-hidden mt-2 sm:mt-6 z-0 min-h-0">
        <div className="flex-1 p-2 md:p-6 flex items-center justify-center overflow-hidden relative">
          <div className="max-w-7xl w-full h-full relative flex items-center justify-center">
            {joinError ? (
              <div className="max-w-md mx-auto glass-panel border-rose-500/20 rounded-3xl p-8 text-center">
                <div className="w-16 h-16 bg-rose-500/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
                  <AlertCircle className="w-8 h-8 text-rose-400" />
                </div>
                <h3 className="text-2xl font-bold text-white mb-3">Couldn&apos;t join the call</h3>
                <p className="text-slate-300 mb-8">{joinError}</p>
                <div className="flex gap-4">
                  <button
                    onClick={() => onLeave()}
                    className="flex-1 glass-button text-white font-medium py-3 px-6 rounded-xl"
                  >
                    Home
                  </button>
                  <button
                    onClick={() => window.location.reload()}
                    className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white font-medium py-3 px-6 rounded-xl shadow-[0_0_15px_rgba(79,70,229,0.3)]"
                  >
                    Try again
                  </button>
                </div>
              </div>
            ) : peer ? (
              <div className="flex flex-col lg:grid lg:grid-cols-[1fr_300px] gap-6 w-full h-full">
                <div className="w-full h-full lg:h-[calc(100vh-280px)]">
                  <VideoPlayer
                    stream={peer.screenStream ?? peer.stream}
                    label={peer.screenStream ? `${peer.name} (screen)` : peer.name}
                    videoEnabled={!!peer.screenStream || peer.cameraEnabled}
                    audioEnabled={peer.micEnabled}
                    fit={peer.screenStream ? 'contain' : 'cover'}
                  />
                </div>
                <div className="flex flex-row lg:flex-col gap-4 lg:justify-end">
                  {peer.screenStream && (
                    <div className="w-1/2 lg:w-full">
                      <VideoPlayer
                        stream={peer.stream}
                        label={peer.name}
                        videoEnabled={peer.cameraEnabled}
                        audioEnabled={peer.micEnabled}
                      />
                    </div>
                  )}
                  <div className={peer.screenStream ? 'w-1/2 lg:w-full' : 'w-48 lg:w-full ml-auto'}>
                    {localTile}
                  </div>
                </div>
              </div>
            ) : (
              <div className="w-full h-full flex items-center justify-center p-4">
                <div className="w-full max-w-3xl max-h-[70vh] aspect-video">
                  {localTile}
                </div>
              </div>
            )}

            {!isConnected && !joinError && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="inline-flex items-center gap-3 glass-panel text-white px-6 py-4 rounded-2xl">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-indigo-400" />
                  <span className="font-medium">{connectionStatus}</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {peer && isChatOpen && (
          <div className="fixed inset-x-2 top-4 bottom-28 z-40 sm:static sm:w-96 sm:flex-shrink-0">
            <Chat
              onSendMessage={sendMessage}
              messages={messages}
              onTyping={sendTypingIndicator}
              remoteTyping={remoteTyping}
              remoteName={peer.name}
              onClearChat={handleClearChat}
              isOpen={isChatOpen}
            />
          </div>
        )}
      </main>

      {isConnected && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50">
          <div className="glass-panel px-4 sm:px-6 py-3 sm:py-4 rounded-full flex items-center justify-center gap-2 sm:gap-4 shadow-2xl border-white/10 backdrop-blur-xl">
            <MediaControls
              onToggleAudio={toggleAudio}
              onToggleVideo={toggleVideo}
              onToggleScreenShare={canScreenShare ? toggleScreenShare : undefined}
              onLeave={handleLeave}
              isAudioEnabled={isMicEnabled}
              isVideoEnabled={isCameraEnabled}
              isAudioOnly={isAudioOnly}
              isScreenSharing={isScreenSharing}
              isRoomCreator={isRoomCreator}
              onAudioInputChange={switchAudioDevice}
              onAudioOutputChange={setAudioOutput}
              onVideoInputChange={switchVideoDevice}
              audioInputDeviceId={audioInputDeviceId}
              audioOutputDeviceId={audioOutputDeviceId}
              videoInputDeviceId={videoInputDeviceId}
            />

            {peer && (
              <button
                onClick={() => setIsChatOpen(!isChatOpen)}
                className="glass-button text-white p-3 sm:p-4 rounded-full transition-all duration-300 hover:scale-110 active:scale-95 shadow-xl relative"
                aria-label={isChatOpen ? 'Close chat' : 'Open chat'}
                title="Toggle chat"
              >
                <MessageSquare className="w-5 h-5 sm:w-6 sm:h-6 text-indigo-300" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-rose-500 text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center border-2 border-slate-900 shadow-[0_0_10px_rgba(244,63,94,0.5)]">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>
            )}
          </div>
        </div>
      )}

      {notification && (
        <Notification
          message={notification.message}
          type={notification.type}
          onClose={closeNotification}
        />
      )}
    </div>
  );
}
