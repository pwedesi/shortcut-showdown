# Live URL KPI Measurement (User-Facing Performance)

This doc describes how we measure user-facing performance KPIs against the live API:

- Throughput (requests per second)
- Response time (avg, p50, p95)
- Error rate (non-2xx responses)

## Target

```
NEXT_PUBLIC_API_BASE_URL=https://shortcut-showdown-api.onrender.com
```

## What We Test (Frontend-Used Endpoints)

The probe exercises the same REST endpoints the frontend calls during normal play:

- `GET /` (health check)
- `WS /ws` (player id assignment)
- `PATCH /players/{id}`
- `POST /lobbies`
- `POST /lobbies/{id}/join`
- `GET /lobbies/{id}`
- `POST /lobbies/{id}/start`
- `GET /game-rooms/{id}`
- `POST /game-rooms/{id}/attempts`

This gives per-endpoint and cumulative KPIs with minimal stateful game logic.

## Tooling

We use a lightweight Python probe that measures each endpoint and prints a summary:

```
shortcut-showdown-api/stress/live_kpi_probe.py
```

It runs two phases:

1. A pure load phase against `GET /` for baseline throughput and latency.
2. A workflow phase that simulates user flow: connect -> set display name -> create lobby -> join -> get lobby -> start -> get room -> submit attempts.

Attempt payloads map prompts to expected keys using the server shortcut dataset. If a
prompt is not found, the probe sends a fallback key sequence.

## How To Run

From the API repo root:

```
cd /home/hd/projects/shosho/shortcut-showdown-api
source .venv/bin/activate
pip install aiohttp
python stress/live_kpi_probe.py \
  --api-base https://shortcut-showdown-api.onrender.com \
  --matrix
```

## Output And Interpretation

The script prints per-endpoint and cumulative aggregates:

- `requests`: total, ok, fail
- `error_rate`: failed / total
- `response_ms`: avg, p50, p95, min, max
- `throughput`: requests per second

Cumulative KPI values reflect the entire test window (health + workflow).

## Latest Run (2026-05-08, load matrix)

Command:

```
/home/hd/projects/shosho/shortcut-showdown-api/.venv/bin/python stress/live_kpi_probe.py \
  --api-base https://shortcut-showdown-api.onrender.com \
  --matrix \
  --players-matrix 2,4,6 \
  --workflow-concurrency-matrix 5,10,20
```

Output:

