import { Icon } from "@iconify/react";

interface TopBarProps {
  round: number;
  category: string;
  timeLeft: number;
  aliveCount: number;
  totalPlayers: number;
}

export default function TopBar({ round, category, timeLeft, aliveCount, totalPlayers }: TopBarProps) {
  return (
    <div className="h-16 bg-[#F5DEB3] border-b-4 border-black flex items-center justify-between px-4 shadow-md z-10">
      {/* Left: Round & Category */}
      <div className="flex items-center gap-6">
        <div className="bg-white px-3 py-1 border-2 border-black font-bold text-black shadow-[2px_2px_0_rgba(0,0,0,1)]">
          ROUND {round}
        </div>
        <div className="text-black font-bold flex items-center gap-2">
          <Icon icon="lucide:code" className="text-[#4169E1]" />
          <span className="uppercase">{category}</span>
        </div>
      </div>

      {/* Center: Timer */}
      <div className={`
        text-2xl font-bold px-4 py-1 border-2 border-black shadow-[2px_2px_0_rgba(0,0,0,1)]
        ${timeLeft <= 10 ? "bg-[#ff4757] text-white animate-pulse" : "bg-white text-black"}
      `}>
        {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}
      </div>

      {/* Right: Alive Count */}
      <div className="flex items-center gap-2 bg-[#4cd137] px-3 py-1 border-2 border-black shadow-[2px_2px_0_rgba(0,0,0,1)] text-white font-bold">
        <Icon icon="lucide:users" />
        <span>{aliveCount}/{totalPlayers} ALIVE</span>
      </div>
    </div>
  );
}
