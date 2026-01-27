"use client";

import { Icon } from "@iconify/react";
import { useState } from "react";

const CATEGORIES = [
  { id: "dsa", label: "Data Structures & Algorithms" },
  { id: "oop", label: "Object-Oriented Programming" },
  { id: "security", label: "Security" },
  { id: "frontend", label: "Front-End" },
  { id: "backend", label: "Back-End" },
];

interface CategoryVotingProps {
  timeLeft: number;
  onVote: (categoryId: string) => void;
}

export default function CategoryVoting({ timeLeft, onVote }: CategoryVotingProps) {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const handleVote = (categoryId: string) => {
    setSelectedCategory(categoryId);
    onVote(categoryId);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-[#87CEEB] relative overflow-hidden font-mono">
      {/* Clouds */}
      <div className="absolute top-20 left-20 text-white/80 animate-pulse">
        <Icon icon="bi:cloud-fill" width="64" />
      </div>
      <div className="absolute top-40 right-40 text-white/80 animate-bounce delay-700">
        <Icon icon="bi:cloud-fill" width="48" />
      </div>

      <div className="z-10 text-center w-full max-w-4xl px-4">
        <h1 className="text-4xl text-[#FFD700] font-bold drop-shadow-[3px_3px_0_rgba(0,0,0,1)] tracking-widest mb-8"
            style={{ textShadow: "3px 3px 0 #000, -1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000, 1px 1px 0 #000" }}>
          VOTE CATEGORY
        </h1>

        {/* Timer */}
        <div className="bg-[#F5DEB3] w-20 h-20 mx-auto mb-8 border-4 border-black shadow-[4px_4px_0_rgba(0,0,0,0.5)] flex items-center justify-center">
          <span className="text-4xl font-bold text-black">{timeLeft}s</span>
        </div>

        {/* Categories Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {CATEGORIES.map((category) => (
            <button
              key={category.id}
              onClick={() => handleVote(category.id)}
              className={`
                p-6 text-xl font-bold border-4 border-black shadow-[4px_4px_0_rgba(0,0,0,1)]
                transition-all active:translate-y-1 active:shadow-none
                ${selectedCategory === category.id 
                  ? "bg-[#4cd137] text-white" 
                  : "bg-[#FFF8DC] text-black hover:bg-[#FFE4B5]"}
              `}
            >
              {category.label}
            </button>
          ))}
        </div>

        <p className="text-white text-lg font-bold drop-shadow-[2px_2px_0_rgba(0,0,0,0.8)] animate-pulse">
          Click to select a category
        </p>
      </div>
    </div>
  );
}
