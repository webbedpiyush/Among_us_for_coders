"use client";

import {
  createContext,
  useContext,
  useEffect,
  useReducer,
  ReactNode,
} from "react";
import { useSocket } from "@/hooks/useSocket";
import { GameState, Player } from "@/types/game";
import { useRouter } from "next/navigation";

interface GameContextType {
  gameState: GameState | null;
  currentPlayer: Player | null;
  chatMessages: ChatMessage[];
  testResults: TestResult[];
  isTesting: boolean;
  sabotageTasks: SabotageTask[];
  meetingActive: boolean;
  meetingCallerName: string | null;
  createLobby: (playerName: string) => void;
  joinLobby: (lobbyCode: string, playerName: string) => void;
  leaveLobby: () => void;
  startGame: () => void;
  voteCategory: (categoryId: string) => void;
  updateCode: (code: string) => void;
  sendChatMessage: (text: string) => void;
  runTests: (code: string) => void;
  callMeeting: () => void;
  dismissMeeting: () => void;
}

const GameContext = createContext<GameContextType | undefined>(undefined);

export interface ChatMessage {
  id: string;
  senderId?: string;
  senderName: string;
  text: string;
  isSystem?: boolean;
}

export interface TestResult {
  name: string;
  passed: boolean;
  output?: string;
  error?: string;
}

export interface SabotageTask {
  id: string;
  description: string;
  completed: boolean;
}

type GameAction =
  | { type: "SET_GAME_STATE"; payload: GameState }
  | { type: "SET_CURRENT_PLAYER"; payload: Player }
  | { type: "SET_CURRENT_ROLE"; payload: Player["role"] }
  | { type: "SET_CODE"; payload: string }
  | { type: "ADD_CHAT_MESSAGE"; payload: ChatMessage }
  | { type: "SET_TEST_RESULTS"; payload: TestResult[] }
  | { type: "SET_TESTING"; payload: boolean }
  | { type: "SET_SABOTAGE_TASKS"; payload: SabotageTask[] }
  | {
      type: "SET_MEETING";
      payload: { active: boolean; callerName: string | null };
    }
  | { type: "RESET_GAME" };

const initialState: {
  gameState: GameState | null;
  currentPlayer: Player | null;
  chatMessages: ChatMessage[];
  testResults: TestResult[];
  isTesting: boolean;
  sabotageTasks: SabotageTask[];
  meetingActive: boolean;
  meetingCallerName: string | null;
} = {
  gameState: null,
  currentPlayer: null,
  chatMessages: [],
  testResults: [],
  isTesting: false,
  sabotageTasks: [],
  meetingActive: false,
  meetingCallerName: null,
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
    case "ADD_CHAT_MESSAGE":
      return {
        ...state,
        chatMessages: [...state.chatMessages, action.payload],
      };
    case "SET_TEST_RESULTS":
      return { ...state, testResults: action.payload, isTesting: false };
    case "SET_TESTING":
      return { ...state, isTesting: action.payload };
    case "SET_SABOTAGE_TASKS":
      return { ...state, sabotageTasks: action.payload };
    case "SET_MEETING":
      return {
        ...state,
        meetingActive: action.payload.active,
        meetingCallerName: action.payload.callerName,
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

    socket.on(
      "lobby_created",
      (data: { lobbyCode: string; playerId: string }) => {
        console.log("Lobby created:", data);
        // We wait for lobby_update to set full state, but we can set ID here if needed
        router.push(`/lobby/${data.lobbyCode}`);
      },
    );

    socket.on(
      "lobby_joined",
      (data: { lobbyCode: string; playerId: string }) => {
        console.log("Joined lobby:", data);
        router.push(`/lobby/${data.lobbyCode}`);
      },
    );

    socket.on("lobby_update", (gameState: GameState) => {
      console.log("Lobby update:", gameState);
      dispatch({ type: "SET_GAME_STATE", payload: gameState });

      // Update current player info if we have the ID but not the full object
      // This logic relies on socket.id matching player.id from server
      const myPlayer = gameState.players.find((p) => p.socketId === socket.id);
      if (myPlayer) {
        dispatch({ type: "SET_CURRENT_PLAYER", payload: myPlayer });
      }
    });

    socket.on("error", (error: { message: string }) => {
      dispatch({ type: "SET_TESTING", payload: false });
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

    socket.on("chat_message", (data: ChatMessage) => {
      dispatch({ type: "ADD_CHAT_MESSAGE", payload: data });
    });

    socket.on("test_results", (data: TestResult[]) => {
      dispatch({ type: "SET_TEST_RESULTS", payload: data });
    });

    socket.on("sabotage_tasks", (data: { tasks: SabotageTask[] }) => {
      dispatch({ type: "SET_SABOTAGE_TASKS", payload: data.tasks });
    });

    socket.on("sabotage_update", (data: { tasks: SabotageTask[] }) => {
      dispatch({ type: "SET_SABOTAGE_TASKS", payload: data.tasks });
    });

    socket.on("meeting_called", (data: { callerName: string }) => {
      dispatch({
        type: "SET_MEETING",
        payload: { active: true, callerName: data.callerName },
      });
    });

    return () => {
      socket.off("lobby_created");
      socket.off("lobby_joined");
      socket.off("lobby_update");
      socket.off("error");
      socket.off("role_assigned");
      socket.off("code_sync");
      socket.off("chat_message");
      socket.off("test_results");
      socket.off("sabotage_tasks");
      socket.off("sabotage_update");
      socket.off("meeting_called");
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

  const sendChatMessage = (text: string) => {
    if (socket) {
      socket.emit("chat_message", { text });
    }
  };

  const runTests = (code: string) => {
    if (socket) {
      dispatch({ type: "SET_TESTING", payload: true });
      socket.emit("run_tests", { code });
    }
  };

  const callMeeting = () => {
    if (socket) {
      socket.emit("call_meeting");
    }
  };

  const dismissMeeting = () => {
    dispatch({
      type: "SET_MEETING",
      payload: { active: false, callerName: null },
    });
  };

  return (
    <GameContext.Provider
      value={{
        gameState: state.gameState,
        currentPlayer: state.currentPlayer,
        chatMessages: state.chatMessages,
        testResults: state.testResults,
        isTesting: state.isTesting,
        sabotageTasks: state.sabotageTasks,
        meetingActive: state.meetingActive,
        meetingCallerName: state.meetingCallerName,
        createLobby,
        joinLobby,
        leaveLobby,
        startGame,
        voteCategory,
        updateCode,
        sendChatMessage,
        runTests,
        callMeeting,
        dismissMeeting,
      }}>
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
