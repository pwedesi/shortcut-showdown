# Shortcut Showdown load test (k6)

This script simulates the frontend flow:
- WebSocket connect to obtain `player_id`
- Quick-play into a lobby
- Ready/host start logic
- Game polling + submit attempts
- Results fetch + leave

## Run

```bash
k6 run load/k6/shortcut-showdown.js
```

## Required env vars

Set these to point at your Render deployment:

```bash
export API_BASE_URL="https://shortcut-showdown-api.onrender.com"
export WS_URL="wss://shortcut-showdown-api.onrender.com/ws"
```

## Optional tuning

```bash
export BASELINE_VUS=500
export RAMP1_VUS=1500
export RAMP2_VUS=3000
export SESSION_MIN_SECONDS=480
export SESSION_MAX_SECONDS=600
export ATTEMPTS_PER_SECOND=3
export CONNECT_TIMEOUT_MS=8000
export LOBBY_POLL_MS=3000
export GAME_POLL_MS=5000
export START_WAIT_MS=60000
```

Override the full stage profile with JSON:

```bash
export STAGES_JSON='[
  {"duration":"10m","target":500},
  {"duration":"20m","target":500},
  {"duration":"20m","target":1500},
  {"duration":"5m","target":2250},
  {"duration":"10m","target":1500},
  {"duration":"20m","target":3000},
  {"duration":"5m","target":4500},
  {"duration":"10m","target":3000},
  {"duration":"10m","target":500}
]'
```

## Notes

- The script expects the WebSocket server to emit a `connect` event with `player_id`.
- Attempts are randomized keyboard shortcuts; results may be mostly incorrect, which is acceptable for load.
- If a lobby fails to start within `START_WAIT_MS`, the virtual user leaves and ends the session.
