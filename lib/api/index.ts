export { apiRequest } from "@/lib/api/client";
export {
  createLobby,
  getLobby,
  joinLobby,
  leaveLobby,
  startLobby,
} from "@/lib/api/lobbies";
export { getGameRoom, submitGameAttempt } from "@/lib/api/gameRooms";
export { ApiError, type ApiErrorCode } from "@/lib/api/types";
export type {
  AttemptRequest,
  AttemptResponse,
  GameRoomView,
  GameStateView,
  Lobby,
  LobbyRosterPlayer,
  LobbyStatus,
  PublicChallenge,
  StartLobbyResponse,
} from "@/lib/api/types";
