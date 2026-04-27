export { apiRequest } from "@/lib/api/client";
export {
  createLobby,
  getLobby,
  joinLobby,
  leaveLobby,
  startLobby,
} from "@/lib/api/lobbies";
export {
  createRematch,
  getGameRoom,
  getMatchResults,
  submitGameAttempt,
} from "@/lib/api/gameRooms";
export { ApiError, type ApiErrorCode } from "@/lib/api/types";
export type {
  AttemptRequest,
  AttemptResponse,
  GameRoomView,
  GameStateView,
  Lobby,
  LobbyRosterPlayer,
  LobbyStatus,
  MatchPlacementView,
  MatchResultsView,
  PublicChallenge,
  RematchResponse,
  StartLobbyResponse,
} from "@/lib/api/types";
