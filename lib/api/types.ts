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

/** Server lobby shape (minimal contract for Phase 1). */
export type Lobby = {
  id: string;
  /** Player ids from server (opaque strings). */
  players: string[];
  status: LobbyStatus;
  /** Optional short code for share links when API provides it. */
  code?: string;
  /** Optional cap for UI (e.g. max players). */
  max_players?: number;
};

export type StartLobbyResponse = {
  /** Game room id for Phase 2 navigation. */
  room_id?: string;
  game_room_id?: string;
  [key: string]: unknown;
};
