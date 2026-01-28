"use client";

import { createContext, useContext, useEffect, useReducer, ReactNode } from "react";
import { useSocket } from "@/hooks/useSocket";
import { GameState, Player } from "@/types/game";
import { useRouter } from "next/navigation";

interface GameContextType {
  gameState: GameState | null;
  currentPlayer: Player | null;
  createLobby: (playerName: string) => void;
  joinLobby: (lobbyCode: string, playerName: string) => void;
  leaveLobby: () => void;
  startGame: () => void;
  voteCategory: (categoryId: string) => void;
  updateCode: (code: string) => void;
}

const GameContext = createContext<GameContextType | undefined>(undefined);

type GameAction =
  | { type: "SET_GAME_STATE"; payload: GameState }
  | { type: "SET_CURRENT_PLAYER"; payload: Player }
  | { type: "SET_CURRENT_ROLE"; payload: Player["role"] }
  | { type: "SET_CODE"; payload: string }
  | { type: "RESET_GAME" };

const initialState: { gameState: GameState | null; currentPlayer: Player | null } = {
  gameState: null,
  currentPlayer: null,
};

function gameReducer(state: typeof initialState, action: GameAction) {
  switch (action.type) {
    case "SET_GAME_STATE":
      return { ...state, gameState: action.payload };
    case "SET_CURRENT_PLAYER":
      // Preserve role if the new player object doesn't have one (because server stripped it)
      return {
        ...state,
        currentPlayer: {
          ...action.payload,
          role: action.payload.role || state.currentPlayer?.role,
        },
      };
    case "SET_CURRENT_ROLE":
      if (!state.currentPlayer) return state;
      return {
        ...state,
        currentPlayer: { ...state.currentPlayer, role: action.payload },
      };
    case "SET_CODE":
      if (!state.gameState) return state;
      return {
        ...state,
        gameState: { ...state.gameState, code: action.payload },
      };
    case "RESET_GAME":
      return initialState;
    default:
      return state;
  }
}

export function GameProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(gameReducer, initialState);
  const { socket } = useSocket();
  const router = useRouter();

  useEffect(() => {
    if (!socket) return;

    socket.on("lobby_created", (data: { lobbyCode: string; playerId: string }) => {
      console.log("Lobby created:", data);
      // We wait for lobby_update to set full state, but we can set ID here if needed
      router.push(`/lobby/${data.lobbyCode}`);
    });

    socket.on("lobby_joined", (data: { lobbyCode: string; playerId: string }) => {
      console.log("Joined lobby:", data);
      router.push(`/lobby/${data.lobbyCode}`);
    });

    socket.on("lobby_update", (gameState: GameState) => {
      console.log("Lobby update:", gameState);
      dispatch({ type: "SET_GAME_STATE", payload: gameState });
      
      // Update current player info if we have the ID but not the full object
      // This logic relies on socket.id matching player.id from server
      const myPlayer = gameState.players.find(p => p.socketId === socket.id);
      if (myPlayer) {
        dispatch({ type: "SET_CURRENT_PLAYER", payload: myPlayer });
      }
    });

    socket.on("error", (error: { message: string }) => {
      alert(`Error: ${error.message}`);
    });

    socket.on("role_assigned", (data: { role: Player["role"] }) => {
      console.log("Role assigned:", data);
      dispatch({ type: "SET_CURRENT_ROLE", payload: data.role });
    });

    socket.on("code_sync", (data: { code: string; senderId?: string }) => {
      // Ignore our own echo to avoid cursor jumps/typing flicker
      if (data.senderId && data.senderId === socket.id) return;
      dispatch({ type: "SET_CODE", payload: data.code });
    });

    return () => {
      socket.off("lobby_created");
      socket.off("lobby_joined");
      socket.off("lobby_update");
      socket.off("error");
      socket.off("role_assigned");
      socket.off("code_sync");
    };
  }, [socket, router]);

  const createLobby = (playerName: string) => {
    if (socket) {
      socket.emit("create_lobby", { playerName });
    }
  };

  const joinLobby = (lobbyCode: string, playerName: string) => {
    if (socket) {
      socket.emit("join_lobby", { lobbyCode, playerName });
    }
  };

  const leaveLobby = () => {
    if (socket) {
      socket.disconnect();
      socket.connect(); // Reconnect to get a clean state/socket ID
      dispatch({ type: "RESET_GAME" });
      router.push("/");
    }
  };

  const startGame = () => {
    if (socket) {
      socket.emit("start_game");
    }
  };

  const voteCategory = (categoryId: string) => {
    if (socket) {
      socket.emit("vote_category", { categoryId });
    }
  };

  const updateCode = (code: string) => {
    if (socket) {
      socket.emit("code_update", { code });
    }
  };

  return (
    <GameContext.Provider
      value={{
        gameState: state.gameState,
        currentPlayer: state.currentPlayer,
        createLobby,
        joinLobby,
        leaveLobby,
        startGame,
        voteCategory,
        updateCode,
      }}
    >
      {children}
    </GameContext.Provider>
  );
}

export function useGame() {
  const context = useContext(GameContext);
  if (context === undefined) {
    throw new Error("useGame must be used within a GameProvider");
  }
  return context;
}
