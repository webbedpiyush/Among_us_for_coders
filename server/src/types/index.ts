export interface Player {
  id: string;
  name: string;
  isHost: boolean;
  socketId: string;
  role?: "civilian" | "impostor";
}

export interface GameState {
  lobbyCode: string;
  players: Player[];
  status:
    | "waiting"
    | "voting_category"
    | "role_reveal"
    | "playing"
    | "voting_impostor"
    | "game_over";
  category?: string;
  votingTimeLeft?: number;
  impostorId?: string;
}
