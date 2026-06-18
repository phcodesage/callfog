import { useEffect, useRef, useState, useCallback } from 'react';
import { createPeerConnection, generateClientId, getMediaStreamWithDevice, getScreenShareStream } from '../utils/webrtc';
import { supabase } from '../lib/supabase';
import { RealtimeChannel } from '@supabase/supabase-js';

interface UseWebRTCProps {
  roomId: string;
  userName: string;
}

export function useWebRTC({ roomId, userName }: UseWebRTCProps) {
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const remoteStreamRef = useRef<MediaStream | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [peerName, setPeerName] = useState<string>('');
  const [connectionStatus, setConnectionStatus] = useState<string>('Initializing...');
  const [isAudioOnly, setIsAudioOnly] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [remoteScreenSharing, setRemoteScreenSharing] = useState(false);

  // Chat state
  const [messages, setMessages] = useState<Array<{
    id: string;
    sender: string;
    text: string;
    timestamp: number;
    isLocal: boolean;
  }>>([]);
  const [remoteTyping, setRemoteTyping] = useState(false);

  // Device selection state
  const [audioInputDeviceId, setAudioInputDeviceId] = useState<string>('');
  const [audioOutputDeviceId, setAudioOutputDeviceId] = useState<string>('');
  const [videoInputDeviceId, setVideoInputDeviceId] = useState<string>('');

  // Store original video track when screen sharing
  const originalVideoTrack = useRef<MediaStreamTrack | null>(null);
  const screenShareStream = useRef<MediaStream | null>(null);

  const channel = useRef<RealtimeChannel | null>(null);
  const pc = useRef<RTCPeerConnection | null>(null);

  const sendSignalingMessage = useCallback((data: any) => {
    if (channel.current) {
      channel.current.send({
        type: 'broadcast',
        event: 'signaling',
        payload: data
      });
    }
  }, []);
  const clientId = useRef<string>(generateClientId());
  const iceCandidateQueue = useRef<RTCIceCandidateInit[]>([]);
  const hasRemoteDescription = useRef<boolean>(false);
  const peerId = useRef<string | null>(null);
  const isMounted = useRef(true);

  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);

  const initializeMedia = useCallback(async () => {
    try {
      // Use device IDs if they are set, otherwise use default devices
      const stream = await getMediaStreamWithDevice(
        audioInputDeviceId || undefined,
        videoInputDeviceId || undefined,
        true, // audio
        true  // video
      );
      setLocalStream(stream);

      // Check if we have video tracks to determine if we're in audio-only mode
      const hasVideo = stream.getVideoTracks().length > 0;
      setIsAudioOnly(!hasVideo);

      if (hasVideo) {
        setConnectionStatus('Connected to camera and microphone');
      } else {
        setConnectionStatus('Connected to microphone (audio-only mode)');
      }

      // Save the device IDs from the stream for future reference
      if (!audioInputDeviceId && stream.getAudioTracks().length > 0) {
        const audioTrack = stream.getAudioTracks()[0];
        const audioSettings = audioTrack.getSettings();
        if (audioSettings.deviceId) {
          setAudioInputDeviceId(audioSettings.deviceId);
        }
      }

      if (!videoInputDeviceId && stream.getVideoTracks().length > 0) {
        const videoTrack = stream.getVideoTracks()[0];
        const videoSettings = videoTrack.getSettings();
        if (videoSettings.deviceId) {
          setVideoInputDeviceId(videoSettings.deviceId);
        }
      }

      return stream;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to access camera/microphone';
      setError(message);
      setConnectionStatus('Media access denied');
      throw err;
    }
  }, [audioInputDeviceId, videoInputDeviceId]);

  const processQueuedCandidates = useCallback(async () => {
    if (!pc.current || !hasRemoteDescription.current) return;

    console.log(`🧊 Processing ${iceCandidateQueue.current.length} queued ICE candidates`);

    while (iceCandidateQueue.current.length > 0) {
      const candidate = iceCandidateQueue.current.shift();
      if (candidate) {
        try {
          await pc.current.addIceCandidate(new RTCIceCandidate(candidate));
          console.log('🧊 Successfully added queued ICE candidate');
        } catch (err) {
          console.error('🧊 Error adding queued ICE candidate:', err);
        }
      }
    }
  }, []);

  const createOffer = useCallback(async (peerId: string) => {
    if (!pc.current || !channel.current) return;

    try {
      console.log('📤 Creating offer for peer:', peerId);

      // Log current senders before creating offer
      const senders = pc.current.getSenders();
      console.log('📤 Current senders before offer:', senders.map(s => ({
        kind: s.track?.kind,
        trackId: s.track?.id,
        enabled: s.track?.enabled
      })));

      const offer = await pc.current.createOffer({
        offerToReceiveAudio: true,
        offerToReceiveVideo: true
      });
      await pc.current.setLocalDescription(offer);
      console.log('📤 Local description set, sending offer');

      sendSignalingMessage({
        type: 'offer',
        offer,
        target: peerId
      });
    } catch (err) {
      console.error('Error creating offer:', err);
      setError('Failed to create connection offer');
    }
  }, []);

  const handleOffer = useCallback(async (offer: RTCSessionDescriptionInit, from: string) => {
    if (!pc.current || !channel.current) return;

    try {
      console.log('📥 Setting remote description from offer');
      await pc.current.setRemoteDescription(new RTCSessionDescription(offer));
      hasRemoteDescription.current = true;

      console.log('📤 Creating and setting local answer');
      const answer = await pc.current.createAnswer();
      await pc.current.setLocalDescription(answer);

      sendSignalingMessage({
        type: 'answer',
        answer,
        target: from
      });

      // Process any queued ICE candidates
      await processQueuedCandidates();
    } catch (err) {
      console.error('Error handling offer:', err);
      setError('Failed to handle connection offer');
    }
  }, [processQueuedCandidates]);

  const handleAnswer = useCallback(async (answer: RTCSessionDescriptionInit) => {
    if (!pc.current) return;

    try {
      console.log('📥 Setting remote description from answer');
      await pc.current.setRemoteDescription(new RTCSessionDescription(answer));
      hasRemoteDescription.current = true;

      // Log current receivers after setting remote description
      const receivers = pc.current.getReceivers();
      console.log('📥 Current receivers after answer:', receivers.map(r => ({
        kind: r.track?.kind,
        trackId: r.track?.id,
        enabled: r.track?.enabled
      })));

      // Process any queued ICE candidates
      await processQueuedCandidates();
    } catch (err) {
      console.error('Error handling answer:', err);
      setError('Failed to handle connection answer');
    }
  }, [processQueuedCandidates]);

  const handleIceCandidate = useCallback(async (candidate: RTCIceCandidateInit) => {
    if (!pc.current) return;

    console.log('🧊 Received remote ICE candidate:', {
      candidate: candidate.candidate,
      sdpMLineIndex: candidate.sdpMLineIndex,
      sdpMid: candidate.sdpMid
    });

    if (!hasRemoteDescription.current) {
      console.log('🧊 Queuing ICE candidate (no remote description yet)');
      iceCandidateQueue.current.push(candidate);
      return;
    }

    try {
      await pc.current.addIceCandidate(new RTCIceCandidate(candidate));
      console.log('🧊 Successfully added remote ICE candidate');
    } catch (err) {
      console.error('🧊 Error adding ICE candidate:', err);
    }
  }, []);

  useEffect(() => {
    let mounted = true;

    const setupConnection = async () => {
      try {
        const stream = await initializeMedia();

        if (!mounted) return;

        pc.current = await createPeerConnection();

        // Add tracks to peer connection with proper stream association
        stream.getTracks().forEach(track => {
          if (pc.current) {
            console.log('🎵 Adding local track to peer connection:', {
              kind: track.kind,
              id: track.id,
              enabled: track.enabled,
              readyState: track.readyState,
              streamId: stream.id
            });

            // Ensure the track is properly associated with the stream
            const sender = pc.current.addTrack(track, stream);
            console.log('🎵 Track sender created:', sender.track?.kind);
          }
        });

        if (pc.current) {
          pc.current.onicecandidate = (event) => {
            if (event.candidate) {
              console.log('🧊 ICE Candidate generated:', {
                type: event.candidate.type,
                protocol: event.candidate.protocol,
                address: event.candidate.address,
                port: event.candidate.port,
                priority: event.candidate.priority,
                foundation: event.candidate.foundation
              });

              if (channel.current && peerId.current) {
                sendSignalingMessage({
                  type: 'ice-candidate',
                  candidate: event.candidate,
                  target: peerId.current
                });
              }
            } else {
              console.log('🧊 ICE gathering completed (null candidate)');
            }
          };

          pc.current.onicegatheringstatechange = () => {
            const state = pc.current?.iceGatheringState;
            console.log('🧊 ICE Gathering State changed:', state);

            switch (state) {
              case 'new':
                console.log('🧊 ICE gathering has not started');
                break;
              case 'gathering':
                console.log('🧊 ICE gathering is in progress');
                break;
              case 'complete':
                console.log('🧊 ICE gathering has completed');
                break;
            }
          };

          pc.current.oniceconnectionstatechange = () => {
            const state = pc.current?.iceConnectionState;
            console.log('🧊 ICE Connection State changed:', state);

            switch (state) {
              case 'new':
                console.log('🧊 ICE connection is new');
                break;
              case 'checking':
                console.log('🧊 ICE connection is checking connectivity');
                setConnectionStatus('Checking connectivity...');
                break;
              case 'connected':
                console.log('🧊 ICE connection is connected');
                setConnectionStatus('ICE connected - establishing media...');
                break;
              case 'completed':
                console.log('🧊 ICE connection is completed');
                break;
              case 'failed':
                console.log('🧊 ICE connection failed - attempting ICE restart');
                setConnectionStatus('Connection failed - retrying...');
                setError('ICE connection failed. Attempting to reconnect...');
                // Attempt ICE restart
                if (pc.current && peerId.current) {
                  const attemptRestart = async () => {
                    try {
                      const offer = await pc.current!.createOffer({ iceRestart: true });
                      await pc.current!.setLocalDescription(offer);
                      if (channel.current) {
                        sendSignalingMessage({
                          type: 'offer',
                          offer,
                          target: peerId.current
                        });
                      }
                    } catch (restartErr) {
                      console.error('ICE restart failed:', restartErr);
                    }
                  };
                  attemptRestart();
                }
                break;
              case 'disconnected':
                console.log('🧊 ICE connection is disconnected');
                setConnectionStatus('Connection lost - attempting to reconnect...');
                break;
              case 'closed':
                console.log('🧊 ICE connection is closed');
                break;
            }
          };

          pc.current.ontrack = (event) => {
            console.log('🎥 Received remote track:', {
              kind: event.track.kind,
              id: event.track.id,
              readyState: event.track.readyState,
              enabled: event.track.enabled,
              streams: event.streams?.length || 0
            });

            if (event.streams && event.streams[0]) {
              console.log('🎥 Setting remote stream with tracks:',
                event.streams[0].getTracks().map(t => ({ kind: t.kind, id: t.id, enabled: t.enabled }))
              );
              remoteStreamRef.current = event.streams[0];
              setRemoteStream(event.streams[0]);
              setConnectionStatus('Call connected - you can now hear and see each other');
            } else {
              console.warn('🎥 No streams in track event, creating/updating stream');

              // If we don't have a remote stream yet, create one
              if (!remoteStreamRef.current) {
                const newStream = new MediaStream([event.track]);
                remoteStreamRef.current = newStream;
                setRemoteStream(newStream);
                console.log('🎥 Created new remote stream with track:', event.track.kind);
              } else {
                // Add track to existing stream
                remoteStreamRef.current.addTrack(event.track);
                setRemoteStream(new MediaStream(remoteStreamRef.current.getTracks()));
                console.log('🎥 Added track to existing remote stream:', event.track.kind);
              }
              setConnectionStatus('Call connected - you can now hear and see each other');
            }
          };

          pc.current.onconnectionstatechange = () => {
            const state = pc.current?.connectionState;
            console.log('🔗 Peer Connection State changed:', state);

            if (state === 'connected') {
              console.log('🔗 Peer connection fully established');
              setIsConnected(true);
              // Don't override the more specific message from ontrack
              if (!remoteStream) {
                setConnectionStatus('WebRTC connection established - waiting for media...');
              }
            } else if (state === 'disconnected' || state === 'failed') {
              console.log('🔗 Peer connection failed/disconnected');
              setConnectionStatus('Call disconnected');
              setIsConnected(false);
            } else if (state === 'connecting') {
              console.log('🔗 Peer connection is connecting');
              setConnectionStatus('Establishing connection...');
            } else if (state === 'new') {
              console.log('🔗 Peer connection is new');
            }
          };
        }

        channel.current = supabase.channel(`room-${roomId}`, {
          config: { broadcast: { self: false } }
        });

        channel.current.on('broadcast', { event: 'signaling' }, async ({ payload: data }) => {
          if (!mounted) return;
          console.log('📡 Received message:', data.type, data);

          if (data.target && data.target !== clientId.current) return;

          switch (data.type) {
            case 'join':
              console.log('Peer joined room:', data.clientId);
              setPeerName(data.userName);
              peerId.current = data.clientId;
              setConnectionStatus('Peer joined, waiting for connection...');
              
              sendSignalingMessage({
                type: 'ready',
                target: data.clientId,
                peerId: clientId.current,
                peerName: userName
              });
              break;
            case 'ready':
              setPeerName(data.peerName);
              peerId.current = data.peerId;
              setConnectionStatus('Creating connection...');
              await createOffer(data.peerId);
              break;
            case 'peer-joined':
              setPeerName(data.peerName);
              peerId.current = data.peerId;
              setConnectionStatus('Peer joined, waiting for connection...');
              break;
            case 'offer':
              await handleOffer(data.offer, data.from || data.clientId || data.peerId);
              break;
            case 'answer':
              await handleAnswer(data.answer);
              break;
            case 'ice-candidate':
              await handleIceCandidate(data.candidate);
              break;
            case 'screen-share-state':
              console.log('📺 Remote peer screen sharing state:', data.isSharing);
              setRemoteScreenSharing(data.isSharing);
              break;
            case 'chat-message':
              console.log('💬 Received chat message:', data.message);
              setMessages(prev => [...prev, {
                id: Date.now().toString() + Math.random(),
                sender: data.senderName,
                text: data.message,
                timestamp: data.timestamp,
                isLocal: false
              }]);
              break;
            case 'typing-indicator':
              console.log('⌨️ Remote typing:', data.isTyping);
              setRemoteTyping(data.isTyping);
              break;
            case 'leave':
            case 'peer-left':
              setRemoteStream(null);
              remoteStreamRef.current = null;
              setIsConnected(false);
              setPeerName('');
              peerId.current = null;
              setConnectionStatus('Participant left');
              break;
            case 'end-call':
            case 'call-ended-by-creator':
              console.log('📞 Received call-ended-by-creator event:', data);
              setConnectionStatus('Call ended by room creator');
              setError(`Call ended: ${data.creatorName || data.userName || 'Peer'} ended the call`);

              if (localStream) {
                localStream.getTracks().forEach(track => {
                  if (track.readyState === 'live') {
                    track.stop();
                  }
                });
              }

              if (pc.current) {
                pc.current.close();
                pc.current = null;
              }

              localStorage.setItem('callEndedNotification', `${data.creatorName || data.userName || 'Peer'} ended the call`);
              setTimeout(() => {
                window.location.href = '/';
              }, 1000);
              break;
          }
        });

        channel.current.subscribe(async (status) => {
          if (status === 'SUBSCRIBED') {
            sendSignalingMessage({
              type: 'join',
              roomId,
              userName,
              clientId: clientId.current
            });
            console.log('📡 Sent join message');
            setConnectionStatus('Waiting for other participant...');
          }
        });

      } catch (err) {
        if (mounted) {
          console.error('Setup error:', err);
        }
      }
    };

    setupConnection();

    return () => {
      mounted = false;
      console.log('🧹 Component unmounting - cleaning up media tracks');

      if (localStream) {
        localStream.getTracks().forEach(track => {
          if (track.readyState === 'live') {
            track.stop();
            console.log(`✅ Cleanup: Stopped ${track.kind} track on unmount`);
          }
        });
      }

      if (remoteStreamRef.current) {
        remoteStreamRef.current.getTracks().forEach(track => {
          if (track.readyState === 'live') {
            track.stop();
            console.log(`✅ Cleanup: Stopped remote ${track.kind} track on unmount`);
          }
        });
      }

      if (pc.current) {
        pc.current.close();
        console.log('✅ Cleanup: Closed peer connection on unmount');
      }

      if (channel.current) {
        channel.current.send({ type: 'broadcast', event: 'signaling', payload: { type: 'leave' } });
        supabase.removeChannel(channel.current);
        console.log('✅ Cleanup: Closed channel on unmount');
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomId, userName]);

  const toggleAudio = useCallback(() => {
    if (localStream) {
      const audioTrack = localStream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        return audioTrack.enabled;
      }
    }
    return false;
  }, [localStream]);

  const toggleVideo = useCallback(() => {
    if (localStream) {
      const videoTrack = localStream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        return videoTrack.enabled;
      }
    }
    // If no video track available (audio-only mode), return false
    return false;
  }, [localStream]);

  const leaveCall = useCallback((shouldReload = true, isEndCall = false) => {
    console.log('🚪 Leaving call...');

    // Send leave or end-call message to server FIRST before cleanup
    if (channel.current) {
      if (isEndCall) {
        console.log('📞 Sending end-call message');
        channel.current.send({ type: 'broadcast', event: 'signaling', payload: { type: 'end-call', userName } });
        setTimeout(() => {
          if (channel.current) {
            supabase.removeChannel(channel.current);
          }
        }, 500);
      } else {
        console.log('📞 Sending leave message');
        channel.current.send({ type: 'broadcast', event: 'signaling', payload: { type: 'leave' } });
        supabase.removeChannel(channel.current);
      }
    } else {
      console.log('📞 Channel not available');
    }

    // Stop all local media tracks to release camera/microphone
    if (localStream) {
      localStream.getTracks().forEach(track => {
        if (track.readyState === 'live') {
          track.stop();
          console.log(`🎥 Stopped ${track.kind} track`);
        }
      });
    }

    // Clean up peer connection
    if (pc.current) {
      pc.current.close();
      pc.current = null;
      console.log('🔌 Closed peer connection');
    }

    // Clear state
    setLocalStream(null);
    setRemoteStream(null);
    remoteStreamRef.current = null;
    setIsConnected(false);
    setPeerName('');
    peerId.current = null;
    setError(null);
    setConnectionStatus('Disconnected');
    setIsAudioOnly(false);

    // Reset WebSocket after delay for end-call
    if (!isEndCall) {
      channel.current = null;
    }

    if (shouldReload) {
      setTimeout(() => {
        window.location.reload();
      }, isEndCall ? 200 : 500);
    }
  }, [localStream]);

  // Function to switch audio input device
  const switchAudioDevice = useCallback(async (deviceId: string) => {
    setAudioInputDeviceId(deviceId);

    if (!localStream) return;

    try {
      // Stop current audio tracks
      localStream.getAudioTracks().forEach(track => {
        track.stop();
      });

      // Get new stream with the selected audio device
      const newStream = await getMediaStreamWithDevice(
        deviceId,
        videoInputDeviceId,
        true,
        false
      );

      if (!isMounted.current) {
        newStream.getTracks().forEach(track => track.stop());
        return;
      }

      // Add new audio tracks to the existing stream
      newStream.getAudioTracks().forEach(track => {
        localStream.addTrack(track);
      });

      // Replace the audio track in the peer connection if it exists
      if (pc.current && isConnected && pc.current.signalingState !== 'closed') {
        const audioSenders = pc.current.getSenders().filter(sender =>
          sender.track && sender.track.kind === 'audio'
        );

        if (audioSenders.length > 0 && newStream.getAudioTracks().length > 0) {
          try {
            await audioSenders[0].replaceTrack(newStream.getAudioTracks()[0]);
            console.log('🎤 Replaced audio track in peer connection');
          } catch (err) {
            console.error('Error replacing audio track:', err);
            // We don't abort here, as we still want to update local stream if possible
          }
        }
      }

      setLocalStream(localStream);
      console.log('🎤 Audio device switched to:', deviceId);
    } catch (err) {
      console.error('Error switching audio device:', err);
      if (isMounted.current) {
        setError('Failed to switch audio device');
      }
    }
  }, [localStream, videoInputDeviceId, isConnected]);

  // Function to switch video input device
  const switchVideoDevice = useCallback(async (deviceId: string) => {
    setVideoInputDeviceId(deviceId);

    if (!localStream) return;

    try {
      // Stop current video tracks
      localStream.getVideoTracks().forEach(track => {
        track.stop();
      });

      // Get new stream with the selected video device
      const newStream = await getMediaStreamWithDevice(
        audioInputDeviceId,
        deviceId,
        false,
        true
      );

      if (!isMounted.current) {
        newStream.getTracks().forEach(track => track.stop());
        return;
      }

      // Add new video tracks to the existing stream
      newStream.getVideoTracks().forEach(track => {
        localStream.addTrack(track);
      });

      // Replace the video track in the peer connection if it exists
      if (pc.current && isConnected && pc.current.signalingState !== 'closed') {
        const videoSenders = pc.current.getSenders().filter(sender =>
          sender.track && sender.track.kind === 'video'
        );

        if (videoSenders.length > 0 && newStream.getVideoTracks().length > 0) {
          try {
            await videoSenders[0].replaceTrack(newStream.getVideoTracks()[0]);
            console.log('📹 Replaced video track in peer connection');
          } catch (err) {
            console.error('Error replacing video track:', err);
          }
        }
      }

      setLocalStream(localStream);
      setIsAudioOnly(false);
      console.log('📹 Video device switched to:', deviceId);
    } catch (err) {
      console.error('Error switching video device:', err);
      if (isMounted.current) {
        setError('Failed to switch video device');
      }
    }
  }, [localStream, audioInputDeviceId, isConnected]);

  // Function to set audio output device (speakers)
  const setAudioOutput = useCallback((deviceId: string) => {
    setAudioOutputDeviceId(deviceId);

    // Apply the audio output device to any audio/video elements
    const audioElements = document.querySelectorAll('audio, video') as NodeListOf<HTMLMediaElement & { sinkId?: string }>;

    audioElements.forEach(element => {
      if (element.setSinkId && typeof element.setSinkId === 'function') {
        element.setSinkId(deviceId).then(() => {
          console.log('🔊 Audio output device set to:', deviceId);
        }).catch(err => {
          console.error('Error setting audio output device:', err);
        });
      }
    });
  }, []);

  // Toggle screen sharing
  const toggleScreenShare = useCallback(async () => {
    if (!pc.current || !localStream) {
      setError('Cannot share screen: connection not established');
      return false;
    }

    try {
      if (isScreenSharing) {
        // Stop screen sharing and revert to camera
        console.log('📺 Stopping screen sharing');

        // Stop all screen share tracks
        if (screenShareStream.current) {
          screenShareStream.current.getTracks().forEach(track => {
            track.stop();
          });
        }

        // If we have the original video track, restore it
        if (originalVideoTrack.current) {
          // Find video sender
          const videoSenders = pc.current.getSenders().filter(sender =>
            sender.track && sender.track.kind === 'video'
          );

          if (videoSenders.length > 0) {
            // Replace the screen share track with the original camera track
            await videoSenders[0].replaceTrack(originalVideoTrack.current);
            console.log('📹 Restored camera video track');

            // Add the track back to local stream if needed
            const hasTrack = localStream.getTracks().some(track => track.id === originalVideoTrack.current?.id);
            if (!hasTrack && originalVideoTrack.current) {
              localStream.addTrack(originalVideoTrack.current);
            }
          }

          originalVideoTrack.current = null;
        }

        screenShareStream.current = null;
        setIsScreenSharing(false);

        // Notify remote peer that screen sharing stopped
        if (channel.current && peerId.current) {
          sendSignalingMessage({
            type: 'screen-share-state',
            isSharing: false,
            target: peerId.current
          });
        }

        return false;
      } else {
        // Start screen sharing
        console.log('📺 Starting screen sharing');

        // Get screen share stream
        const stream = await getScreenShareStream();
        screenShareStream.current = stream;

        // Store original video track
        const currentVideoTrack = localStream.getVideoTracks()[0];
        if (currentVideoTrack) {
          originalVideoTrack.current = currentVideoTrack;
        }

        // Get the video track from screen share
        const screenVideoTrack = stream.getVideoTracks()[0];
        if (screenVideoTrack) {
          // Handle when user stops sharing via browser UI
          screenVideoTrack.onended = async () => {
            if (isScreenSharing) {
              await toggleScreenShare();
            }
          };

          // Find video sender
          const videoSenders = pc.current.getSenders().filter(sender =>
            sender.track && sender.track.kind === 'video'
          );

          if (videoSenders.length > 0) {
            // Replace camera track with screen share track
            await videoSenders[0].replaceTrack(screenVideoTrack);
            console.log('📺 Replaced camera with screen share');
          } else {
            // Add as a new sender if no video sender exists
            pc.current.addTrack(screenVideoTrack, localStream);
            console.log('📺 Added screen share as new track');
          }

          setIsScreenSharing(true);

          // Notify remote peer that screen sharing started
          if (channel.current && peerId.current) {
            sendSignalingMessage({
              type: 'screen-share-state',
              isSharing: true,
              target: peerId.current
            });
          }

          return true;
        } else {
          setError('No video track found in screen share');
          return false;
        }
      }
    } catch (err) {
      console.error('Error toggling screen share:', err);
      const message = err instanceof Error ? err.message : 'Failed to toggle screen sharing';
      setError(message);
      return false;
    }
  }, [localStream, isScreenSharing]);

  // Send chat message
  const sendMessage = useCallback((message: string) => {
    if (!channel.current || !peerId.current) return;

    const messageData = {
      id: Date.now().toString() + Math.random(),
      sender: userName,
      text: message,
      timestamp: Date.now(),
      isLocal: true
    };

    // Add to local messages
    setMessages(prev => [...prev, messageData]);

    // Send to remote peer
    sendSignalingMessage({
      type: 'chat-message',
      message: message,
      senderName: userName,
      timestamp: Date.now(),
      target: peerId.current
    });
  }, [userName]);

  // Send typing indicator
  const sendTypingIndicator = useCallback((isTyping: boolean) => {
    if (!channel.current || !peerId.current) return;

    sendSignalingMessage({
      type: 'typing-indicator',
      isTyping,
      target: peerId.current
    });
  }, []);

  // Clear chat messages
  const clearChat = useCallback(() => {
    setMessages([]);
  }, []);

  return {
    localStream,
    remoteStream,
    isConnected,
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
  };
}
