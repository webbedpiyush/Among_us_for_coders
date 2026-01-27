import type { Player, GameState } from "../types";

export class Lobby {
  public code: string;
  public players: Player[] = [];
  public status: GameState["status"] = "waiting";

  constructor(code: string, hostPlayer: Player) {
    this.code = code;
    this.addPlayer(hostPlayer);
  }

  addPlayer(player: Player) {
    this.players.push(player);
  }

  removePlayer(socketId: string): Player | undefined {
    const index = this.players.findIndex((p) => p.socketId === socketId);
    if (index !== -1) {
      const removed = this.players.splice(index, 1)[0];

      // If host left, assign new host
      if (removed?.isHost && this.players.length > 0) {
        const newHost = this.players[0];
        if (newHost) {
          newHost.isHost = true;
        }
      }

      return removed;
    }
    return undefined;
  }

  getPlayer(socketId: string) {
    return this.players.find((p) => p.socketId === socketId);
  }

  get state(): GameState {
    return {
      lobbyCode: this.code,
      players: this.players,
      status: this.status,
    };
  }
}
