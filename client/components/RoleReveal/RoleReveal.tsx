"use client";

import { Icon } from "@iconify/react";

interface RoleRevealProps {
  role: "civilian" | "impostor";
  category?: string;
}

const ROLE_STYLES = {
  civilian: {
    label: "CIVILIAN",
    color: "text-[#4cd137]",
    border: "border-[#4cd137]",
    glow: "shadow-[0_0_20px_rgba(76,209,55,0.8)]",
  },
  impostor: {
    label: "IMPOSTOR",
    color: "text-[#ff4757]",
    border: "border-[#ff4757]",
    glow: "shadow-[0_0_20px_rgba(255,71,87,0.8)]",
  },
} as const;

export default function RoleReveal({ role, category }: RoleRevealProps) {
  const style = ROLE_STYLES[role];

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-[#87CEEB] relative overflow-hidden font-mono">
      <div className="absolute top-16 left-20 text-white/80 animate-pulse">
        <Icon icon="bi:cloud-fill" width="64" />
      </div>
      <div className="absolute top-36 right-24 text-white/80 animate-bounce delay-700">
        <Icon icon="bi:cloud-fill" width="48" />
      </div>

      <div
        className={`z-10 bg-[#F5DEB3] px-10 py-8 border-4 ${style.border} ${style.glow} text-center`}>
        <p className="text-xl text-black font-bold mb-2">YOUR ROLE</p>
        <h1 className={`text-5xl font-bold tracking-widest ${style.color}`}>
          {style.label}
        </h1>
        {category && (
          <p className="mt-4 text-black font-bold">
            Category: <span className="uppercase">{category}</span>
          </p>
        )}
        <p className="mt-6 text-black font-bold animate-pulse">
          Prepare for the round...
        </p>
      </div>
    </div>
  );
}
