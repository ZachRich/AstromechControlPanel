# Astromech Control Panel

A Next.js application for controlling Astromech components.

## Setup

1. Install dependencies:
```bash
npm install
```

2. Create a `.env.local` file with:
```
NEXT_PUBLIC_API_URL=http://pi:3030
```

3. Run the development server:
```bash
npm run dev
```

## Features

- Servo Control
- Audio Playback
- Controller Status Monitoring
- Real-time Updates

## Tech Stack

- Next.js 14
- TypeScript
- Tailwind CSS
- shadcn/ui
- Axios

## API Endpoints

- `GET /api/servos` - List all servos
- `POST /api/servos/{name}/move` - Move a servo
- `GET /api/controllers` - List all controllers
- `GET /api/audio` - List audio files
- `POST /api/audio/play` - Play audio file
