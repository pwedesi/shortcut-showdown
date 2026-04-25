export { apiRequest } from "@/lib/api/client";
export {
  createLobby,
  getLobby,
  joinLobby,
  leaveLobby,
  startLobby,
} from "@/lib/api/lobbies";
export { ApiError, type ApiErrorCode } from "@/lib/api/types";
export type { Lobby, LobbyStatus, StartLobbyResponse } from "@/lib/api/types";
