# Callfog - Anonymous Quick Video & Audio Calls

Callfog is an anonymous, quick 1-on-1 video and audio calling application built with React, TypeScript, and WebRTC.

## Features

- 🎥 Peer-to-peer video calling
- 🎤 Audio-only mode support
- 📺 Screen sharing
- 💬 Real-time chat messaging
- 🔄 Device switching (camera, microphone, speakers)
- 🎨 Beautiful animated UI
- 🔒 Secure WebRTC connections

## Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- A WebRTC signaling server (backend)

## Environment Configuration

This application uses environment variables for configuration. You can easily change the backend/WebSocket URL without modifying the code.

### Setup Environment Variables

1. Copy the `.env.example` file to create your `.env` file:
   ```bash
   cp .env.example .env
   ```

2. Edit the `.env` file and update the values:
   ```env
   # Backend/WebSocket URL Configuration
   NEXT_PUBLIC_WS_URL=ws://localhost:3001
   
   # HTTP API URL (optional - if not set, will be derived from the current browser origin)
   # NEXT_PUBLIC_API_URL=http://localhost:3000
   
   # For production, use your production backend URL:
   # NEXT_PUBLIC_WS_URL=wss://your-backend-domain.com
   # NEXT_PUBLIC_API_URL=https://your-backend-domain.com
   ```

### Available Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `NEXT_PUBLIC_WS_URL` | WebSocket URL for the signaling server | `ws://localhost:3001` |
| `NEXT_PUBLIC_API_URL` | HTTP API URL for REST endpoints (optional, auto-derived from the current browser origin) | Auto-derived from the current origin |

> **Note:** In Next.js, client-side environment variables must be prefixed with `NEXT_PUBLIC_`.

### Production Deployment

When deploying to production:

1. Update `NEXT_PUBLIC_WS_URL` to your production backend URL (use `wss://` for secure WebSocket)
2. Ensure your backend server is running and accessible
3. Build the application with the production environment variables

Example production `.env`:
```env
NEXT_PUBLIC_WS_URL=wss://api.yourdomain.com
```

## Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up your environment variables (see above)

4. Start the development server:
   ```bash
   npm run dev
   ```

5. Make sure your WebRTC signaling server is running on the configured URL

## Development

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## Project Structure

```
app/
├── api/            # Next.js serverless API routes
├── room/           # Dynamic room page
├── page.tsx        # Main homepage
src/
├── app/            # Next.js app global styles
├── components/     # React components
├── config/         # Configuration files (environment variables)
├── hooks/          # Custom React hooks (WebRTC logic)
├── utils/          # Utility functions
└── views/          # Shared page components (Home, Room)
```

## How It Works

1. User creates or joins a meeting room
2. WebRTC peer connection is established through the signaling server
3. Media streams (audio/video) are exchanged directly between peers
4. Chat messages are sent through the data channel
5. Screen sharing replaces the video track when enabled

## Technologies Used

- **React** - UI framework
- **TypeScript** - Type safety
- **Next.js** - React framework and server-side rendering
- **WebRTC** - Real-time communication
- **Tailwind CSS** - Styling
- **Lucide React** - Icons

## Browser Support

- Chrome/Edge (recommended)
- Firefox
- Safari (with limitations)

## License

MIT

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.