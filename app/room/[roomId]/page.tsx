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

interface RoomPageProps {
  params: {
    roomId: string;
  };
}

export default function RoomPage({ params }: RoomPageProps) {
  const roomId = params.roomId.toLowerCase();
  const router = useRouter();
  // null until storage has been read on the client, to avoid flashing the name prompt.
  const [session, setSession] = useState<{ userName: string | null; creatorKey: string | null } | null>(null);

  useEffect(() => {
    if (!isValidRoomId(roomId)) {
      saveCallEndedMessage("That call link isn't valid");
      router.replace('/');
      return;
    }
    setSession({ userName: loadUserName(), creatorKey: loadCreatorKey(roomId) });
  }, [roomId, router]);

  const handleLeave = useCallback((message?: string) => {
    if (message) saveCallEndedMessage(message);
    router.push('/');
  }, [router]);

  const handleCreateMeeting = async (name: string) => {
    const created = await createRoom();
    saveUserName(name);
    saveCreatorKey(created.roomId, created.creatorKey);
    router.push(`/room/${created.roomId}`);
  };

  const handleJoinMeeting = (existingRoomId: string, name: string) => {
    saveUserName(name);
    if (existingRoomId !== roomId) {
      router.push(`/room/${existingRoomId}`);
      return;
    }
    setSession({ userName: name, creatorKey: loadCreatorKey(roomId) });
  };

  if (!session) return null;

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
