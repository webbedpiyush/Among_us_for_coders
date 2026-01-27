import { Lobby } from "./Lobby";
import type { Player } from "../types";

export class GameManager {
  private lobbies: Map<string, Lobby> = new Map();

  createLobby(hostPlayer: Player): Lobby {
    let code = this.generateCode();
    // Ensure code uniqueness
    while (this.lobbies.has(code)) {
      code = this.generateCode();
    }

    const lobby = new Lobby(code, hostPlayer);
    this.lobbies.set(code, lobby);
    return lobby;
  }

  joinLobby(code: string, player: Player): Lobby | null {
    const lobby = this.lobbies.get(code);
    if (!lobby) return null;

    // Check if player already exists (reconnection logic can be added here)
    // For now, simple add
    lobby.addPlayer(player);
    return lobby;
  }

  getLobby(code: string): Lobby | undefined {
    return this.lobbies.get(code);
  }

  getLobbyBySocketId(socketId: string): Lobby | undefined {
    for (const lobby of this.lobbies.values()) {
      if (lobby.players.some((p) => p.socketId === socketId)) {
        return lobby;
      }
    }
    return undefined;
  }

  removeLobby(code: string) {
    this.lobbies.delete(code);
  }

  private generateCode(length = 6): string {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // Removed similar looking chars (I, 1, O, 0)
    let result = "";
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }
}

export const gameManager = new GameManager();
