"use client";

import { useState, useEffect, useRef } from "react";
import { Icon } from "@iconify/react";
import { GameState, Player } from "@/types/game";
import { useGame } from "@/context/GameContext";
import TopBar from "./TopBar";
import TaskPanel from "./TaskPanel";
import CodeEditor from "./CodeEditor";
import Chat from "./Chat";

interface GameScreenProps {
  gameState: GameState;
  currentPlayer: Player;
}

export default function GameScreen({ gameState, currentPlayer }: GameScreenProps) {
  const { updateCode } = useGame();
  const [messages, setMessages] = useState([
    { id: "1", sender: "System", text: "Game started!", color: "text-gray-500", isSystem: true },
    { id: "2", sender: currentPlayer.name, text: "Good luck everyone!", color: "text-blue-500" },
  ]);
  const emitTimerRef = useRef<NodeJS.Timeout | null>(null);
  const editorRef = useRef<any>(null);
  const codeRef = useRef<string>(gameState.code || "# Write your code here");
  
  // Dummy tasks
  const tasks = [
    { id: "1", description: "Implement binary search", completed: false },
    { id: "2", description: "Fix the memory leak", completed: true },
    { id: "3", description: "Validate input", completed: false },
  ];

  useEffect(() => {
    if (typeof gameState.code !== "string") return;
    if (gameState.code === codeRef.current) return;
    codeRef.current = gameState.code;

    if (editorRef.current) {
      const model = editorRef.current.getModel();
      if (!model) return;

      const currentValue = model.getValue();
      if (currentValue !== gameState.code) {
        const selections = editorRef.current.getSelections() || [];
        model.pushEditOperations(
          selections,
          [{ range: model.getFullModelRange(), text: gameState.code }],
          () => selections,
        );
      }
    }
  }, [gameState.code]);

  const handleCodeChange = (value?: string) => {
    const nextCode = value ?? "";
    codeRef.current = nextCode;

    if (emitTimerRef.current) {
      clearTimeout(emitTimerRef.current);
    }

    emitTimerRef.current = setTimeout(() => {
      updateCode(nextCode);
    }, 150);
  };

  return (
    <div className="flex flex-col h-screen bg-[#87CEEB] overflow-hidden">
      {/* Top Bar */}
      <TopBar 
        round={1} 
        category={gameState.category || "Unknown"}
        timeLeft={300} // 5 mins dummy
        aliveCount={gameState.players.length}
        totalPlayers={gameState.players.length}
      />

      {/* Main Content Area */}
      <div className="flex flex-1 overflow-hidden p-4 gap-4">
        {/* Left Panel: Tasks */}
        <TaskPanel 
          role={currentPlayer.role || "civilian"} 
          tasks={tasks}
        />

        {/* Center: Code Editor */}
        <div className="flex-1 flex flex-col gap-4">
          <CodeEditor 
            initialCode={codeRef.current}
            language="python"
            onChange={handleCodeChange}
            onMountEditor={(editor) => {
              editorRef.current = editor;
              if (codeRef.current) {
                editor.setValue(codeRef.current);
              }
            }}
          />
          
          {/* Emergency Button */}
          <div className="flex justify-end">
            <button className="bg-[#ff4757] text-white font-bold text-xl px-6 py-3 border-4 border-black shadow-[4px_4px_0_rgba(0,0,0,1)] hover:bg-[#ff6b81] active:translate-y-1 active:shadow-none transition-all flex items-center gap-2">
              <Icon icon="lucide:siren" className="animate-pulse" />
              EMERGENCY MEETING
            </button>
          </div>
        </div>

        {/* Right Panel: Chat */}
        <Chat 
          messages={messages}
          currentPlayerName={currentPlayer.name}
          onSendMessage={(text) => {
            setMessages([...messages, { 
              id: Date.now().toString(), 
              sender: currentPlayer.name, 
              text, 
              color: "text-blue-500" 
            }]);
          }}
        />
      </div>
    </div>
  );
}
