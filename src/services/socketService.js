import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';

// Thin wrapper around a single shared STOMP client — every page that needs
// real-time data (lobby, live game, results) goes through this one
// connection instead of opening its own socket. See GameSocketContext for
// how pages actually consume it; this file only owns the raw connect /
// disconnect lifecycle, mirroring the pattern from the project blueprint.
let client = null;

export function connectSocket({ onConnect, onDisconnect, onError } = {}) {
  if (client?.active) return client;

  client = new Client({
    webSocketFactory: () => new SockJS(`${import.meta.env.VITE_API_URL}/ws`),
    reconnectDelay: 3000,
    onConnect: () => onConnect?.(client),
    onDisconnect: () => onDisconnect?.(),
    onWebSocketError: (event) => onError?.(event),
    onStompError: (frame) => onError?.(frame),
  });

  client.activate();
  return client;
}

export function disconnectSocket() {
  client?.deactivate();
  client = null;
}

export function getClient() {
  return client;
}
