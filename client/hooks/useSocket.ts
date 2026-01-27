"use client";

import { useEffect, useState } from "react";
import { Socket } from "socket.io-client";
import { getSocket } from "../lib/socket";

export function useSocket() {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    const socketInstance = getSocket();

    // Connect if not already connected
    if (!socketInstance.connected) {
      socketInstance.connect();
    }

    setSocket(socketInstance);

    function onConnect() {
      setIsConnected(true);
      console.log("Connected to server");
    }

    function onDisconnect() {
      setIsConnected(false);
      console.log("Disconnected from server");
    }

    socketInstance.on("connect", onConnect);
    socketInstance.on("disconnect", onDisconnect);

    // Initial check
    if (socketInstance.connected) {
      onConnect();
    }

    return () => {
      socketInstance.off("connect", onConnect);
      socketInstance.off("disconnect", onDisconnect);
    };
  }, []);

  return { socket, isConnected };
}
