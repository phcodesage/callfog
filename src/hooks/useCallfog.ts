import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ConnectionState,
  DisconnectReason,
  Participant,
  RemoteParticipant,
  RemoteTrack,
  Room,
  RoomEvent,
  Track,
  VideoPresets,
} from 'livekit-client';
import { ApiError, endRoom, fetchToken } from '../lib/callfogApi';
import { clearCreatorKey } from '../lib/session';

export interface ChatMessage {
  id: string;
  sender: string;
  text: string;
  timestamp: number;
  isLocal: boolean;
}

export interface PeerState {
  name: string;
  stream: MediaStream | null;
  screenStream: MediaStream | null;
  micEnabled: boolean;
  cameraEnabled: boolean;
}

interface UseCallfogProps {
  roomId: string;
  userName: string;
  creatorKey: string | null;
}

type DeviceKind = 'audioinput' | 'audiooutput' | 'videoinput';

const CHAT_TOPIC = 'chat';
const TYPING_TOPIC = 'typing';
const MAX_MESSAGE_LENGTH = 500;
const encoder = new TextEncoder();
const decoder = new TextDecoder();

// Reuse the previous MediaStream when the tracks are unchanged, so <video> elements don't flicker.
function streamOf(track: MediaStreamTrack | undefined, previous: MediaStream | null): MediaStream | null {
  if (!track) return null;
  if (previous && previous.getTracks().length === 1 && previous.getTracks()[0].id === track.id) return previous;
  return new MediaStream([track]);
}

function liveTrack(participant: Participant, source: Track.Source): MediaStreamTrack | undefined {
  const publication = participant.getTrackPublication(source);
  return publication?.track && !publication.isMuted ? publication.track.mediaStreamTrack : undefined;
}

function mediaErrorMessage(err: unknown): string {
  const name = err instanceof Error ? err.name : '';
  if (name === 'NotAllowedError') return 'Camera or microphone permission was denied';
  if (name === 'NotFoundError') return 'No camera or microphone was found';
  if (name === 'NotReadableError') return 'Your camera or microphone is being used by another app';
  return err instanceof Error ? err.message : 'Could not access your camera or microphone';
}

function disconnectMessage(reason?: DisconnectReason): string {
  switch (reason) {
    case DisconnectReason.ROOM_DELETED:
      return 'The host ended the call';
    case DisconnectReason.PARTICIPANT_REMOVED:
      return 'You were removed from the call';
    default:
      return 'You were disconnected from the call';
  }
}

