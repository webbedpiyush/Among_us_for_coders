import type { Player, GameState } from "../types";
import { getChallengeByCategory } from "./challenges";
import type { SabotageTask } from "./challenges";
import type { Server } from "socket.io";

const CATEGORY_IDS = ["dsa", "oop", "security", "frontend", "backend"] as const;
type CategoryId = (typeof CATEGORY_IDS)[number];

export class Lobby {
  public code: string;
  public players: Player[] = [];
  public status: GameState["status"] = "waiting";
  public category?: string;
  public votingTimeLeft?: number;
  public currentCode: string = ""; // Store current code
  private impostorSocketId?: string;
  private sabotageTasks: Array<SabotageTask & { completed: boolean }> = [];
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

    // Set starter code based on category
    this.currentCode = this.getStarterCode(this.category as CategoryId);
    this.prepareSabotageTasks();

    this.assignRoles(io);
    this.status = "role_reveal";
    io.to(this.code).emit("lobby_update", this.state);

    this.roleRevealTimer = setTimeout(() => {
      this.status = "playing";
      io.to(this.code).emit("lobby_update", this.state);
    }, 5000);
  }

  updateCode(newCode: string) {
    this.currentCode = newCode;
  }

  private prepareSabotageTasks() {
    const challenge = getChallengeByCategory(this.category);
    this.sabotageTasks = (challenge?.sabotageTasks || []).map((task) => ({
      ...task,
      completed: false,
    }));
  }

  evaluateSabotage(io: Server) {
    if (!this.impostorSocketId || this.sabotageTasks.length === 0) return;
    let changed = false;

    for (const task of this.sabotageTasks) {
      if (task.completed) continue;
      const regex = new RegExp(task.pattern, "m");
      if (regex.test(this.currentCode)) {
        task.completed = true;
        changed = true;
      }
    }

    if (changed) {
      io.to(this.impostorSocketId).emit("sabotage_update", {
        tasks: this.sabotageTasks.map(({ id, description, completed }) => ({
          id,
          description,
          completed,
        })),
      });
    }
  }

  private getStarterCode(category: CategoryId): string {
    const STARTER_CODES: Record<CategoryId, string> = {
      dsa: `# Binary Search Implementation
# TODO: Implement binary search to find target in sorted_list

def binary_search(sorted_list, target):
    left = 0
    right = len(sorted_list) - 1
    
    # Write your logic here
    
    return -1
`,
      oop: `# Design a Vending Machine Class
# TODO: Implement methods to manage inventory and process payments

class VendingMachine:
    def __init__(self):
        self.inventory = {}
        self.balance = 0.0

    def add_item(self, item_name, price, quantity):
        pass

    def purchase(self, item_name, money_inserted):
        pass
`,
      security: `# SQL Injection Prevention
# TODO: Secure this login function against SQL injection

def login_user(username, password, db_connection):
    cursor = db_connection.cursor()
    
    # VULNERABLE CODE - FIX THIS:
    query = f"SELECT * FROM users WHERE username = '{username}' AND password = '{password}'"
    
    cursor.execute(query)
    user = cursor.fetchone()
    return user
`,
      frontend: `// React Counter Component
// TODO: Implement a counter with increment, decrement and reset

import React, { useState } from 'react';

export default function Counter() {
    const [count, setCount] = useState(0);

    return (
        <div>
            <h1>Count: {count}</h1>
            {/* Add buttons here */}
        </div>
    );
}
`,
      backend: `# Express.js API Endpoint
# TODO: Create a POST endpoint to register a user with validation

from flask import Flask, request, jsonify

app = Flask(__name__)
users = []

@app.route('/register', methods=['POST'])
def register():
    data = request.json
    # Add validation and user creation logic here
    
    return jsonify({"message": "User registered"}), 201
`,
    };

    return STARTER_CODES[category] || "# Write your code here\n";
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
      if (player.role === "impostor") {
        this.impostorSocketId = player.socketId;
      }
      io.to(player.socketId).emit("role_assigned", {
        role: player.role,
        category: this.category,
      });
    });

    if (this.impostorSocketId) {
      io.to(this.impostorSocketId).emit("sabotage_tasks", {
        tasks: this.sabotageTasks.map(({ id, description, completed }) => ({
          id,
          description,
          completed,
        })),
      });
    }
  }

  get state(): GameState {
    return {
      lobbyCode: this.code,
      players: this.players.map(({ role, ...rest }) => rest),
      status: this.status,
      category: this.category,
      votingTimeLeft: this.votingTimeLeft,
      code: this.currentCode,
    };
  }
}
