import { useState, useEffect } from 'react';
import { Copy, AlertCircle, MessageSquare } from 'lucide-react';
import { useWebRTC } from '../hooks/useWebRTC';
import { VideoPlayer } from '../components/VideoPlayer';
import { MediaControls } from '../components/MediaControls';
import { Notification } from '../components/Notification';
import { Chat } from '../components/Chat';

interface RoomProps {
  roomId: string;
  userName: string;
  onLeave: () => void;
  isRoomCreator: boolean;
}

export function Room({ roomId, userName, onLeave, isRoomCreator }: RoomProps) {
  const {
    localStream,
    remoteStream,
    error,
    peerName,
    connectionStatus,
    isAudioOnly,
    isScreenSharing,
    remoteScreenSharing,
    toggleAudio,
    toggleVideo,
    toggleScreenShare,
    leaveCall,
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
    clearChat
  } = useWebRTC({ roomId, userName });

  const [notification, setNotification] = useState<{
    message: string;
    type: 'success' | 'error' | 'info';
  } | null>(null);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [lastReadMessageCount, setLastReadMessageCount] = useState(0);

  // Check for call ended notification on component mount
  useEffect(() => {
    const callEndedMessage = localStorage.getItem('callEndedNotification');
    if (callEndedMessage) {
      setNotification({ message: callEndedMessage, type: 'info' });
      localStorage.removeItem('callEndedNotification');
    }
  }, []);

  const inviteLink = `${window.location.origin}/room/${roomId}`;

  const copyInviteLink = async () => {
    try {
      await navigator.clipboard.writeText(inviteLink);
      setNotification({ message: 'Invite link copied to clipboard!', type: 'success' });
    } catch (err) {
      setNotification({ message: 'Failed to copy link', type: 'error' });
    }
  };

  const handleLeave = () => {
    leaveCall(true, isRoomCreator);
    onLeave();
  };

  useEffect(() => {
    if (error) {
      setNotification({ message: error, type: 'error' });
    }
  }, [error]);

  // Track unread messages - only count new messages since last read
  useEffect(() => {
    if (isChatOpen) {
      // When chat is open, mark all messages as read
      setUnreadCount(0);
      setLastReadMessageCount(messages.length);
    } else {
      // When chat is closed, count unread messages
      const unreadMessages = messages.slice(lastReadMessageCount).filter(msg => !msg.isLocal);
      setUnreadCount(unreadMessages.length);
    }
  }, [messages, isChatOpen, lastReadMessageCount]);

  return (
    <div className="min-h-screen flex flex-col pt-4 px-4 pb-24">
      <header className="glass-panel rounded-3xl px-8 py-5 mx-auto w-full max-w-7xl flex flex-col sm:flex-row items-center justify-between gap-4 z-10">
        <div>
          <h1 className="text-xl font-semibold text-white flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></div>
            Room: {roomId}
          </h1>
          <p className="text-sm text-slate-400 mt-1">{connectionStatus}</p>
        </div>
        {!remoteStream ? (
          <button
            onClick={copyInviteLink}
            className="flex items-center gap-2 glass-button text-white font-medium py-2.5 px-5 rounded-xl transition-all duration-300 hover:scale-[1.02] active:scale-95 shadow-[0_0_15px_rgba(255,255,255,0.05)]"
          >
            <Copy className="w-4 h-4" />
            Copy invite link
          </button>
        ) : (
          <div className="flex items-center gap-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-medium py-2 px-5 rounded-xl backdrop-blur-md">
            <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse-glow"></div>
            <span>Call with {peerName}</span>
          </div>
        )}
      </header>

      <main className="flex-1 flex overflow-hidden mt-2 sm:mt-6 z-0 min-h-0">
        {/* Video area */}
        <div className="flex-1 p-2 md:p-6 flex items-center justify-center overflow-hidden relative">
          <div className="max-w-7xl w-full h-full relative flex items-center justify-center">

          {/* Picture-in-Picture layout when someone is screen sharing */}
          {(remoteScreenSharing || isScreenSharing) && remoteStream ? (
            <div className="flex flex-col lg:grid lg:grid-cols-[1fr_280px] gap-6 w-full h-full">
              {/* Main screen share view - takes most space */}
              <div className="w-full h-full lg:h-[calc(100vh-280px)]">
                <div className="relative glass rounded-3xl overflow-hidden w-full h-full lg:aspect-auto aspect-video">
                  <video
                    ref={(video) => {
                      if (video && remoteStream) {
                        video.srcObject = remoteStream;
                      }
                    }}
                    autoPlay
                    playsInline
                    className="w-full h-full object-contain"
                    style={{
                      maxWidth: '100%',
                      width: '100%',
                      height: '100%'
                    }}
                  />
                  <div className="absolute bottom-6 left-6 glass-panel px-4 py-2 rounded-xl">
                    <span className="text-white text-sm font-medium">
                      {peerName || 'Guest'} {remoteScreenSharing ? '(Screen)' : ''}
                    </span>
                  </div>
                </div>
              </div>
              
              {/* Local video - Right column on large screens, below on mobile */}
              {localStream && (
                <div className="w-full lg:flex lg:items-end lg:justify-end">
                  <div className="w-full lg:w-64 glass rounded-3xl overflow-hidden shadow-2xl p-1">
                    <VideoPlayer stream={localStream} userName={`${userName} (You)`} muted isLocal />
                  </div>
                </div>
              )}
            </div>
          ) : remoteStream ? (
            /* Normal call layout - remote video larger, local video bottom right */
            <div className="flex flex-col lg:grid lg:grid-cols-[1fr_320px] gap-6 w-full h-full">
              {/* Main remote video - takes most space */}
              <div className="w-full h-full lg:h-[calc(100vh-280px)]">
                <div className="relative glass rounded-3xl overflow-hidden w-full h-full lg:aspect-auto aspect-video border-white/5 shadow-2xl">
                  <video
                    ref={(video) => {
                      if (video && remoteStream) {
                        video.srcObject = remoteStream;
                      }
                    }}
                    autoPlay
                    playsInline
                    className="w-full h-full object-cover"
                    style={{
                      maxWidth: '100%',
                      width: '100%',
                      height: '100%'
                    }}
                  />
                  <div className="absolute bottom-6 left-6 glass-panel px-4 py-2 rounded-xl backdrop-blur-md">
                    <span className="text-white text-sm font-medium">
                      {peerName || 'Guest'}
                    </span>
                  </div>
                </div>
              </div>
              
              {/* Local video - Right column on large screens, below on mobile */}
              {localStream && (
                <div className="w-full lg:flex lg:items-end lg:justify-end absolute bottom-6 right-6 lg:static pointer-events-none lg:pointer-events-auto">
                  <div className="w-48 lg:w-full glass rounded-3xl overflow-hidden shadow-2xl p-1 border-white/10 pointer-events-auto">
                    <VideoPlayer stream={localStream} userName={`${userName} (You)`} muted isLocal />
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* Waiting for peer - show local video centered */
            <div className="w-full h-full flex items-center justify-center p-4">
              {localStream && (
                <div className="w-full max-w-3xl max-h-[70vh] aspect-video glass rounded-[2.5rem] overflow-hidden shadow-2xl p-2">
                  <VideoPlayer stream={localStream} userName={userName} muted isLocal />
                </div>
              )}
            </div>
          )}

          {!localStream && !error && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="inline-flex items-center gap-3 glass-panel text-white px-6 py-4 rounded-2xl">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-indigo-400"></div>
                <span className="font-medium">Requesting camera & microphone...</span>
              </div>
            </div>
          )}

          {error && !localStream && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="max-w-md mx-auto glass-panel border-rose-500/20 rounded-3xl p-8 text-center">
                <div className="w-16 h-16 bg-rose-500/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
                  <AlertCircle className="w-8 h-8 text-rose-400" />
                </div>
                <h3 className="text-2xl font-bold text-white mb-3">Media Access Required</h3>
                <p className="text-slate-300 mb-6">{error}</p>
                <p className="text-sm text-slate-400 mb-8">
                  Please allow camera and microphone access to join the call. You may need to grant permissions in your browser and refresh.
                </p>
                <button
                  onClick={() => window.location.reload()}
                  className="bg-indigo-600 hover:bg-indigo-500 text-white font-medium py-3 px-8 rounded-xl transition-all duration-300 hover:scale-[1.02] active:scale-95 shadow-[0_0_15px_rgba(79,70,229,0.3)]"
                >
                  Retry Access
                </button>
              </div>
            </div>
          )}
        </div>
        </div>

        {/* Chat sidebar */}
        {remoteStream && isChatOpen && (
          <div className="w-96 flex-shrink-0">
            <Chat
              onSendMessage={sendMessage}
              messages={messages}
              onTyping={sendTypingIndicator}
              remoteTyping={remoteTyping}
              remoteName={peerName || 'Guest'}
              onClearChat={clearChat}
              isOpen={isChatOpen}
            />
          </div>
        )}
      </main>

      {localStream && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50">
          <div className="glass-panel px-6 py-4 rounded-full flex items-center justify-center relative shadow-2xl border-white/10 backdrop-blur-xl">
            <MediaControls
              onToggleAudio={toggleAudio}
              onToggleVideo={toggleVideo}
              onToggleScreenShare={toggleScreenShare}
              onLeave={handleLeave}
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
            
            {/* Chat toggle button */}
            {remoteStream && (
              <div className="absolute -right-20">
                <button
                  onClick={() => setIsChatOpen(!isChatOpen)}
                  className="glass-button text-white p-4 rounded-full transition-all duration-300 hover:scale-110 active:scale-95 shadow-xl relative"
                  title="Toggle chat"
                >
                  <MessageSquare className="w-6 h-6 text-indigo-300" />
                  {unreadCount > 0 && !isChatOpen && (
                    <span className="absolute -top-1 -right-1 bg-rose-500 text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center border-2 border-slate-900 shadow-[0_0_10px_rgba(244,63,94,0.5)]">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {notification && (
        <Notification
          message={notification.message}
          type={notification.type}
          onClose={() => setNotification(null)}
        />
      )}
    </div>
  );
}
