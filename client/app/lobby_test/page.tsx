"use client";

import Lobby from "@/components/Lobby/Lobby";

export default function LobbyTestPage() {
  const mockPlayers = [
    { id: "1", name: "Rayyan", isHost: true },
    { id: "2", name: "Ahmad", isHost: false },
    { id: "3", name: "Sarah", isHost: false },
  ];

  return (
    <Lobby 
      lobbyCode="JSB18F" 
      players={mockPlayers} 
      currentPlayerId="1" 
      onStartGame={() => alert("Game Starting!")}
    />
  );
}
