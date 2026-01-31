import { Server, Socket } from "socket.io";
import { gameManager } from "../game/GameManager";
import { getChallengeByCategory } from "../game/challenges";
import { runAiTests } from "../game/AiTestRunner";
import type { Player } from "../types";

export function setupSocketHandlers(io: Server, socket: Socket) {
  socket.on("create_lobby", (data: { playerName: string }) => {
    const player: Player = {
      id: socket.id, // Using socket.id as player ID for now
      name: data.playerName,
      isHost: true,
      socketId: socket.id,
    };

    const lobby = gameManager.createLobby(player);
    socket.join(lobby.code);

    socket.emit("lobby_created", {
      lobbyCode: lobby.code,
      playerId: player.id,
    });

    // Broadcast updated lobby state to all (just the host initially)
    io.to(lobby.code).emit("lobby_update", lobby.state);

    console.log(`Lobby ${lobby.code} created by ${player.name}`);
  });

  socket.on("join_lobby", (data: { lobbyCode: string; playerName: string }) => {
    const { lobbyCode, playerName } = data;
    const lobby = gameManager.getLobby(lobbyCode);

    if (!lobby) {
      socket.emit("error", { message: "Lobby not found" });
      return;
    }

    if (lobby.players.length >= 5) {
      socket.emit("error", { message: "Lobby is full" });
      return;
    }

    const player: Player = {
      id: socket.id,
      name: playerName,
      isHost: false,
      socketId: socket.id,
    };

    lobby.addPlayer(player);
    socket.join(lobbyCode);

    socket.emit("lobby_joined", {
      lobbyCode: lobby.code,
      playerId: player.id,
    });

    io.to(lobbyCode).emit("lobby_update", lobby.state);

    console.log(`${playerName} joined lobby ${lobbyCode}`);
  });

  socket.on("start_game", () => {
    const lobby = gameManager.getLobbyBySocketId(socket.id);
    if (!lobby) {
      socket.emit("error", { message: "Lobby not found" });
      return;
    }

    const player = lobby.getPlayer(socket.id);
    if (!player?.isHost) {
      socket.emit("error", { message: "Only the host can start the game" });
      return;
    }

    const started = lobby.startCategoryVoting(io);
    if (!started) {
      socket.emit("error", { message: "Unable to start game right now" });
    }
  });

  socket.on("vote_category", (data: { categoryId: string }) => {
    const lobby = gameManager.getLobbyBySocketId(socket.id);
    if (!lobby) {
      socket.emit("error", { message: "Lobby not found" });
      return;
    }

    const success = lobby.voteCategory(socket.id, data.categoryId);
    if (!success) {
      socket.emit("error", { message: "Unable to vote for category" });
    }
  });

  socket.on("code_update", (data: { code: string }) => {
    const lobby = gameManager.getLobbyBySocketId(socket.id);
    if (!lobby) {
      socket.emit("error", { message: "Lobby not found" });
      return;
    }

    lobby.updateCode(data.code);
    lobby.evaluateSabotage(io);
    io.to(lobby.code).emit("code_sync", {
      code: lobby.currentCode,
      senderId: socket.id,
    });
  });

  socket.on("chat_message", (data: { text: string }) => {
    const lobby = gameManager.getLobbyBySocketId(socket.id);
    if (!lobby) {
      socket.emit("error", { message: "Lobby not found" });
      return;
    }

    const player = lobby.getPlayer(socket.id);
    if (!player) {
      socket.emit("error", { message: "Player not found" });
      return;
    }

    const message = {
      id: `${Date.now()}-${socket.id}`,
      senderId: socket.id,
      senderName: player.name,
      text: data.text.slice(0, 300),
      isSystem: false,
    };

    io.to(lobby.code).emit("chat_message", message);
  });

  socket.on("call_meeting", () => {
    const lobby = gameManager.getLobbyBySocketId(socket.id);
    if (!lobby) {
      socket.emit("error", { message: "Lobby not found" });
      return;
    }

    const player = lobby.getPlayer(socket.id);
    if (!player) {
      socket.emit("error", { message: "Player not found" });
      return;
    }

    io.to(lobby.code).emit("meeting_called", { callerName: player.name });
  });

  socket.on("run_tests", async (data: { code: string }) => {
    const lobby = gameManager.getLobbyBySocketId(socket.id);
    if (!lobby) {
      socket.emit("error", { message: "Lobby not found" });
      return;
    }

    const challenge = getChallengeByCategory(lobby.category);
    if (!challenge) {
      socket.emit("error", { message: "Challenge not found" });
      return;
    }

    try {
      const results = await runAiTests(data.code, challenge);
      io.to(lobby.code).emit("test_results", results);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "AI test execution failed";
      console.error("AI run_tests error:", message);
      socket.emit("error", { message });
      io.to(lobby.code).emit("test_results", []);
    }
  });

  socket.on("disconnect", () => {
    const lobby = gameManager.getLobbyBySocketId(socket.id);
    if (lobby) {
      const removedPlayer = lobby.removePlayer(socket.id);

      if (lobby.players.length === 0) {
        gameManager.removeLobby(lobby.code);
        console.log(`Lobby ${lobby.code} removed (empty)`);
      } else {
        io.to(lobby.code).emit("lobby_update", lobby.state);
        if (removedPlayer) {
          console.log(`${removedPlayer.name} left lobby ${lobby.code}`);
        }
      }
    }
  });
}
