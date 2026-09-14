import { Room } from 'livekit-client';

// Permissions are already granted once the call has started, so labels are available
// without prompting again.
export const getAudioInputDevices = () => Room.getLocalDevices('audioinput', false);
export const getAudioOutputDevices = () => Room.getLocalDevices('audiooutput', false);
export const getVideoInputDevices = () => Room.getLocalDevices('videoinput', false);
