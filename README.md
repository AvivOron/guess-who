# Guess Who? 🎭

Hebrew multiplayer guessing game featuring Israeli celebrities — up to 10 players per session.

## How it works

1. The organizer creates a game and shares the code/link
2. Players join with the code
3. Organizer hits **Start Game**
4. Each round, one player is in the "hot seat" — they receive a card of an Israeli celebrity but **cannot see it**
5. The hot-seat player asks yes/no questions; everyone else can see the celebrity and answers
6. Organizer clicks ✅ or ❌ then **Next Turn** to rotate

## Local development

```bash
npm run install:all
npm run dev
```

Frontend runs at http://localhost:5173 (Vite dev server)
API runs via `vercel dev` on port 3000

## Adding categories or items

Edit [api/_lib/categories.js](api/_lib/categories.js) to add new categories or items. The same file is mirrored on the client at [client/src/categories.js](client/src/categories.js) (name and emoji only — no items needed client-side).

## Deployment

Everything deploys to **Vercel** (frontend static + serverless API).

### Services required

| Service | Purpose | Free tier |
|---|---|---|
| [Vercel](https://vercel.com) | Hosting + API | Yes |
| [Pusher Channels](https://pusher.com) | Real-time events | Yes (200k msg/day) |
| [Upstash Redis](https://upstash.com) | Session state | Yes (10k req/day) |

### Environment variables

Set these in the Vercel dashboard under **Settings → Environment Variables**:

```
PUSHER_APP_ID=
PUSHER_KEY=
PUSHER_SECRET=
PUSHER_CLUSTER=
VITE_PUSHER_KEY=       # same as PUSHER_KEY
VITE_PUSHER_CLUSTER=   # same as PUSHER_CLUSTER
KV_REST_API_URL=       # from Upstash dashboard
KV_REST_API_TOKEN=     # from Upstash dashboard
```

### Deploy steps

1. Push to GitHub
2. Import the repo in Vercel — it will auto-detect `vercel.json`
3. Add the environment variables above
4. Deploy
