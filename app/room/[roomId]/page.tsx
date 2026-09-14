import { RoomRoute } from './RoomRoute';

// The site is a static export (Cloudflare Pages). One placeholder page serves every
// room: public/_redirects rewrites /room/* to /room/_, and RoomRoute reads the real
// room id from the address bar.
export function generateStaticParams() {
  return [{ roomId: '_' }];
}

export default function RoomPage() {
  return <RoomRoute />;
}
