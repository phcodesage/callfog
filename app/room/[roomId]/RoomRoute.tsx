'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Home } from '../../../src/views/Home';
import { Room } from '../../../src/views/Room';
import { createRoom, isValidRoomId } from '../../../src/lib/callfogApi';
import {
  loadCreatorKey,
  loadUserName,
  saveCallEndedMessage,
  saveCreatorKey,
  saveUserName,
} from '../../../src/lib/session';

function roomIdFromLocation(): string {
  const match = window.location.pathname.match(/^\/room\/([^/]+)/);
  return match ? decodeURIComponent(match[1]).toLowerCase() : '';
}

interface RoomSession {
  roomId: string;
  userName: string | null;
  creatorKey: string | null;
}

export function RoomRoute() {
  const router = useRouter();
  // null until the URL and storage have been read on the client.
  const [session, setSession] = useState<RoomSession | null>(null);

  useEffect(() => {
    const roomId = roomIdFromLocation();
    if (!isValidRoomId(roomId)) {
      saveCallEndedMessage("That call link isn't valid");
      router.replace('/');
      return;
    }
    setSession({ roomId, userName: loadUserName(), creatorKey: loadCreatorKey(roomId) });
  }, [router]);

  const handleLeave = useCallback((message?: string) => {
    if (message) saveCallEndedMessage(message);
    router.push('/');
  }, [router]);

  if (!session) return null;
  const { roomId } = session;

  const handleCreateMeeting = async (name: string) => {
    const created = await createRoom();
    saveUserName(name);
    saveCreatorKey(created.roomId, created.creatorKey);
    // Full navigation: this page reads the room id from the URL on load.
    window.location.assign(`/room/${created.roomId}`);
  };

  const handleJoinMeeting = (existingRoomId: string, name: string) => {
    saveUserName(name);
    if (existingRoomId !== roomId) {
      window.location.assign(`/room/${existingRoomId}`);
      return;
    }
    setSession({ roomId, userName: name, creatorKey: loadCreatorKey(roomId) });
  };

  if (!session.userName) {
    return (
      <Home
        onCreateMeeting={handleCreateMeeting}
        onJoinMeeting={handleJoinMeeting}
        autoJoinRoomId={roomId}
        onCancelJoin={() => router.push('/')}
      />
    );
  }

  return (
    <Room
      key={roomId}
      roomId={roomId}
      userName={session.userName}
      creatorKey={session.creatorKey}
      onLeave={handleLeave}
    />
  );
}
