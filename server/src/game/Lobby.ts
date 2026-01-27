import type { Player, GameState } from "../types";
import type { Server } from "socket.io";

const CATEGORY_IDS = ["dsa", "oop", "security", "frontend", "backend"] as const;
type CategoryId = (typeof CATEGORY_IDS)[number];

export class Lobby {
  public code: string;
  public players: Player[] = [];
  public status: GameState["status"] = "waiting";
  public category?: string;
  public votingTimeLeft?: number;
  private categoryVotes: Map<string, CategoryId> = new Map();
  private votingTimer?: NodeJS.Timeout;
  private roleRevealTimer?: NodeJS.Timeout;

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

  startCategoryVoting(io: Server, durationSeconds = 10): boolean {
    if (this.status !== "waiting") return false;
    if (this.players.length < 3) return false;

    this.status = "voting_category";
    this.category = undefined;
    this.votingTimeLeft = durationSeconds;
    this.categoryVotes.clear();

    if (this.votingTimer) clearInterval(this.votingTimer);
    if (this.roleRevealTimer) clearTimeout(this.roleRevealTimer);

    io.to(this.code).emit("lobby_update", this.state);

    this.votingTimer = setInterval(() => {
      if (typeof this.votingTimeLeft !== "number") return;
      this.votingTimeLeft -= 1;
      io.to(this.code).emit("lobby_update", this.state);

      if (this.votingTimeLeft <= 0) {
        clearInterval(this.votingTimer);
        this.votingTimer = undefined;
        this.finalizeCategoryVoting(io);
      }
    }, 1000);

    return true;
  }

  voteCategory(socketId: string, categoryId: string): boolean {
    if (this.status !== "voting_category") return false;
    if (!CATEGORY_IDS.includes(categoryId as CategoryId)) return false;

    this.categoryVotes.set(socketId, categoryId as CategoryId);
    return true;
  }

  private finalizeCategoryVoting(io: Server) {
    this.category = this.pickWinningCategory();
    this.votingTimeLeft = undefined;

    this.assignRoles(io);
    this.status = "role_reveal";
    io.to(this.code).emit("lobby_update", this.state);

    this.roleRevealTimer = setTimeout(() => {
      this.status = "playing";
      io.to(this.code).emit("lobby_update", this.state);
    }, 3000);
  }

  private pickWinningCategory(): CategoryId {
    if (this.categoryVotes.size === 0) {
      return this.pickRandomCategory(CATEGORY_IDS);
    }

    const counts: Record<CategoryId, number> = {
      dsa: 0,
      oop: 0,
      security: 0,
      frontend: 0,
      backend: 0,
    };

    for (const vote of this.categoryVotes.values()) {
      counts[vote] += 1;
    }

    const maxVotes = Math.max(...Object.values(counts));
    const topCategories = CATEGORY_IDS.filter((id) => counts[id] === maxVotes);

    return this.pickRandomCategory(topCategories);
  }

  private pickRandomCategory(categories: readonly CategoryId[]): CategoryId {
    const index = Math.floor(Math.random() * categories.length);
    return categories[index] ?? "dsa";
  }

  private assignRoles(io: Server) {
    if (this.players.length === 0) return;

    // Reset roles in case of restart.
    for (const player of this.players) {
      player.role = undefined;
    }

    const impostorIndex = Math.floor(Math.random() * this.players.length);
    this.players.forEach((player, index) => {
      player.role = index === impostorIndex ? "impostor" : "civilian";
      io.to(player.socketId).emit("role_assigned", {
        role: player.role,
        category: this.category,
      });
    });
  }

  get state(): GameState {
    return {
      lobbyCode: this.code,
      players: this.players.map(({ role, ...rest }) => rest),
      status: this.status,
      category: this.category,
      votingTimeLeft: this.votingTimeLeft,
    };
  }
}
