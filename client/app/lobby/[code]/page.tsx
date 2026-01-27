"use client";

import { useEffect, use } from "react";
import Lobby from "@/components/Lobby/Lobby";
import { useGame } from "@/context/GameContext";
import { useRouter } from "next/navigation";

export default function LobbyPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = use(params);
  const { gameState, currentPlayer, startGame } = useGame();
  const router = useRouter();

  useEffect(() => {
    // If we're here but have no game state (e.g. refreshed), redirect to home
    // In a real app, we might try to rejoin or fetch lobby state from API
    if (!gameState) {
      router.replace("/");
    }
  }, [gameState, router]);

  useEffect(() => {
    if (gameState && gameState.status !== "waiting") {
      router.replace(`/game/${code}`);
    }
  }, [gameState, router, code]);

  if (!gameState || !currentPlayer) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#87CEEB]">
        <div className="text-white text-2xl font-bold animate-bounce">Loading...</div>
      </div>
    );
  }

  return (
    <Lobby
      lobbyCode={code}
      players={gameState.players}
      currentPlayerId={currentPlayer.id}
      onStartGame={startGame}
    />
  );
}
