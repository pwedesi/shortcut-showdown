/** Normalized client error for UI (stable `code`). */
export type ApiErrorCode =
  | "bad_request"
  | "not_found"
  | "conflict"
  | "network"
  | "invalid_response"
  | "unknown";

export class ApiError extends Error {
  readonly code: ApiErrorCode;
  readonly status?: number;
  readonly detail?: unknown;

  constructor(
    message: string,
    options: {
      code: ApiErrorCode;
      status?: number;
      detail?: unknown;
      cause?: unknown;
    },
  ) {
    super(message, { cause: options.cause });
    this.name = "ApiError";
    this.code = options.code;
    this.status = options.status;
    this.detail = options.detail;
  }
}

export type LobbyStatus = string;

/** One entry in `Lobby.players` after normalization. */
export type LobbyRosterPlayer = {
  player_id: string;
  display_name?: string;
  /** When true, this player may start the match (from API roster). */
  is_leader?: boolean;
  /** When true, this player has marked themselves as ready. */
  is_ready?: boolean;
};

/** Server lobby shape (minimal contract for Phase 1). */
export type Lobby = {
  id: string;
  /**
   * Roster normalized from HTTP (`string | LobbyRosterPlayer`-like objects).
   */
  players: LobbyRosterPlayer[];
  status: LobbyStatus;
  /** Optional short code for share links when API provides it. */
  code?: string;
  /** Optional cap for UI (e.g. max players). */
  max_players?: number;
  /** When set, this player may start the match (overrides first-in-list fallback). */
  leader_player_id?: string;
  /** Alias some APIs use for the lobby creator / host. */
  host_player_id?: string;
  /** Match settings from GET/POST lobby responses. */
  challenge_count?: number;
  round_duration_seconds?: number;
  max_attempts_per_second?: number;
  /**
   * Set once a match is created from this lobby; non-leader clients use this
   * (with GET /lobbies polling) to follow the host into `/gameplay`.
   */
  game_room_id?: string;
};

/** Public challenge (no answer keys) — see backend GameStateView. */
export type PublicChallenge = {
  index: number;
  prompt: string;
};

/** Per-player telemetry in game_state.players */
export type PlayerGameProgress = {
  objective_index: number;
  progress_percent: number;
  wpm: number;
  accuracy: number;
  streak: number;
  attempts_total: number;
  attempts_correct: number;
  finished: boolean;
  finished_at: number | null;
};

/** Authoritative `status` string from the API. */
export type GameSessionStatus = "pending" | "running" | "finished" | string;

export type GameStateView = {
  status: GameSessionStatus;
  state_version: number;
  server_time: number;
  round_started_at: number;
  round_ends_at: number;
  objective_count: number;
  challenges: PublicChallenge[];
  players: Record<string, PlayerGameProgress>;
  finished: boolean;
  winner_player_id: string | null;
  draw: boolean;
  end_reason: string | null;
  finished_at: number | null;
};

/** `POST /lobbies/{id}/start` returns the same shape as `GET /game-rooms/{id}`. */
export type GameRoomView = {
  id: string;
  players: string[];
  locked: boolean;
  game_state: GameStateView;
  /** Legacy alias; not sent by current FastAPI. */
  room_id?: string;
  game_room_id?: string;
};

export type StartLobbyResponse = GameRoomView;

export type AttemptRequest = {
  player_id: string;
  objective_index: number;
  keys: string[];
  attempt_id?: string;
};

export type AttemptResponse = {
  room_id: string;
  player_id: string;
  accepted: boolean;
  reason: string | null;
  correct: boolean | null;
  objective_index: number;
  state_version: number;
  game_state: GameStateView;
};

/** Serialized `GameEndReason` from the API. */
export type GameEndReason = "time" | "goal" | "forfeit" | string;

/** One row on the match podium (`GET /game-rooms/{id}/results`). */
export type MatchPlacementView = {
  player_id: string;
  display_name: string;
  place: number;
  objective_index: number;
  progress_percent: number;
  wpm: number;
  accuracy: number;
  streak: number;
  attempts_total: number;
  attempts_correct: number;
  finished: boolean;
  finished_at: number | null;
};

export type MatchResultsView = {
  room_id: string;
  you_player_id: string | null;
  placements: MatchPlacementView[];
  winner_player_id: string | null;
  draw: boolean;
  end_reason: GameEndReason | null;
  ended_at: number | null;
  finished: boolean;
};

export type RematchResponse = {
  room_id: string;
  next_lobby_id: string;
};
