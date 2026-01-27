import { Server, Socket } from "socket.io";
import { gameManager } from "../game/GameManager";
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