```
========== LIVE KPI PROBE ==========
Scenario: p2-rooms5
API base: https://shortcut-showdown-api.onrender.com
WS url:  wss://shortcut-showdown-api.onrender.com/ws
Health requests: 200 @ concurrency 50
Workflow runs:   50 @ concurrency 5

--- PER ENDPOINT ---
GET /
  requests: 200 (ok: 200, fail: 0)
  error_rate: 0.00%
  response_ms: avg 384.21, p50 280.91, p95 986.60, min 115.59, max 1138.67
  throughput: 120.41 req/s
  status_counts: 200:200
GET /game-rooms/{id}
  requests: 50 (ok: 50, fail: 0)
  error_rate: 0.00%
  response_ms: avg 277.58, p50 157.43, p95 744.36, min 113.79, max 1566.25
  throughput: 0.99 req/s
  status_counts: 200:50
GET /lobbies/{id}
  requests: 50 (ok: 50, fail: 0)
  error_rate: 0.00%
  response_ms: avg 190.19, p50 149.88, p95 522.15, min 115.36, max 634.60
  throughput: 0.99 req/s
  status_counts: 200:50
PATCH /players/{id}
  requests: 100 (ok: 100, fail: 0)
  error_rate: 0.00%
  response_ms: avg 308.38, p50 171.10, p95 741.88, min 118.15, max 2530.25
  throughput: 1.98 req/s
  status_counts: 200:100
POST /game-rooms/{id}/attempts
  requests: 250 (ok: 250, fail: 0)
  error_rate: 0.00%
  response_ms: avg 280.20, p50 155.23, p95 777.03, min 117.33, max 1776.10
  throughput: 4.94 req/s
  status_counts: 200:250
POST /lobbies
  requests: 50 (ok: 50, fail: 0)
  error_rate: 0.00%
  response_ms: avg 222.44, p50 148.84, p95 685.46, min 122.29, max 774.83
  throughput: 0.99 req/s
  status_counts: 201:50
POST /lobbies/{id}/join
  requests: 50 (ok: 50, fail: 0)
  error_rate: 0.00%
  response_ms: avg 253.35, p50 154.43, p95 701.39, min 116.09, max 1540.36
  throughput: 0.99 req/s
  status_counts: 200:50
POST /lobbies/{id}/start
  requests: 50 (ok: 50, fail: 0)
  error_rate: 0.00%
  response_ms: avg 265.75, p50 158.64, p95 769.16, min 118.58, max 1786.34
  throughput: 0.99 req/s
  status_counts: 200:50
ws_connect
  requests: 100 (ok: 100, fail: 0)
  error_rate: 0.00%
  response_ms: avg 528.47, p50 285.50, p95 1538.98, min 213.59, max 6019.57
  throughput: 1.98 req/s

--- CUMULATIVE ---
ALL
  requests: 900 (ok: 900, fail: 0)
  error_rate: 0.00%
  response_ms: avg 323.38, p50 171.88, p95 933.22, min 113.79, max 6019.57
  throughput: 17.22 req/s

========== LIVE KPI PROBE ==========
Scenario: p2-rooms10
API base: https://shortcut-showdown-api.onrender.com
WS url:  wss://shortcut-showdown-api.onrender.com/ws
Health requests: 200 @ concurrency 50
Workflow runs:   50 @ concurrency 10

--- PER ENDPOINT ---
GET /
  requests: 200 (ok: 200, fail: 0)
  error_rate: 0.00%
  response_ms: avg 332.45, p50 290.75, p95 710.61, min 110.53, max 791.68
  throughput: 135.23 req/s
  status_counts: 200:200
GET /game-rooms/{id}
  requests: 50 (ok: 50, fail: 0)
  error_rate: 0.00%
  response_ms: avg 147.36, p50 145.61, p95 176.13, min 113.68, max 281.58
  throughput: 3.12 req/s
  status_counts: 200:50
GET /lobbies/{id}
  requests: 50 (ok: 50, fail: 0)
  error_rate: 0.00%
  response_ms: avg 142.21, p50 139.56, p95 168.33, min 116.98, max 171.89
  throughput: 3.12 req/s
  status_counts: 200:50
PATCH /players/{id}
  requests: 100 (ok: 100, fail: 0)
  error_rate: 0.00%
  response_ms: avg 197.96, p50 156.13, p95 350.16, min 119.89, max 400.16
  throughput: 6.23 req/s
  status_counts: 200:100
POST /game-rooms/{id}/attempts
  requests: 250 (ok: 250, fail: 0)
  error_rate: 0.00%
  response_ms: avg 151.10, p50 145.78, p95 184.97, min 118.71, max 314.21
  throughput: 15.58 req/s
  status_counts: 200:250
POST /lobbies
  requests: 50 (ok: 50, fail: 0)
  error_rate: 0.00%
  response_ms: avg 150.57, p50 149.71, p95 182.11, min 116.24, max 200.11
  throughput: 3.12 req/s
  status_counts: 201:50
POST /lobbies/{id}/join
  requests: 50 (ok: 50, fail: 0)
  error_rate: 0.00%
  response_ms: avg 152.35, p50 147.70, p95 176.96, min 120.44, max 377.60
  throughput: 3.12 req/s
  status_counts: 200:50
POST /lobbies/{id}/start
  requests: 50 (ok: 50, fail: 0)
  error_rate: 0.00%
  response_ms: avg 152.07, p50 145.75, p95 190.76, min 122.04, max 249.24
  throughput: 3.12 req/s
  status_counts: 200:50
ws_connect
  requests: 100 (ok: 100, fail: 0)
  error_rate: 0.00%
  response_ms: avg 309.12, p50 265.21, p95 492.56, min 213.56, max 538.60
  throughput: 6.23 req/s

--- CUMULATIVE ---
ALL
  requests: 900 (ok: 900, fail: 0)
  error_rate: 0.00%
  response_ms: avg 213.56, p50 157.61, p95 484.95, min 110.53, max 791.68
  throughput: 51.37 req/s

========== LIVE KPI PROBE ==========
Scenario: p2-rooms20
API base: https://shortcut-showdown-api.onrender.com
WS url:  wss://shortcut-showdown-api.onrender.com/ws
Health requests: 200 @ concurrency 50
Workflow runs:   50 @ concurrency 20

--- PER ENDPOINT ---
GET /
  requests: 200 (ok: 200, fail: 0)
  error_rate: 0.00%
  response_ms: avg 351.57, p50 304.96, p95 762.95, min 115.05, max 852.45
  throughput: 127.17 req/s
  status_counts: 200:200
GET /game-rooms/{id}
  requests: 50 (ok: 50, fail: 0)
  error_rate: 0.00%
  response_ms: avg 320.64, p50 172.02, p95 884.81, min 119.28, max 963.33
  throughput: 2.44 req/s
  status_counts: 200:50
GET /lobbies/{id}
  requests: 50 (ok: 50, fail: 0)
  error_rate: 0.00%
  response_ms: avg 230.53, p50 154.42, p95 450.48, min 120.12, max 1466.81
  throughput: 2.44 req/s
  status_counts: 200:50
PATCH /players/{id}
  requests: 100 (ok: 100, fail: 0)
  error_rate: 0.00%
  response_ms: avg 264.40, p50 166.02, p95 570.38, min 115.25, max 1163.66
  throughput: 4.87 req/s
  status_counts: 200:100
POST /game-rooms/{id}/attempts
  requests: 250 (ok: 250, fail: 0)
  error_rate: 0.00%
  response_ms: avg 359.84, p50 187.22, p95 794.71, min 120.84, max 2916.43
  throughput: 12.18 req/s
  status_counts: 200:250
POST /lobbies
  requests: 50 (ok: 50, fail: 0)
  error_rate: 0.00%
  response_ms: avg 202.91, p50 161.05, p95 421.11, min 112.81, max 453.02
  throughput: 2.44 req/s
  status_counts: 201:50
POST /lobbies/{id}/join
  requests: 50 (ok: 50, fail: 0)
  error_rate: 0.00%
  response_ms: avg 318.45, p50 152.33, p95 423.52, min 117.13, max 6751.47
  throughput: 2.44 req/s
  status_counts: 200:50
POST /lobbies/{id}/start
  requests: 50 (ok: 50, fail: 0)
  error_rate: 0.00%
  response_ms: avg 355.45, p50 160.67, p95 753.52, min 117.34, max 4898.35
  throughput: 2.44 req/s
  status_counts: 200:50
ws_connect
  requests: 100 (ok: 100, fail: 0)
  error_rate: 0.00%
  response_ms: avg 378.34, p50 280.89, p95 889.58, min 205.00, max 1431.28
  throughput: 4.87 req/s

--- CUMULATIVE ---
ALL
  requests: 900 (ok: 900, fail: 0)
  error_rate: 0.00%
  response_ms: avg 328.83, p50 229.45, p95 763.74, min 112.81, max 6751.47
  throughput: 40.72 req/s

========== LIVE KPI PROBE ==========
Scenario: p4-rooms5
API base: https://shortcut-showdown-api.onrender.com
WS url:  wss://shortcut-showdown-api.onrender.com/ws
Health requests: 200 @ concurrency 50
Workflow runs:   50 @ concurrency 5

--- PER ENDPOINT ---
GET /
  requests: 200 (ok: 200, fail: 0)
  error_rate: 0.00%
  response_ms: avg 2329.71, p50 721.28, p95 11535.94, min 122.24, max 13502.05
  throughput: 14.81 req/s
  status_counts: 200:200
GET /game-rooms/{id}
  requests: 50 (ok: 50, fail: 0)
  error_rate: 0.00%
  response_ms: avg 188.90, p50 141.87, p95 568.15, min 113.94, max 956.14
  throughput: 0.72 req/s
  status_counts: 200:50
GET /lobbies/{id}
  requests: 50 (ok: 50, fail: 0)
  error_rate: 0.00%
  response_ms: avg 181.33, p50 144.79, p95 422.30, min 116.00, max 713.62
  throughput: 0.72 req/s
  status_counts: 200:50
PATCH /players/{id}
  requests: 200 (ok: 200, fail: 0)
  error_rate: 0.00%
  response_ms: avg 231.15, p50 151.56, p95 659.86, min 112.07, max 1686.41
  throughput: 2.90 req/s
  status_counts: 200:200
POST /game-rooms/{id}/attempts
  requests: 250 (ok: 250, fail: 0)
  error_rate: 0.00%
  response_ms: avg 255.71, p50 151.97, p95 781.10, min 115.58, max 1840.42
  throughput: 3.62 req/s
  status_counts: 200:250
POST /lobbies
  requests: 50 (ok: 50, fail: 0)
  error_rate: 0.00%
  response_ms: avg 182.27, p50 149.45, p95 518.89, min 114.50, max 690.60
  throughput: 0.72 req/s
  status_counts: 201:50
POST /lobbies/{id}/join
  requests: 150 (ok: 150, fail: 0)
  error_rate: 0.00%
  response_ms: avg 201.97, p50 147.77, p95 675.19, min 118.42, max 1937.55
  throughput: 2.17 req/s
  status_counts: 200:150
POST /lobbies/{id}/set-max-players
  requests: 50 (ok: 50, fail: 0)
  error_rate: 0.00%
  response_ms: avg 220.38, p50 149.74, p95 666.16, min 118.35, max 786.68
  throughput: 0.72 req/s
  status_counts: 200:50
POST /lobbies/{id}/start
  requests: 50 (ok: 50, fail: 0)
  error_rate: 0.00%
  response_ms: avg 208.30, p50 149.34, p95 660.06, min 118.89, max 710.83
  throughput: 0.72 req/s
  status_counts: 200:50
ws_connect
  requests: 200 (ok: 200, fail: 0)
  error_rate: 0.00%
  response_ms: avg 450.33, p50 378.41, p95 1339.12, min 208.07, max 1663.81
  throughput: 2.90 req/s

--- CUMULATIVE ---
ALL
  requests: 1250 (ok: 1250, fail: 0)
  error_rate: 0.00%
  response_ms: avg 596.42, p50 159.71, p95 1619.38, min 112.07, max 13502.05
  throughput: 15.15 req/s

========== LIVE KPI PROBE ==========
Scenario: p4-rooms10
API base: https://shortcut-showdown-api.onrender.com
WS url:  wss://shortcut-showdown-api.onrender.com/ws
Health requests: 200 @ concurrency 50
Workflow runs:   50 @ concurrency 10

--- PER ENDPOINT ---
GET /
  requests: 200 (ok: 200, fail: 0)
  error_rate: 0.00%
  response_ms: avg 321.26, p50 225.74, p95 847.11, min 114.21, max 929.83
  throughput: 140.32 req/s
  status_counts: 200:200
GET /game-rooms/{id}
  requests: 50 (ok: 50, fail: 0)
  error_rate: 0.00%
  response_ms: avg 179.64, p50 147.87, p95 434.51, min 115.39, max 506.90
  throughput: 1.33 req/s
  status_counts: 200:50
GET /lobbies/{id}
  requests: 50 (ok: 50, fail: 0)
  error_rate: 0.00%
  response_ms: avg 215.52, p50 146.32, p95 475.96, min 117.75, max 1638.56
  throughput: 1.33 req/s
  status_counts: 200:50
PATCH /players/{id}
  requests: 200 (ok: 200, fail: 0)
  error_rate: 0.00%
  response_ms: avg 230.96, p50 152.03, p95 554.68, min 114.51, max 3930.92
  throughput: 5.32 req/s
  status_counts: 200:200
POST /game-rooms/{id}/attempts
  requests: 250 (ok: 250, fail: 0)
  error_rate: 0.00%
  response_ms: avg 202.88, p50 149.26, p95 574.57, min 114.10, max 760.67
  throughput: 6.65 req/s
  status_counts: 200:250
POST /lobbies
  requests: 50 (ok: 50, fail: 0)
  error_rate: 0.00%
  response_ms: avg 203.07, p50 149.10, p95 440.82, min 115.14, max 1014.65
  throughput: 1.33 req/s
  status_counts: 201:50
POST /lobbies/{id}/join
  requests: 150 (ok: 150, fail: 0)
  error_rate: 0.00%
  response_ms: avg 185.58, p50 147.97, p95 444.90, min 116.35, max 1113.61
  throughput: 3.99 req/s
  status_counts: 200:150
POST /lobbies/{id}/set-max-players
  requests: 50 (ok: 50, fail: 0)
  error_rate: 0.00%
  response_ms: avg 176.83, p50 148.19, p95 323.01, min 118.60, max 970.20
  throughput: 1.33 req/s
  status_counts: 200:50
POST /lobbies/{id}/start
  requests: 50 (ok: 50, fail: 0)
  error_rate: 0.00%
  response_ms: avg 174.67, p50 148.29, p95 383.84, min 123.56, max 682.10
  throughput: 1.33 req/s
  status_counts: 200:50
ws_connect
  requests: 200 (ok: 200, fail: 0)
  error_rate: 0.00%
  response_ms: avg 397.11, p50 380.86, p95 680.56, min 208.97, max 2591.06
  throughput: 5.32 req/s

--- CUMULATIVE ---
ALL
  requests: 1250 (ok: 1250, fail: 0)
  error_rate: 0.00%
  response_ms: avg 252.73, p50 158.92, p95 673.76, min 114.10, max 3930.92
  throughput: 32.05 req/s

========== LIVE KPI PROBE ==========
Scenario: p4-rooms20
API base: https://shortcut-showdown-api.onrender.com
WS url:  wss://shortcut-showdown-api.onrender.com/ws
Health requests: 200 @ concurrency 50
Workflow runs:   50 @ concurrency 20

--- PER ENDPOINT ---
GET /
  requests: 200 (ok: 198, fail: 2)
  error_rate: 1.00%
  response_ms: avg 2002.89, p50 742.38, p95 9253.47, min 121.85, max 15478.48
  throughput: 12.92 req/s
  status_counts: 200:198
  error_samples:
    - status=None, body=<no body>
    - status=None, body=<no body>
GET /game-rooms/{id}
  requests: 50 (ok: 50, fail: 0)
  error_rate: 0.00%
  response_ms: avg 184.28, p50 149.87, p95 422.34, min 119.31, max 601.50
  throughput: 3.18 req/s
  status_counts: 200:50
GET /lobbies/{id}
  requests: 50 (ok: 50, fail: 0)
  error_rate: 0.00%
  response_ms: avg 184.09, p50 152.99, p95 399.46, min 120.48, max 710.42
  throughput: 3.18 req/s
  status_counts: 200:50
PATCH /players/{id}
  requests: 200 (ok: 200, fail: 0)
  error_rate: 0.00%
  response_ms: avg 233.05, p50 157.34, p95 555.08, min 117.95, max 1349.97
  throughput: 12.73 req/s
  status_counts: 200:200
POST /game-rooms/{id}/attempts
  requests: 250 (ok: 250, fail: 0)
  error_rate: 0.00%
  response_ms: avg 184.39, p50 151.67, p95 385.45, min 115.35, max 888.71
  throughput: 15.92 req/s
  status_counts: 200:250
POST /lobbies
  requests: 50 (ok: 50, fail: 0)
  error_rate: 0.00%
  response_ms: avg 154.03, p50 144.24, p95 196.26, min 119.64, max 282.63
  throughput: 3.18 req/s
  status_counts: 201:50
POST /lobbies/{id}/join
  requests: 150 (ok: 150, fail: 0)
  error_rate: 0.00%
  response_ms: avg 158.11, p50 145.62, p95 203.34, min 115.09, max 601.43
  throughput: 9.55 req/s
  status_counts: 200:150
POST /lobbies/{id}/set-max-players
  requests: 50 (ok: 50, fail: 0)
  error_rate: 0.00%
  response_ms: avg 163.30, p50 149.38, p95 273.49, min 116.90, max 496.71
  throughput: 3.18 req/s
  status_counts: 200:50
POST /lobbies/{id}/start
  requests: 50 (ok: 50, fail: 0)
  error_rate: 0.00%
  response_ms: avg 179.50, p50 155.28, p95 226.21, min 123.48, max 661.08
  throughput: 3.18 req/s
  status_counts: 200:50
ws_connect
  requests: 200 (ok: 200, fail: 0)
  error_rate: 0.00%
  response_ms: avg 347.13, p50 369.81, p95 467.03, min 208.35, max 526.60
  throughput: 12.73 req/s

--- CUMULATIVE ---
ALL
  requests: 1250 (ok: 1248, fail: 2)
  error_rate: 0.16%
  response_ms: avg 503.75, p50 163.95, p95 1663.76, min 115.09, max 15478.48
  throughput: 40.08 req/s

========== LIVE KPI PROBE ==========
Scenario: p6-rooms5
API base: https://shortcut-showdown-api.onrender.com
WS url:  wss://shortcut-showdown-api.onrender.com/ws
Health requests: 200 @ concurrency 50
Workflow runs:   50 @ concurrency 5

--- PER ENDPOINT ---
GET /
  requests: 200 (ok: 200, fail: 0)
  error_rate: 0.00%
  response_ms: avg 303.20, p50 285.38, p95 713.59, min 111.67, max 738.26
  throughput: 149.63 req/s
  status_counts: 200:200
GET /game-rooms/{id}
  requests: 50 (ok: 50, fail: 0)
  error_rate: 0.00%
  response_ms: avg 188.80, p50 145.00, p95 490.87, min 114.33, max 812.34
  throughput: 0.44 req/s
  status_counts: 200:50
GET /lobbies/{id}
  requests: 50 (ok: 50, fail: 0)
  error_rate: 0.00%
  response_ms: avg 152.82, p50 143.06, p95 196.47, min 121.97, max 396.58
  throughput: 0.44 req/s
  status_counts: 200:50
PATCH /players/{id}
  requests: 300 (ok: 300, fail: 0)
  error_rate: 0.00%
  response_ms: avg 271.92, p50 152.14, p95 712.50, min 113.97, max 7509.39
  throughput: 2.62 req/s
  status_counts: 200:300
POST /game-rooms/{id}/attempts
  requests: 250 (ok: 250, fail: 0)
  error_rate: 0.00%
  response_ms: avg 378.31, p50 153.93, p95 874.48, min 115.18, max 11483.79
  throughput: 2.18 req/s
  status_counts: 200:250
POST /lobbies
  requests: 50 (ok: 50, fail: 0)
  error_rate: 0.00%
  response_ms: avg 200.11, p50 146.47, p95 682.42, min 113.69, max 960.94
  throughput: 0.44 req/s
  status_counts: 201:50
POST /lobbies/{id}/join
  requests: 250 (ok: 250, fail: 0)
  error_rate: 0.00%
  response_ms: avg 258.21, p50 150.50, p95 717.93, min 115.65, max 6430.99
  throughput: 2.18 req/s
  status_counts: 200:250
POST /lobbies/{id}/set-max-players
  requests: 50 (ok: 50, fail: 0)
  error_rate: 0.00%
  response_ms: avg 298.66, p50 154.28, p95 700.33, min 116.80, max 5034.60
  throughput: 0.44 req/s
  status_counts: 200:50
POST /lobbies/{id}/start
  requests: 50 (ok: 50, fail: 0)
  error_rate: 0.00%
  response_ms: avg 326.56, p50 148.19, p95 686.64, min 117.41, max 4941.44
  throughput: 0.44 req/s
  status_counts: 200:50
ws_connect
  requests: 300 (ok: 300, fail: 0)
  error_rate: 0.00%
  response_ms: avg 563.66, p50 411.74, p95 1655.84, min 210.21, max 5361.65
  throughput: 2.62 req/s

--- CUMULATIVE ---
ALL
  requests: 1550 (ok: 1550, fail: 0)
  error_rate: 0.00%
  response_ms: avg 341.16, p50 170.82, p95 848.75, min 111.67, max 11483.79
  throughput: 13.36 req/s

========== LIVE KPI PROBE ==========
Scenario: p6-rooms10
API base: https://shortcut-showdown-api.onrender.com
WS url:  wss://shortcut-showdown-api.onrender.com/ws
Health requests: 200 @ concurrency 50
Workflow runs:   50 @ concurrency 10

--- PER ENDPOINT ---
GET /
  requests: 200 (ok: 200, fail: 0)
  error_rate: 0.00%
  response_ms: avg 336.29, p50 294.60, p95 791.40, min 118.72, max 896.52
  throughput: 133.76 req/s
  status_counts: 200:200
GET /game-rooms/{id}
  requests: 50 (ok: 50, fail: 0)
  error_rate: 0.00%
  response_ms: avg 350.68, p50 152.44, p95 1138.39, min 123.88, max 1646.32
  throughput: 0.63 req/s
  status_counts: 200:50
GET /lobbies/{id}
  requests: 50 (ok: 50, fail: 0)
  error_rate: 0.00%
  response_ms: avg 446.90, p50 160.79, p95 1388.05, min 120.20, max 4220.23
  throughput: 0.63 req/s
  status_counts: 200:50
PATCH /players/{id}
  requests: 300 (ok: 300, fail: 0)
  error_rate: 0.00%
  response_ms: avg 411.10, p50 180.68, p95 1202.63, min 112.90, max 3127.69
  throughput: 3.78 req/s
  status_counts: 200:300
POST /game-rooms/{id}/attempts
  requests: 250 (ok: 249, fail: 1)
  error_rate: 0.40%
  response_ms: avg 533.38, p50 182.34, p95 1450.52, min 118.52, max 15594.64
  throughput: 3.15 req/s
  status_counts: 200:249
  error_samples:
    - status=None, body=<no body>
POST /lobbies
  requests: 50 (ok: 50, fail: 0)
  error_rate: 0.00%
  response_ms: avg 381.24, p50 154.10, p95 1344.73, min 118.20, max 3220.04
  throughput: 0.63 req/s
  status_counts: 201:50
POST /lobbies/{id}/join
  requests: 250 (ok: 250, fail: 0)
  error_rate: 0.00%
  response_ms: avg 343.92, p50 159.76, p95 1105.45, min 115.63, max 8216.97
  throughput: 3.15 req/s
  status_counts: 200:250
POST /lobbies/{id}/set-max-players
  requests: 50 (ok: 50, fail: 0)
  error_rate: 0.00%
  response_ms: avg 457.27, p50 171.73, p95 1301.73, min 120.15, max 4069.27
  throughput: 0.63 req/s
  status_counts: 200:50
POST /lobbies/{id}/start
  requests: 50 (ok: 50, fail: 0)
  error_rate: 0.00%
  response_ms: avg 438.46, p50 168.52, p95 1201.26, min 118.82, max 4857.77
  throughput: 0.63 req/s
  status_counts: 200:50
ws_connect
  requests: 300 (ok: 300, fail: 0)
  error_rate: 0.00%
  response_ms: avg 529.99, p50 409.31, p95 1114.62, min 209.45, max 15008.57
  throughput: 3.78 req/s

--- CUMULATIVE ---
ALL
  requests: 1550 (ok: 1549, fail: 1)
  error_rate: 0.06%
  response_ms: avg 433.96, p50 235.51, p95 1176.82, min 112.90, max 15594.64
  throughput: 19.17 req/s

========== LIVE KPI PROBE ==========
Scenario: p6-rooms20
API base: https://shortcut-showdown-api.onrender.com
WS url:  wss://shortcut-showdown-api.onrender.com/ws
Health requests: 200 @ concurrency 50
Workflow runs:   50 @ concurrency 20

--- PER ENDPOINT ---
GET /
  requests: 200 (ok: 200, fail: 0)
  error_rate: 0.00%
  response_ms: avg 1208.92, p50 683.95, p95 3424.25, min 114.36, max 8519.10
  throughput: 23.46 req/s
  status_counts: 200:200
GET /game-rooms/{id}
  requests: 37 (ok: 32, fail: 5)
  error_rate: 13.51%
  response_ms: avg 326.05, p50 161.61, p95 803.03, min 123.75, max 1059.03
  throughput: 0.27 req/s
  status_counts: 200:32, 404:5
  error_samples:
    - status=404, body={"detail":"Game room not found"}
    - status=404, body={"detail":"Game room not found"}
    - status=404, body={"detail":"Game room not found"}
GET /lobbies/{id}
  requests: 37 (ok: 32, fail: 5)
  error_rate: 13.51%
  response_ms: avg 368.72, p50 164.25, p95 801.26, min 113.12, max 1028.41
  throughput: 0.27 req/s
  status_counts: 200:32, 404:5
  error_samples:
    - status=404, body={"detail":"Lobby not found"}
    - status=404, body={"detail":"Lobby not found"}
    - status=404, body={"detail":"Lobby not found"}
PATCH /players/{id}
  requests: 234 (ok: 231, fail: 3)
  error_rate: 1.28%
  response_ms: avg 1221.81, p50 343.55, p95 7919.48, min 118.81, max 15333.75
  throughput: 1.68 req/s
  status_counts: 200:231, 404:2
  error_samples:
    - status=None, body=<no body>
    - status=404, body={"detail":"player_not_found"}
    - status=404, body={"detail":"player_not_found"}
POST /game-rooms/{id}/attempts
  requests: 160 (ok: 139, fail: 21)
  error_rate: 13.12%
  response_ms: avg 5570.90, p50 1614.44, p95 15580.36, min 111.20, max 15885.19
  throughput: 1.15 req/s
  status_counts: 200:139
  error_samples:
    - status=None, body=<no body>
    - status=None, body=<no body>
    - status=None, body=<no body>
POST /lobbies
  requests: 39 (ok: 37, fail: 2)
  error_rate: 5.13%
  response_ms: avg 1359.30, p50 632.98, p95 8364.76, min 128.71, max 9116.81
  throughput: 0.28 req/s
  status_counts: 201:37, 404:2
  error_samples:
    - status=404, body={"detail":"Unknown or disconnected player_id"}
    - status=404, body={"detail":"Unknown or disconnected player_id"}
POST /lobbies/{id}/join
  requests: 185 (ok: 160, fail: 25)
  error_rate: 13.51%
  response_ms: avg 518.55, p50 173.73, p95 1583.87, min 117.95, max 8834.20
  throughput: 1.33 req/s
  status_counts: 200:160, 404:25
  error_samples:
    - status=404, body={"detail":"Lobby not found"}
    - status=404, body={"detail":"Unknown or disconnected player_id"}
    - status=404, body={"detail":"Lobby not found"}
POST /lobbies/{id}/set-max-players
  requests: 37 (ok: 32, fail: 5)
  error_rate: 13.51%
  response_ms: avg 526.27, p50 214.63, p95 1144.10, min 125.17, max 4377.81
  throughput: 0.27 req/s
  status_counts: 200:32, 404:5
  error_samples:
    - status=404, body={"detail":"Lobby not found"}
    - status=404, body={"detail":"Lobby not found"}
    - status=404, body={"detail":"Lobby not found"}
POST /lobbies/{id}/start
  requests: 37 (ok: 32, fail: 5)
  error_rate: 13.51%
  response_ms: avg 500.39, p50 163.06, p95 1207.03, min 124.12, max 4930.38
  throughput: 0.27 req/s
  status_counts: 200:32, 404:5
  error_samples:
    - status=404, body={"detail":"Lobby not found"}
    - status=404, body={"detail":"Lobby not found"}
    - status=404, body={"detail":"Lobby not found"}
ws_connect
  requests: 272 (ok: 272, fail: 0)
  error_rate: 0.00%
  response_ms: avg 3325.83, p50 1671.10, p95 12270.14, min 234.05, max 15379.88
  throughput: 1.96 req/s

--- CUMULATIVE ---
ALL
  requests: 1238 (ok: 1167, fail: 71)
  error_rate: 5.74%
  response_ms: avg 2048.70, p50 690.82, p95 11643.94, min 111.20, max 15885.19
  throughput: 8.39 req/s
```

Observed issues:

- None in this run (all endpoints returned 2xx).

## Notes

- Increase counts for more stable percentiles, but keep concurrency modest to avoid overloading prod.
- Defaults simulate two players per lobby and five gameplay attempts with a 50 ms delay.
- In this sweep, the largest load (`p6-rooms20`) showed elevated 404s and timeouts (lobbies/rooms missing), suggesting capacity limits at that level.
- If you want to include results or rematch endpoints, extend the workflow after attempts.