export function useCallfog({ roomId, userName, creatorKey }: UseCallfogProps) {
  const roomRef = useRef<Room | null>(null);
  const leavingRooms = useRef(new WeakSet<Room>());
  const localStreamRef = useRef<MediaStream | null>(null);
  const peerStreamRef = useRef<MediaStream | null>(null);
  const peerScreenRef = useRef<MediaStream | null>(null);

  const [connectionState, setConnectionState] = useState<ConnectionState>(ConnectionState.Connecting);
  const [joinError, setJoinError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [endedReason, setEndedReason] = useState<string | null>(null);
  const [isRoomCreator, setIsRoomCreator] = useState(false);

  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [isMicEnabled, setIsMicEnabled] = useState(false);
  const [isCameraEnabled, setIsCameraEnabled] = useState(false);
  const [hasCamera, setHasCamera] = useState(true);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [peer, setPeer] = useState<PeerState | null>(null);
  const [audioBlocked, setAudioBlocked] = useState(false);

  const [audioInputDeviceId, setAudioInputDeviceId] = useState('');
  const [audioOutputDeviceId, setAudioOutputDeviceId] = useState('');
  const [videoInputDeviceId, setVideoInputDeviceId] = useState('');

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [remoteTyping, setRemoteTyping] = useState(false);

  // Recompute all derived media state from the LiveKit room.
  const sync = useCallback(() => {
    const room = roomRef.current;
    if (!room) return;

    const local = room.localParticipant;
    localStreamRef.current = streamOf(liveTrack(local, Track.Source.Camera), localStreamRef.current);
    setLocalStream(localStreamRef.current);
    setIsMicEnabled(local.isMicrophoneEnabled);
    setIsCameraEnabled(local.isCameraEnabled);
    setIsScreenSharing(local.isScreenShareEnabled);

    const remote: RemoteParticipant | undefined = room.remoteParticipants.values().next().value;
    if (!remote) {
      peerStreamRef.current = null;
      peerScreenRef.current = null;
      setPeer(null);
      return;
    }
    peerStreamRef.current = streamOf(liveTrack(remote, Track.Source.Camera), peerStreamRef.current);
    peerScreenRef.current = streamOf(liveTrack(remote, Track.Source.ScreenShare), peerScreenRef.current);
    setPeer({
      name: remote.name || 'Guest',
      stream: peerStreamRef.current,
      screenStream: peerScreenRef.current,
      micEnabled: remote.isMicrophoneEnabled,
      cameraEnabled: !!peerStreamRef.current,
    });
  }, []);

  useEffect(() => {
    let cancelled = false;
    const room = new Room({
      adaptiveStream: true,
      dynacast: true,
      disconnectOnPageLeave: true,
      videoCaptureDefaults: { resolution: VideoPresets.h720.resolution },
      audioCaptureDefaults: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
      publishDefaults: { simulcast: true },
    });
    roomRef.current = room;

    const onTrackSubscribed = (track: RemoteTrack) => {
      if (track.kind === Track.Kind.Audio) {
        const element = track.attach();
        element.hidden = true;
        document.body.appendChild(element);
      }
      sync();
    };

    const onTrackUnsubscribed = (track: RemoteTrack) => {
      track.detach().forEach((element) => element.remove());
      sync();
    };

    const onData = (payload: Uint8Array, participant?: RemoteParticipant, _kind?: unknown, topic?: string) => {
      if (!participant) return;
      if (topic === TYPING_TOPIC) {
        setRemoteTyping(decoder.decode(payload) === '1');
        return;
      }
      if (topic !== CHAT_TOPIC) return;
      try {
        const data = JSON.parse(decoder.decode(payload));
        if (typeof data?.text !== 'string') return;
        setMessages((prev) => [...prev, {
          id: crypto.randomUUID(),
          sender: participant.name || 'Guest',
          text: data.text.slice(0, MAX_MESSAGE_LENGTH),
          timestamp: Date.now(),
          isLocal: false,
        }]);
        setRemoteTyping(false);
      } catch {
        // Ignore malformed payloads.
      }
    };

    room
      .on(RoomEvent.ConnectionStateChanged, (state) => {
        if (!cancelled) setConnectionState(state);
      })
      .on(RoomEvent.Disconnected, (reason) => {
        if (cancelled || leavingRooms.current.has(room)) return;
        if (reason === DisconnectReason.ROOM_DELETED) clearCreatorKey(roomId);
        setEndedReason(disconnectMessage(reason));
      })
      .on(RoomEvent.ParticipantConnected, sync)
      .on(RoomEvent.ParticipantDisconnected, () => {
        setRemoteTyping(false);
        sync();
      })
      .on(RoomEvent.TrackSubscribed, onTrackSubscribed)
      .on(RoomEvent.TrackUnsubscribed, onTrackUnsubscribed)
      .on(RoomEvent.TrackMuted, sync)
      .on(RoomEvent.TrackUnmuted, sync)
      .on(RoomEvent.LocalTrackPublished, sync)
      .on(RoomEvent.LocalTrackUnpublished, sync)
      .on(RoomEvent.ActiveDeviceChanged, (kind, deviceId) => {
        if (kind === 'audioinput') setAudioInputDeviceId(deviceId);
        if (kind === 'audiooutput') setAudioOutputDeviceId(deviceId);
        if (kind === 'videoinput') setVideoInputDeviceId(deviceId);
      })
      .on(RoomEvent.MediaDevicesError, (err) => setError(mediaErrorMessage(err)))
      .on(RoomEvent.AudioPlaybackStatusChanged, () => setAudioBlocked(!room.canPlaybackAudio))
      .on(RoomEvent.DataReceived, onData);

    (async () => {
      try {
        const { token, url, isCreator } = await fetchToken({ roomId, name: userName, creatorKey });
        if (cancelled) return;
        setIsRoomCreator(isCreator);

        await room.connect(url, token);
        if (cancelled) return;
        sync();

        try {
          await room.localParticipant.enableCameraAndMicrophone();
          setHasCamera(true);
        } catch (err) {
          // No camera (or camera denied): fall back to audio-only.
          setHasCamera(false);
          try {
            await room.localParticipant.setMicrophoneEnabled(true);
          } catch {
            setError(mediaErrorMessage(err));
          }
        }
        if (cancelled) return;

        setAudioInputDeviceId(room.getActiveDevice('audioinput') ?? '');
        setVideoInputDeviceId(room.getActiveDevice('videoinput') ?? '');
        setAudioOutputDeviceId(room.getActiveDevice('audiooutput') ?? '');
        setAudioBlocked(!room.canPlaybackAudio);
        sync();
      } catch (err) {
        if (cancelled) return;
        setJoinError(err instanceof ApiError || err instanceof Error ? err.message : 'Could not join the call');
      }
    })();

    return () => {
      cancelled = true;
      room.remoteParticipants.forEach((participant) => {
        participant.trackPublications.forEach((publication) => {
          publication.track?.detach().forEach((element) => element.remove());
        });
      });
      room.removeAllListeners();
      room.disconnect();
      if (roomRef.current === room) roomRef.current = null;
    };
  }, [roomId, userName, creatorKey, sync]);

  const toggleAudio = useCallback(async () => {
    const local = roomRef.current?.localParticipant;
    if (!local) return;
    try {
      await local.setMicrophoneEnabled(!local.isMicrophoneEnabled);
    } catch (err) {
      setError(mediaErrorMessage(err));
    }
    sync();
  }, [sync]);

  const toggleVideo = useCallback(async () => {
    const local = roomRef.current?.localParticipant;
    if (!local) return;
    const enabling = !local.isCameraEnabled;
    try {
      await local.setCameraEnabled(enabling);
      if (enabling) setHasCamera(true);
    } catch (err) {
      if (enabling) setHasCamera(false);
      setError(mediaErrorMessage(err));
    }
    sync();
  }, [sync]);

  const toggleScreenShare = useCallback(async () => {
    const local = roomRef.current?.localParticipant;
    if (!local) return;
    try {
      await local.setScreenShareEnabled(!local.isScreenShareEnabled, { audio: true });
    } catch (err) {
      // Closing the browser's share picker is not an error worth showing.
      if (!(err instanceof Error && err.name === 'NotAllowedError')) {
        setError('Screen sharing failed');
      }
    }
    sync();
  }, [sync]);

  const switchDevice = useCallback(async (kind: DeviceKind, deviceId: string) => {
    const room = roomRef.current;
    if (!room) return;
    try {
      await room.switchActiveDevice(kind, deviceId || 'default');
    } catch (err) {
      setError(mediaErrorMessage(err));
    }
    sync();
  }, [sync]);

  const switchAudioDevice = useCallback((deviceId: string) => switchDevice('audioinput', deviceId), [switchDevice]);
  const switchVideoDevice = useCallback((deviceId: string) => switchDevice('videoinput', deviceId), [switchDevice]);
  const setAudioOutput = useCallback((deviceId: string) => switchDevice('audiooutput', deviceId), [switchDevice]);

  const startAudio = useCallback(async () => {
    const room = roomRef.current;
    if (!room) return;
    await room.startAudio();
    setAudioBlocked(!room.canPlaybackAudio);
  }, []);

  const leaveCall = useCallback(async () => {
    const room = roomRef.current;
    if (!room) return;
    leavingRooms.current.add(room);
    await room.disconnect();
  }, []);

  const endCall = useCallback(async () => {
    if (creatorKey) {
      try {
        await endRoom({ roomId, creatorKey });
        clearCreatorKey(roomId);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Could not end the call for everyone');
      }
    }
    await leaveCall();
  }, [creatorKey, roomId, leaveCall]);

  const sendMessage = useCallback(async (text: string) => {
    const room = roomRef.current;
    const trimmed = text.trim().slice(0, MAX_MESSAGE_LENGTH);
    if (!room || !trimmed || room.state !== ConnectionState.Connected) return;

    setMessages((prev) => [...prev, {
      id: crypto.randomUUID(),
      sender: userName,
      text: trimmed,
      timestamp: Date.now(),
      isLocal: true,
    }]);
    try {
      await room.localParticipant.publishData(encoder.encode(JSON.stringify({ text: trimmed })), {
        reliable: true,
        topic: CHAT_TOPIC,
      });
    } catch {
      setError('Your message could not be sent');
    }
  }, [userName]);

  const sendTypingIndicator = useCallback((isTyping: boolean) => {
    const room = roomRef.current;
    if (!room || room.state !== ConnectionState.Connected) return;
    room.localParticipant
      .publishData(encoder.encode(isTyping ? '1' : '0'), { reliable: false, topic: TYPING_TOPIC })
      .catch(() => {});
  }, []);

  const clearChat = useCallback(() => setMessages([]), []);
  const clearError = useCallback(() => setError(null), []);

  const isConnected = connectionState === ConnectionState.Connected;
  let connectionStatus: string;
  if (joinError) connectionStatus = 'Could not join';
  else if (connectionState === ConnectionState.Reconnecting || connectionState === ConnectionState.SignalReconnecting) {
    connectionStatus = 'Connection lost, reconnecting…';
  } else if (!isConnected) connectionStatus = 'Connecting…';
  else if (peer) connectionStatus = `In a call with ${peer.name}`;
  else connectionStatus = 'Waiting for someone to join…';

  return {
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
    isAudioOnly: !hasCamera,
    isScreenSharing,
    canScreenShare: typeof navigator !== 'undefined' && !!navigator.mediaDevices?.getDisplayMedia,
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
  };
}
