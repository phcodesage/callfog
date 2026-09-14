'use client';

import { Home } from '../src/views/Home';
import { createRoom } from '../src/lib/callfogApi';
import { saveCreatorKey, saveUserName } from '../src/lib/session';

// Room pages come from one static placeholder that reads the id from the URL,
// so enter a room with a full page load rather than client-side routing.
export default function Page() {
  const handleCreateMeeting = async (userName: string) => {
    const { roomId, creatorKey } = await createRoom();
    saveUserName(userName);
    saveCreatorKey(roomId, creatorKey);
    window.location.assign(`/room/${roomId}`);
  };

  const handleJoinMeeting = (roomId: string, userName: string) => {
    saveUserName(userName);
    window.location.assign(`/room/${roomId}`);
  };

  return (
    <Home
      onCreateMeeting={handleCreateMeeting}
      onJoinMeeting={handleJoinMeeting}
    />
  );
}
