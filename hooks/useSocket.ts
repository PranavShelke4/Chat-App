"use client";

import { useEffect, useRef } from "react";
import { io, Socket } from "socket.io-client";

let socketInstance: Socket | null = null;

export function useSocket(): Socket {
  const socketRef = useRef<Socket | null>(null);

  if (!socketInstance) {
    socketInstance = io({
      path: "/socket.io",
      transports: ["websocket", "polling"],
    });
  }

  socketRef.current = socketInstance;

  useEffect(() => {
    return () => {
      // singleton — don't disconnect on unmount
    };
  }, []);

  return socketRef.current!;
}
