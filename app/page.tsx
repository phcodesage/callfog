'use client';

import { useRouter } from 'next/navigation';
import { Home } from '../src/views/Home';
import { createRoom } from '../src/lib/callfogApi';
import { saveCreatorKey, saveUserName } from '../src/lib/session';

export default function Page() {
  const router = useRouter();

  const handleCreateMeeting = async (userName: string) => {
    const { roomId, creatorKey } = await createRoom();
    saveUserName(userName);
    saveCreatorKey(roomId, creatorKey);
    router.push(`/room/${roomId}`);
  };

  const handleJoinMeeting = (roomId: string, userName: string) => {
    saveUserName(userName);
    router.push(`/room/${roomId}`);
  };

  return (
    <Home
      onCreateMeeting={handleCreateMeeting}
      onJoinMeeting={handleJoinMeeting}
    />
  );
}
