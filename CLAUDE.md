# Guess Who — Claude Code Guide

## Architecture

- **Frontend**: React + Vite in `client/`, deployed as Vercel static hosting
- **Backend**: Vercel Serverless Functions in `api/`
- **Real-time**: Pusher Channels (presence + private channels per player)
- **State**: Upstash Redis via `@upstash/redis` — sessions stored as JSON with 4hr TTL

## Key design decisions

### Hot-seat player never receives the celebrity
`TURN_STARTED` is broadcast to everyone with no celebrity field. The celebrity is sent separately via `CELEBRITY_ASSIGNED` on each non-hot-seat player's `private-player-{id}` Pusher channel using `pusher.triggerBatch()`. Never send celebrity data to the hot-seat player's channel.

### Pusher auth
All presence/private channels require server-side auth at `/api/pusher-auth`. The client uses a custom `authorizer` in Pusher JS to inject `playerId` into the auth POST body. The endpoint reads `playerId` from `req.body` (urlencoded form).

### State mutations
Every API handler follows: read session from Redis → mutate with pure functions from `api/_lib/gameLogic.js` → write back to Redis → trigger Pusher events.

## File structure

```
api/
  _lib/
    celebrities.js   # celebrity pool (add/edit celebrities here)
    gameLogic.js     # pure state mutation functions (no I/O)
    kv.js            # Upstash Redis helpers
    pusher.js        # Pusher server SDK singleton
  game/
    ask.js           # POST /api/game/ask
    answer.js        # POST /api/game/answer
    next-turn.js     # POST /api/game/next-turn
    reveal.js        # POST /api/game/reveal
    start.js         # POST /api/game/start  (also exports broadcastTurn)
  session/
    create.js        # POST /api/session/create
    join.js          # POST /api/session/join
  pusher-auth.js     # POST /api/pusher-auth
client/src/
  pusher.js          # Pusher client + fetch-based send() — replaces WebSocket
  store/gameStore.jsx # React context + useReducer for all UI state
  views/
    HomeView.jsx     # Create or join session
    LobbyView.jsx    # Waiting room
    GameView.jsx     # Main game screen
public/images/celebrities/  # Add celebrity photos here (JPG/PNG)
```

## Adding celebrities

Edit `api/_lib/celebrities.js` and add a photo to `public/images/celebrities/` with the matching filename.

## Local dev

```bash
npm run install:all  # install root + client deps
npm run dev          # starts vercel dev + vite concurrently
```

Requires a `.env` file at the root — copy `.env.example` and fill in values.
