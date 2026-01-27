"use client";

import { useSocket } from "@/hooks/useSocket";
import { useEffect, useState } from "react";

export default function Home() {
  const { socket, isConnected } = useSocket();
  const [lastPong, setLastPong] = useState<string | null>(null);

  useEffect(() => {
    if (!socket) return;

    function onPong(data: { message: string; timestamp: number }) {
      setLastPong(`${data.message} at ${new Date(data.timestamp).toLocaleTimeString()}`);
    }

    socket.on("pong", onPong);

    return () => {
      socket.off("pong", onPong);
    };
  }, [socket]);

  const sendPing = () => {
    if (socket) {
      socket.emit("ping");
    }
  };

  return (
    <div className="grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20 font-[family-name:var(--font-geist-sans)]">
      <main className="flex flex-col gap-8 row-start-2 items-center sm:items-start">
        <h1 className="text-4xl font-bold">Code Mafia</h1>
        
        <div className="flex flex-col gap-4 p-6 border rounded-lg bg-black/5 dark:bg-white/5">
          <h2 className="text-xl font-semibold">Server Connection Status</h2>
          
          <div className="flex items-center gap-2">
            <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
            <span>{isConnected ? "Connected" : "Disconnected"}</span>
          </div>

          <div className="mt-4">
            <button 
              onClick={sendPing}
              disabled={!isConnected}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Send Ping
            </button>
          </div>

          {lastPong && (
            <div className="mt-2 text-sm text-gray-600 dark:text-gray-400">
              Last response: {lastPong}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
