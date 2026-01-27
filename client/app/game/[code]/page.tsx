"use client";

import { useEffect, use, useState } from "react";
import { useRouter } from "next/navigation";
import CategoryVoting from "@/components/CategoryVoting/CategoryVoting";
import RoleReveal from "@/components/RoleReveal/RoleReveal";
import { useGame } from "@/context/GameContext";

export default function GamePage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = use(params);
  const { gameState, currentPlayer, voteCategory } = useGame();
  const router = useRouter();
  const [showRoleReveal, setShowRoleReveal] = useState(false);

  useEffect(() => {
    if (!gameState) {
      router.replace("/");
    }
  }, [gameState, router]);

  useEffect(() => {
    // Only show role reveal if we are in the correct state AND we have the role
    if (gameState?.status === "role_reveal" && currentPlayer?.role) {
      setShowRoleReveal(true);
      const timer = setTimeout(() => setShowRoleReveal(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [gameState?.status, currentPlayer?.role]);

  if (!gameState || !currentPlayer) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#87CEEB]">
        <div className="text-white text-2xl font-bold animate-bounce">Loading...</div>
      </div>
    );
  }

  if (gameState.status === "voting_category") {
    return (
      <CategoryVoting
        timeLeft={gameState.votingTimeLeft ?? 0}
        onVote={voteCategory}
      />
    );
  }

  if (showRoleReveal && currentPlayer.role) {
    return <RoleReveal role={currentPlayer.role} category={gameState.category} />;
  }

  if (gameState.status === "role_reveal") {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#87CEEB]">
        <div className="text-white text-2xl font-bold animate-bounce">Revealing role...</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-[#87CEEB] font-mono">
      <h1 className="text-3xl text-white font-bold">Game Starting...</h1>
      <p className="mt-4 text-white">
        Lobby {code} • Category: {gameState.category?.toUpperCase() || "TBD"}
      </p>
    </div>
  );
}
