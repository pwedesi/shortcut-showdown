export { apiRequest } from "@/lib/api/client";
export {
  createLobby,
  getLobby,
  joinLobby,
  leaveLobby,
  lockLobby,
  quickPlay,
  setChallengeCount,
  setMaxPlayers,
  setRoundDuration,
  startLobby,
  unlockLobby,
} from "@/lib/api/lobbies";
export {
  acceptRematch,
  createRematch,
  declineRematch,
  getGameRoom,
  getMatchResults,
  submitGameAttempt,
} from "@/lib/api/gameRooms";
export { updatePlayerDisplayName, updatePlayerReadyStatus } from "@/lib/api/players";
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
  RematchAcceptanceResponse,
  RematchResponse,
  StartLobbyResponse,
} from "@/lib/api/types";
