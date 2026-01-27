export interface Player {
  id: string;
  name: string;
  isHost: boolean;
  socketId: string;
}

export interface GameState {
  lobbyCode: string;
  players: Player[];
  status: "waiting" | "voting_category" | "playing" | "voting_impostor" | "game_over";
  category?: string;
  impostorId?: string;
  // We'll add more fields later (timers, tasks, etc.)
}
