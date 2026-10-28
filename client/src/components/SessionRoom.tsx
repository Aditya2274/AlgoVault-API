import { useEffect, useRef, useState } from 'react';
import type { FormEvent } from 'react';
import { Send, Users } from 'lucide-react';
import { createSocket } from '../realtime/socket';
import type { SessionMessage, SessionUser } from '../types';

interface Props {
  sessionId: string;
  onEnded?: () => void;
}

export default function SessionRoom({ sessionId, onEnded }: Props) {
  const [messages, setMessages] = useState<SessionMessage[]>([]);
  const [presence, setPresence] = useState<SessionUser[]>([]);
  const [input, setInput] = useState('');
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const socketRef = useRef<ReturnType<typeof createSocket> | null>(null);
  const bottomRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const socket = createSocket();
    socketRef.current = socket;
    socket.connect();

    socket.on('connect', () => {
      socket.emit('session:join', { sessionId }, (ack: { ok?: boolean; error?: string }) => {
        if (ack?.error) {
          setError(ack.error);
          return;
        }
        setConnected(true);
      });
    });

    socket.on('session:history', (history: SessionMessage[]) => setMessages(history));
    socket.on('chat:message', (msg: SessionMessage) => setMessages((prev) => [...prev, msg]));
    socket.on('presence:update', (users: SessionUser[]) => setPresence(users));
    socket.on('session:ended', () => onEnded?.());

    return () => {
      socket.emit('session:leave', { sessionId });
      socket.disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const send = (e: FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !connected) return;
    socketRef.current?.emit('chat:message', { sessionId, body: input.trim() });
    setInput('');
  };

  return (
    <div className="flex flex-col bg-slate-900/50 border border-slate-800 rounded-xl overflow-hidden h-[480px]">
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800">
        <span className="text-sm font-semibold text-slate-200">Group chat</span>
        <div className="flex items-center gap-1 text-xs text-slate-400">
          <Users className="w-3.5 h-3.5" />
          {presence.length} online
        </div>
      </div>

      {error && (
        <div className="px-4 py-2 text-xs text-rose-400 bg-rose-500/10 border-b border-rose-500/30">{error}</div>
      )}

      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {messages.length === 0 && (
          <p className="text-xs text-slate-500 text-center">No messages yet — say hello 👋</p>
        )}
        {messages.map((m) => (
          <div key={m.id} className="flex flex-col">
            <span className="text-[10px] text-slate-500">
              {m.user.name}
              {m.user.role === 'Teacher' && <span className="ml-1 text-indigo-400">· Teacher</span>}
            </span>
            <span className="text-sm text-slate-200 break-words">{m.body}</span>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      <form onSubmit={send} className="flex items-center gap-2 p-3 border-t border-slate-800">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={connected ? 'Type a message…' : 'Connecting…'}
          disabled={!connected}
          className="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-indigo-500 disabled:opacity-50"
        />
        <button
          type="submit"
          disabled={!connected || !input.trim()}
          className="p-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white transition"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
}
