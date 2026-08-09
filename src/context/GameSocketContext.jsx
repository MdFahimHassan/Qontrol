import { createContext, useCallback, useEffect, useRef, useState } from 'react';
import { connectSocket, disconnectSocket, getClient } from '../services/socketService';

// Shared STOMP client instance — one socket for the whole app, reused
// across the lobby, live game and results pages so switching screens
// mid-game doesn't tear down and reopen the connection. Pages don't talk
// to this context directly; they go through the useGameSocket(roomCode)
// hook, which scopes subscribe/publish to a single room.
export const GameSocketContext = createContext(null);

export function GameSocketProvider({ children }) {
  const [status, setStatus] = useState('idle'); // idle | connecting | connected | error
  const clientRef = useRef(null);

  const connect = useCallback(() => {
    if (getClient()?.active || status === 'connecting') return;
    setStatus('connecting');
    clientRef.current = connectSocket({
      onConnect: () => setStatus('connected'),
      onDisconnect: () => setStatus('idle'),
      onError: () => setStatus('error'),
    });
  }, [status]);

  const disconnect = useCallback(() => {
    disconnectSocket();
    clientRef.current = null;
    setStatus('idle');
  }, []);

  // Dev/hot-reload safety net — real page unloads clean themselves up.
  useEffect(() => () => disconnectSocket(), []);

  return (
    <GameSocketContext.Provider value={{ client: clientRef.current, status, connect, disconnect }}>
      {children}
    </GameSocketContext.Provider>
  );
}
