# WordRace.io Backend

Express + Socket.io multiplayer server for WordRace.io

## Deploy on Render.com (free)
1. Push to GitHub
2. Go to render.com → New Web Service
3. Connect repo → auto-detected as Node.js
4. Start command: `npm start`
5. Done — live in 2 minutes

## API Endpoints
- GET  /api/health          — Server status
- GET  /api/rooms           — List open rooms (?mode=casual&status=waiting)
- GET  /api/rooms/:id       — Room detail
- POST /api/rooms/:id/join  — Join room
- GET  /api/leaderboard     — Leaderboard (?mode=casual&limit=20)
- POST /api/league/enter    — Enter daily league
- POST /api/validate        — Validate a word
- GET  /api/stats           — Server stats (admin)

## Socket.io Events

### Client → Server
| Event | Payload | Description |
|---|---|---|
| auth | {username} | Authenticate |
| room:create | {mode, options} | Create room |
| room:join | {roomId} | Join room |
| player:ready | {roomId} | Mark ready |
| round:answer | {roomId, catIdx, word} | Submit answer |
| round:submit | {roomId} | Early round end |
| powerup:freeze | {roomId} | Use time freeze |
| room:chat | {roomId, message} | Send chat |
| anticheat:tab_switch | {roomId} | Tab switch report |
| anticheat:paste | {roomId} | Paste attempt |
| anticheat:keystrokes | {intervals} | Keystroke timing |

### Server → Client
| Event | Payload | Description |
|---|---|---|
| auth:ok | {user} | Auth confirmed |
| room:joined | RoomState | Joined successfully |
| player:joined | {player, roomState} | New player joined |
| room:countdown | {seconds} | Game starting countdown |
| round:start | {round, letter, duration, categories} | Round begins |
| timer:tick | {secondsLeft} | Timer update (every 1s) |
| player:answer | {playerId, catIdx, word, isBot} | Bot answered |
| player:answered | {playerId, catIdx, hasAnswer} | Player filled a cell |
| round:end | {results, players, hasNextRound} | Round finished |
| game:end | {rankings, winner, prizePool} | Game over |
| player:disqualified | {playerId, reason} | Anti-cheat disqualification |
| anticheat:disqualified | {reason, message} | You are disqualified |
| anticheat:warning | {type, message} | Anti-cheat warning |
| room:chat | {from, message, ts} | Chat message |
