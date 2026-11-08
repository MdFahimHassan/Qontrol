import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';

const API_URL = import.meta.env?.VITE_API_URL || 'http://localhost:8080';

/**
 * Opens a STOMP-over-SockJS connection to the backend.
 *
 * - Hosts pass their JWT (sent as a STOMP connect header). Players pass nothing.
 * - stompjs reconnects on its own after a dropped connection and calls
 *   `onConnect` again each time, so the caller must re-subscribe there.
 */
export function createSocket({ token, onConnect, onClose, onProtocolError }) {
  const client = new Client({
    webSocketFactory: () => new SockJS(`${API_URL}/ws`),
    connectHeaders: token ? { Authorization: `Bearer ${token}` } : {},
    reconnectDelay: 3000,
    onConnect: () => onConnect?.(client),
    onWebSocketClose: () => onClose?.(),
    onStompError: (frame) => onProtocolError?.(frame.headers?.message || 'Connection error'),
  });
  client.activate();
  return client;
}

/** Sends a JSON body (or an empty frame). Returns false when the socket is down. */
export function publishJson(client, destination, body) {
  if (!client?.connected) return false;
  const frame = { destination };
  if (body !== undefined) {
    frame.body = JSON.stringify(body);
    frame.headers = { 'content-type': 'application/json' };
  }
  client.publish(frame);
  return true;
}

/** Subscribes and hands the handler the parsed JSON body. */
export function subscribeJson(client, destination, handler) {
  return client.subscribe(destination, (message) => {
    let data;
    try {
      data = JSON.parse(message.body);
    } catch {
      return; // ignore malformed frames
    }
    handler(data);
  });
}