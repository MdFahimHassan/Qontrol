import { useCallback, useContext, useEffect, useRef } from 'react';
import { GameSocketContext } from '../context/GameSocketContext';

// Scopes the shared socket to one room. Every game screen calls this with
// its roomCode and gets back a connected flag plus subscribe/publish
// helpers that already know the `/topic/room/{code}` and `/app/room/{code}`
// prefixes from the WebSocket contract — callers just pass the suffix,
// e.g. subscribe('/players', handler) or publish('/answer', body).
export function useGameSocket(roomCode) {
  const context = useContext(GameSocketContext);
  if (!context) {
    throw new Error('useGameSocket must be used within a GameSocketProvider');
  }
  const { client, status, connect } = context;
  const subsRef = useRef([]);

  useEffect(() => {
    if (status === 'idle') connect();
  }, [status, connect]);

  const subscribe = useCallback(
    (topicSuffix, handler) => {
      if (!client || status !== 'connected' || !roomCode) return () => {};
      const sub = client.subscribe(`/topic/room/${roomCode}${topicSuffix}`, (message) => {
        try {
          handler(JSON.parse(message.body));
        } catch {
          handler(message.body);
        }
      });
      subsRef.current.push(sub);
      return () => {
        sub.unsubscribe();
        subsRef.current = subsRef.current.filter((s) => s !== sub);
      };
    },
    [client, status, roomCode]
  );

  const publish = useCallback(
    (destSuffix, body = {}) => {
      if (!client || status !== 'connected' || !roomCode) return;
      client.publish({
        destination: `/app/room/${roomCode}${destSuffix}`,
        body: JSON.stringify(body),
      });
    },
    [client, status, roomCode]
  );

  // Belt-and-braces cleanup if a page unmounts without unsubscribing itself.
  useEffect(
    () => () => {
      subsRef.current.forEach((s) => s.unsubscribe());
      subsRef.current = [];
    },
    [roomCode]
  );

  return {
    connected: status === 'connected',
    connecting: status === 'connecting',
    subscribe,
    publish,
  };
}
