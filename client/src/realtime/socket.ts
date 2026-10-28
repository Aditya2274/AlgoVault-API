import { io, type Socket } from 'socket.io-client';

/**
 * Create a fresh Socket.io client bound to the same origin (cookies flow through
 * the Vite dev proxy locally and the Nginx reverse proxy in Docker).
 */
export function createSocket(): Socket {
  return io('/', { autoConnect: false, withCredentials: true });
}
