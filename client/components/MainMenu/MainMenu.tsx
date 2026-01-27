"use client";

import { useState } from "react";
import { Icon } from "@iconify/react";
import { useSocket } from "@/hooks/useSocket";
import { useRouter } from "next/navigation";

export default function MainMenu() {
  const [view, setView] = useState<"menu" | "create" | "join">("menu");
  const [playerName, setPlayerName] = useState("");
  const [lobbyCode, setLobbyCode] = useState("");
  const { socket } = useSocket();
  const router = useRouter();

  const handleCreateGame = () => {
    if (!playerName.trim() || !socket) return;
    
    socket.emit("create_lobby", { playerName });
    // Note: We'll listen for 'lobby_created' event in a global listener or here
    // For now, let's assume we'll redirect after event
  };

  const handleJoinGame = () => {
    if (!playerName.trim() || !lobbyCode.trim() || !socket) return;

    socket.emit("join_lobby", { lobbyCode, playerName });
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-[#87CEEB] relative overflow-hidden font-mono">
      {/* Background Clouds (Pixel Art Style) */}
      <div className="absolute top-20 left-20 text-white/80 animate-pulse">
        <Icon icon="bi:cloud-fill" width="64" />
      </div>
      <div className="absolute top-40 right-40 text-white/80 animate-bounce delay-700">
        <Icon icon="bi:cloud-fill" width="48" />
      </div>

      {/* Main Title */}
      <div className="z-10 text-center mb-12">
        <h1 className="text-6xl md:text-8xl font-bold text-[#FFD700] drop-shadow-[4px_4px_0_rgba(0,0,0,1)] tracking-widest"
            style={{ textShadow: "4px 4px 0 #000, -2px -2px 0 #000, 2px -2px 0 #000, -2px 2px 0 #000, 2px 2px 0 #000" }}>
          CODE
          <br />
          MAFIA
        </h1>
        <p className="text-xl md:text-2xl text-white font-bold mt-4 drop-shadow-[2px_2px_0_rgba(0,0,0,0.8)]">
          Sabotage or Survive
        </p>
      </div>

      {/* Menu Container */}
      <div className="z-10 bg-[#F5DEB3] p-8 border-4 border-black shadow-[8px_8px_0_rgba(0,0,0,0.5)] max-w-md w-full mx-4">
        
        {view === "menu" && (
          <div className="flex flex-col gap-4">
            <button 
              onClick={() => setView("create")}
              className="bg-[#FFA500] hover:bg-[#FF8C00] text-white text-2xl font-bold py-4 px-8 border-4 border-black shadow-[4px_4px_0_rgba(0,0,0,1)] active:translate-y-1 active:shadow-none transition-all"
            >
              CREATE GAME
            </button>
            
            <div className="flex flex-col gap-2">
              <input 
                type="text" 
                placeholder="LOBBY ID" 
                value={lobbyCode}
                onChange={(e) => setLobbyCode(e.target.value.toUpperCase())}
                className="bg-white text-black text-xl p-3 border-4 border-black font-bold uppercase text-center focus:outline-none focus:border-[#4169E1]"
                maxLength={6}
              />
              <button 
                onClick={() => setView("join")}
                disabled={!lobbyCode}
                className="bg-[#4169E1] hover:bg-[#3742fa] disabled:opacity-50 text-white text-xl font-bold py-3 px-8 border-4 border-black shadow-[4px_4px_0_rgba(0,0,0,1)] active:translate-y-1 active:shadow-none transition-all"
              >
                JOIN
              </button>
            </div>
          </div>
        )}

        {(view === "create" || view === "join") && (
          <div className="flex flex-col gap-4">
            <h2 className="text-2xl font-bold text-black text-center mb-2">
              Enter your name:
            </h2>
            <input 
              type="text" 
              placeholder="player name..." 
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              className="bg-white text-black text-xl p-3 border-4 border-black font-bold text-center focus:outline-none focus:border-[#FFA500]"
              maxLength={12}
              autoFocus
            />
            
            <div className="flex gap-4 mt-4">
              <button 
                onClick={() => setView("menu")}
                className="flex-1 bg-[#dcdde1] hover:bg-[#c3c4c8] text-black text-lg font-bold py-3 border-4 border-black shadow-[4px_4px_0_rgba(0,0,0,1)] active:translate-y-1 active:shadow-none transition-all"
              >
                BACK
              </button>
              <button 
                onClick={view === "create" ? handleCreateGame : handleJoinGame}
                disabled={!playerName.trim()}
                className="flex-1 bg-[#FFA500] hover:bg-[#FF8C00] disabled:opacity-50 text-white text-lg font-bold py-3 border-4 border-black shadow-[4px_4px_0_rgba(0,0,0,1)] active:translate-y-1 active:shadow-none transition-all"
              >
                {view === "create" ? "CREATE" : "JOIN"}
              </button>
            </div>
          </div>
        )}

      </div>

      <div className="absolute bottom-8 text-white font-bold drop-shadow-[2px_2px_0_rgba(0,0,0,0.8)]">
        3-5 Players • Find the Impostor
      </div>
    </div>
  );
}
