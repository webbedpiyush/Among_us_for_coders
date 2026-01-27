"use client";

import { Icon } from "@iconify/react";
import { useState } from "react";

interface Player {
  id: string;
  name: string;
  isHost: boolean;
  color?: string; // e.g. "red", "blue", "green", "orange"
}

interface LobbyProps {
  lobbyCode: string;
  players: Player[];
  currentPlayerId: string;
  onStartGame?: () => void;
}

export default function Lobby({ lobbyCode, players, currentPlayerId, onStartGame }: LobbyProps) {
  const [copied, setCopied] = useState(false);
  const currentPlayer = players.find(p => p.id === currentPlayerId);
  const isHost = currentPlayer?.isHost || false;
  const canStart = players.length >= 3;

  const copyCode = () => {
    navigator.clipboard.writeText(lobbyCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getPlayerColor = (index: number) => {
    const colors = ["bg-red-500", "bg-blue-500", "bg-green-500", "bg-orange-500", "bg-purple-500"];
    return colors[index % colors.length];
  };

  return (
    <div className="flex flex-col items-center min-h-screen bg-[#87CEEB] pt-20 font-mono relative overflow-hidden">
      
      {/* Clouds */}
      <div className="absolute top-10 left-10 text-white/80 animate-pulse">
        <Icon icon="bi:cloud-fill" width="64" />
      </div>
      <div className="absolute top-24 right-20 text-white/80 animate-bounce delay-1000">
        <Icon icon="bi:cloud-fill" width="56" />
      </div>

      <div className="z-10 text-center mb-8">
        <h1 className="text-4xl text-[#FFD700] font-bold drop-shadow-[3px_3px_0_rgba(0,0,0,1)] tracking-widest mb-4"
            style={{ textShadow: "3px 3px 0 #000, -1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000, 1px 1px 0 #000" }}>
          LOBBY
        </h1>

        {/* Lobby Code Card */}
        <div className="bg-[#F5DEB3] p-4 border-4 border-black shadow-[6px_6px_0_rgba(0,0,0,0.5)] flex flex-col items-center gap-2">
          <span className="text-black font-bold text-sm uppercase">Lobby Code:</span>
          <div className="flex items-center gap-2">
            <span className="text-3xl font-bold text-black tracking-wider">{lobbyCode}</span>
            <button 
              onClick={copyCode}
              className="p-1 hover:bg-black/10 rounded transition-colors"
              title="Copy Code"
            >
              <Icon icon={copied ? "lucide:check" : "lucide:copy"} width="24" className="text-black" />
            </button>
          </div>
        </div>
      </div>

      {/* Players List Container */}
      <div className="bg-[#F5DEB3] p-6 border-4 border-black shadow-[8px_8px_0_rgba(0,0,0,0.5)] w-full max-w-md mx-4">
        <div className="flex justify-between items-center mb-4 border-b-4 border-black/20 pb-2">
          <span className="font-bold text-black text-xl">
            <Icon icon="lucide:users" className="inline mr-2 mb-1" />
            Players ({players.length}/5)
          </span>
        </div>

        <div className="flex flex-col gap-3 min-h-[300px]">
          {players.map((player, index) => (
            <div 
              key={player.id} 
              className="bg-[#FFF8DC] border-2 border-black p-3 flex items-center justify-between shadow-[2px_2px_0_rgba(0,0,0,0.2)]"
            >
              <div className="flex items-center gap-3">
                <div className={`w-8 h-8 ${getPlayerColor(index)} border-2 border-black`}></div>
                <span className="font-bold text-lg text-black">
                  {player.name} {player.id === currentPlayerId && "(You)"}
                </span>
              </div>
              {player.isHost && (
                <Icon icon="lucide:crown" className="text-[#FFD700] drop-shadow-sm" width="24" />
              )}
            </div>
          ))}

          {players.length < 5 && Array.from({ length: 5 - players.length }).map((_, i) => (
            <div 
              key={`empty-${i}`} 
              className="border-2 border-dashed border-black/30 p-3 flex items-center justify-center text-black/40 font-bold"
            >
              Waiting for player...
            </div>
          ))}
        </div>

        <div className="mt-6 text-center">
          {isHost ? (
            <button 
              onClick={onStartGame}
              disabled={!canStart}
              className="w-full bg-[#4cd137] hover:bg-[#44bd32] disabled:bg-gray-400 disabled:cursor-not-allowed text-white text-xl font-bold py-4 px-8 border-4 border-black shadow-[4px_4px_0_rgba(0,0,0,1)] active:translate-y-1 active:shadow-none transition-all uppercase"
            >
              {canStart ? "READY!" : "Need 3+ Players"}
            </button>
          ) : (
            <div className="text-black font-bold animate-pulse">
              Waiting for host to start...
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
