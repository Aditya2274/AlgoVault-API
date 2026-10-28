import { Server } from 'socket.io';
import type { Server as HttpServer } from 'http';
import prisma from '../config/prisma.js';
import { verifyToken } from '../services/auth.service.js';
import { sessionService } from '../services/session.service.js';
import type { Role } from '../types/auth.js';

interface SocketUser {
  id: string;
  name: string;
  role: Role;
}

interface Ack {
  ok?: boolean;
  error?: string;
}

const presenceMap = new Map<string, Map<string, SocketUser>>();

let io: Server | null = null;

function parseCookies(header?: string): Record<string, string> {
  const out: Record<string, string> = {};
  if (!header) return out;
  for (const part of header.split(';')) {
    const idx = part.indexOf('=');
    if (idx === -1) continue;
    const key = part.slice(0, idx).trim();
    const val = part.slice(idx + 1).trim();
    if (key) out[key] = decodeURIComponent(val);
  }
  return out;
}

function getPresenceList(sessionId: string): SocketUser[] {
  const users = presenceMap.get(sessionId);
  return users ? Array.from(users.values()) : [];
}

function addPresence(sessionId: string, user: SocketUser): SocketUser[] {
  if (!presenceMap.has(sessionId)) presenceMap.set(sessionId, new Map());
  presenceMap.get(sessionId)!.set(user.id, user);
  return getPresenceList(sessionId);
}

function removePresence(sessionId: string, userId: string): SocketUser[] {
  const users = presenceMap.get(sessionId);
  if (users) {
    users.delete(userId);
    if (users.size === 0) presenceMap.delete(sessionId);
  }
  return getPresenceList(sessionId);
}

export function initSocketServer(httpServer: HttpServer): Server {
  io = new Server(httpServer);

  // Authenticate every socket handshake with the same JWT used by the REST API.
  io.use(async (socket, next) => {
    try {
      const cookies = parseCookies(socket.request.headers.cookie);
      const token = cookies['token'];
      if (!token) return next(new Error('Authentication required'));

      const payload = verifyToken(token);
      if (!payload) return next(new Error('Invalid or expired token'));

      const user = await prisma.user.findUnique({
        where: { id: payload.id },
        select: { id: true, name: true, role: true },
      });
      if (!user) return next(new Error('User not found'));

      socket.data.user = user as SocketUser;
      next();
    } catch (err) {
      next(err as Error);
    }
  });

  io.on('connection', (socket) => {
    const user = socket.data.user as SocketUser;

    socket.on('session:join', async (payload: { sessionId?: string }, ack?: (r: Ack) => void) => {
      try {
        const sessionId = payload?.sessionId;
        if (!sessionId) {
          ack?.({ error: 'Missing sessionId' });
          return;
        }

        const allowed = await sessionService.canJoin(sessionId, user.id, user.role);
        if (!allowed) {
          ack?.({ error: 'You cannot join this session' });
          return;
        }

        await socket.join(`session:${sessionId}`);
        socket.data.sessionId = sessionId;

        const history = await sessionService.getMessages(sessionId);
        socket.emit('session:history', history);

        const presence = addPresence(sessionId, user);
        io!.to(`session:${sessionId}`).emit('presence:update', presence);
        ack?.({ ok: true });
      } catch {
        ack?.({ error: 'Failed to join session' });
      }
    });

    socket.on('chat:message', async (payload: { sessionId?: string; body?: unknown }, ack?: (r: Ack) => void) => {
      try {
        const sessionId = payload?.sessionId;
        const body = typeof payload?.body === 'string' ? payload.body.trim() : '';
        if (!sessionId || !body) {
          ack?.({ error: 'Missing sessionId or message' });
          return;
        }
        if (body.length > 2000) {
          ack?.({ error: 'Message too long' });
          return;
        }

        const allowed = await sessionService.canJoin(sessionId, user.id, user.role);
        if (!allowed) {
          ack?.({ error: 'You cannot send to this session' });
          return;
        }

        const message = await sessionService.createMessage(sessionId, user.id, body);
        io!.to(`session:${sessionId}`).emit('chat:message', message);
        ack?.({ ok: true });
      } catch {
        ack?.({ error: 'Failed to send message' });
      }
    });

    socket.on('session:leave', (payload?: { sessionId?: string }) => {
      const sessionId = payload?.sessionId || socket.data.sessionId;
      if (!sessionId) return;

      socket.leave(`session:${sessionId}`);
      socket.data.sessionId = null;

      const presence = removePresence(sessionId, user.id);
      io!.to(`session:${sessionId}`).emit('presence:update', presence);
    });

    socket.on('disconnect', () => {
      const sessionId = socket.data.sessionId as string | undefined;
      if (!sessionId) return;

      const presence = removePresence(sessionId, user.id);
      io!.to(`session:${sessionId}`).emit('presence:update', presence);
    });
  });

  return io;
}

export function emitToSession(sessionId: string, event: string, payload: unknown): void {
  io?.to(`session:${sessionId}`).emit(event, payload);
}
