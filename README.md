# ChatRoom — Real-Time Anonymous Chat

A full-stack real-time chat application. No signup required.

## Features
- Create rooms with a shareable 6-character code
- Join rooms by entering the code
- Real-time messaging with Socket.io
- Send images, videos, audio, and files (via Cloudinary)
- Typing indicators, emoji reactions, message replies, message deletion
- Online members sidebar with presence indicators
- Dark/light mode toggle
- Rooms auto-expire after 7 days of inactivity

## Tech Stack
Next.js · TypeScript · Socket.io · MongoDB · Cloudinary · Tailwind CSS · Framer Motion

## Setup

1. Install dependencies:
```bash
npm install
```

2. Fill in `.env.local` with your credentials:
```
MONGODB_URI=your_mongodb_uri
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

3. Run in development:
```bash
npm run dev
```

4. Build and run in production:
```bash
npm run build
npm start
```

## Deployment
Deploy on Railway, Render, or any VPS. Does **not** work on Vercel (requires persistent server for Socket.io).
