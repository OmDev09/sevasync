'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';

type MessageThread = {
  userId: string;
  userName: string;
  initials: string;
  lastMessage: string;
  lastTime: string;
  unreadCount: number;
};

type ChatMessage = {
  id: string;
  from_id: string;
  to_id: string;
  text: string;
  created_at: string;
  read: boolean;
};

export default function MessagesPage() {
  const { user, profile } = useAuth();
  const { success, error: toastError } = useToast();

  const [threads, setThreads] = useState<MessageThread[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [selectedThread, setSelectedThread] = useState<MessageThread | null>(null);
  const [loadingThreads, setLoadingThreads] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [composing, setComposing] = useState('');
  const [sending, setSending] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showBroadcast, setShowBroadcast] = useState(false);
  const [broadcastText, setBroadcastText] = useState('');
  const [broadcastSending, setBroadcastSending] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Fetch all volunteer profiles to build thread list
  const fetchThreads = useCallback(async () => {
    setLoadingThreads(true);
    try {
      const [volRes, msgRes] = await Promise.all([
        fetch('/api/volunteers'),
        fetch('/api/messages'),
      ]);
      const volData = await volRes.json();
      const msgData = await msgRes.json();

      const volunteers = volData.volunteers || [];
      const allMessages = (msgData.messages || []) as ChatMessage[];

      // Build threads from volunteers and latest message per volunteer
      const threadList: MessageThread[] = volunteers.map((v: { id: string; name: string }) => {
        const threadMsgs = allMessages.filter(
          (m: ChatMessage) => m.from_id === v.id || m.to_id === v.id
        );
        const sorted = threadMsgs.sort(
          (a: ChatMessage, b: ChatMessage) =>
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
        const latest = sorted[0];
        const unread = threadMsgs.filter(
          (m: ChatMessage) => m.to_id === user?.id && !m.read
        ).length;

        return {
          userId: v.id,
          userName: v.name,
          initials: v.name.split(' ').map((n: string) => n[0]).join('').slice(0, 2),
          lastMessage: latest?.text || 'No messages yet',
          lastTime: latest ? getTimeStr(latest.created_at) : '',
          unreadCount: unread,
        };
      });

      // Sort: unread first, then by last message time
      threadList.sort((a, b) => {
        if (a.unreadCount > 0 && b.unreadCount === 0) return -1;
        if (b.unreadCount > 0 && a.unreadCount === 0) return 1;
        return 0;
      });

      setThreads(threadList);
    } catch {
      // silent fail
    } finally {
      setLoadingThreads(false);
    }
  }, [user]);

  useEffect(() => { if (user) fetchThreads(); }, [user, fetchThreads]);

  // Load messages for a specific thread
  const loadMessages = useCallback(async (thread: MessageThread) => {
    setSelectedThread(thread);
    setLoadingMessages(true);
    try {
      const res = await fetch(`/api/messages?user_id=${thread.userId}`);
      const data = await res.json();
      setMessages(data.messages || []);

      // Mark unread messages as read
      if (data.messages?.length > 0) {
        const unreadIds = (data.messages as ChatMessage[])
          .filter(m => m.to_id === user?.id && !m.read)
          .map(m => m.id);

        if (unreadIds.length > 0) {
          await fetch('/api/messages/read', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ids: unreadIds }),
          });
          // Update thread unread count
          setThreads(prev =>
            prev.map(t => t.userId === thread.userId ? { ...t, unreadCount: 0 } : t)
          );
        }
      }
    } catch {
      toastError('Failed to load messages');
    } finally {
      setLoadingMessages(false);
    }
  }, [user, toastError]);

  // Scroll to bottom when messages change
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async () => {
    if (!composing.trim() || !selectedThread || !user) return;
    setSending(true);
    try {
      const res = await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to_id: selectedThread.userId,
          text: composing.trim(),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Send failed');

      setMessages(prev => [...prev, data.message]);
      setComposing('');

      // Update thread preview
      setThreads(prev =>
        prev.map(t =>
          t.userId === selectedThread.userId
            ? { ...t, lastMessage: composing.trim(), lastTime: 'Just now' }
            : t
        )
      );
    } catch (e: unknown) {
      toastError('Send failed', e instanceof Error ? e.message : 'Unknown error');
    } finally {
      setSending(false);
    }
  };

  const sendBroadcast = async () => {
    if (!broadcastText.trim()) return;
    setBroadcastSending(true);
    try {
      const res = await fetch('/api/messages/broadcast', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: broadcastText.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Broadcast failed');
      success('Broadcast sent ✅', `Message sent to ${data.count || 'all'} volunteers.`);
      setShowBroadcast(false);
      setBroadcastText('');
      fetchThreads();
    } catch (e: unknown) {
      toastError('Broadcast failed', e instanceof Error ? e.message : 'Unknown error');
    } finally {
      setBroadcastSending(false);
    }
  };

  const filteredThreads = threads.filter(t =>
    !searchQuery || t.userName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="animate-fade-in" style={{ height: 'calc(100vh - var(--topbar-height) - 80px)', display: 'flex', flexDirection: 'column' }}>
      <div className="page-header">
        <div className="page-header-top">
          <div>
            <h1 className="page-title font-display">💬 Communication Center</h1>
            <p className="page-subtitle">
              {loadingThreads ? 'Loading...' : `${threads.length} conversations · ${threads.reduce((s, t) => s + t.unreadCount, 0)} unread`}
            </p>
          </div>
          <button className="btn btn-primary btn-sm" id="messages-broadcast-btn" onClick={() => setShowBroadcast(true)}>📢 Broadcast Alert</button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-0" style={{ flex: 1, background: 'var(--bg-card)', border: '1px solid var(--bg-border)', borderRadius: 'var(--radius-lg)', overflow: 'hidden' }}>
        {/* Thread list */}
        <div style={{ borderRight: '1px solid var(--bg-border)', display: 'flex', flexDirection: 'column' }}>
          <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--bg-border)' }}>
            <input
              className="form-input"
              placeholder="🔍 Search conversations..."
              id="messages-search-input"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
          </div>
          <div style={{ flex: 1, overflowY: 'auto' }}>
            {loadingThreads ? (
              [1,2,3].map(i => (
                <div key={i} style={{ padding: '14px 16px', borderBottom: '1px solid var(--bg-border)', display: 'flex', gap: 12, alignItems: 'center' }}>
                  <div style={{ width: 38, height: 38, borderRadius: '50%', background: 'var(--bg-elevated)' }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ height: 14, width: '50%', background: 'var(--bg-elevated)', borderRadius: 4, marginBottom: 8 }} />
                    <div style={{ height: 12, width: '70%', background: 'var(--bg-elevated)', borderRadius: 4 }} />
                  </div>
                </div>
              ))
            ) : filteredThreads.length === 0 ? (
              <div style={{ padding: 24, textAlign: 'center', color: 'var(--text-muted)' }}>
                {threads.length === 0 ? 'No volunteers onboarded yet.' : 'No conversations match your search.'}
              </div>
            ) : (
              filteredThreads.map(t => (
                <div
                  key={t.userId}
                  id={`message-thread-${t.userId}`}
                  style={{
                    padding: '14px 16px',
                    borderBottom: '1px solid var(--bg-border)',
                    cursor: 'pointer',
                    background: selectedThread?.userId === t.userId
                      ? 'rgba(99,102,241,0.1)'
                      : t.unreadCount > 0
                        ? 'rgba(99,102,241,0.04)'
                        : 'transparent',
                    transition: 'background var(--transition-fast)',
                    display: 'flex', gap: 12, alignItems: 'flex-start',
                  }}
                  onClick={() => loadMessages(t)}
                >
                  <div className="avatar avatar-sm" style={{ width: 38, height: 38, fontSize: '0.8125rem', flexShrink: 0, position: 'relative' }}>
                    {t.initials}
                    {t.unreadCount > 0 && <div className="notification-dot" />}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div className="flex items-center justify-between" style={{ marginBottom: 3 }}>
                      <span style={{ fontWeight: t.unreadCount > 0 ? 700 : 500, fontSize: '0.875rem', color: 'var(--text-primary)' }}>{t.userName}</span>
                      <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{t.lastTime}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', flex: 1 }}>{t.lastMessage}</div>
                      {t.unreadCount > 0 && (
                        <span style={{ background: 'var(--brand-primary)', color: '#fff', fontSize: '0.65rem', fontWeight: 700, borderRadius: 'var(--radius-full)', padding: '1px 6px', minWidth: 18, textAlign: 'center' }}>{t.unreadCount}</span>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Chat area */}
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {selectedThread ? (
            <>
              {/* Chat header */}
              <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--bg-border)', display: 'flex', alignItems: 'center', gap: 12 }}>
                <div className="avatar avatar-sm" style={{ width: 36, height: 36 }}>{selectedThread.initials}</div>
                <div>
                  <div style={{ fontWeight: 600, fontSize: '0.9375rem' }}>{selectedThread.userName}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Volunteer</div>
                </div>
              </div>

              {/* Messages */}
              <div style={{ flex: 1, overflowY: 'auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
                {loadingMessages ? (
                  <div style={{ textAlign: 'center', padding: 24, color: 'var(--text-muted)' }}>Loading messages...</div>
                ) : messages.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: 24, color: 'var(--text-muted)', fontSize: '0.875rem' }}>
                    <div style={{ fontSize: '2rem', marginBottom: 8 }}>💬</div>
                    No messages yet. Start the conversation!
                  </div>
                ) : (
                  messages.map(msg => {
                    const isMine = msg.from_id === user?.id;
                    return (
                      <div key={msg.id} style={{ display: 'flex', justifyContent: isMine ? 'flex-end' : 'flex-start' }}>
                        <div
                          style={{
                            maxWidth: '70%',
                            padding: '10px 14px',
                            borderRadius: isMine ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                            background: isMine ? 'rgba(99,102,241,0.2)' : 'var(--bg-elevated)',
                            border: `1px solid ${isMine ? 'rgba(99,102,241,0.3)' : 'var(--bg-border)'}`,
                          }}
                        >
                          <div style={{ fontSize: '0.875rem', color: 'var(--text-primary)', lineHeight: 1.5 }}>{msg.text}</div>
                          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: 4, textAlign: isMine ? 'right' : 'left' }}>
                            {getTimeStr(msg.created_at)}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={chatEndRef} />
              </div>

              {/* Compose */}
              <div style={{ padding: '14px 16px', borderTop: '1px solid var(--bg-border)', display: 'flex', gap: 10 }}>
                <input
                  className="form-input"
                  id="messages-compose-input"
                  placeholder="Type a message..."
                  style={{ flex: 1 }}
                  value={composing}
                  onChange={e => setComposing(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
                />
                <button
                  className="btn btn-primary"
                  id="messages-send-btn"
                  onClick={sendMessage}
                  disabled={sending || !composing.trim()}
                >
                  {sending ? '⟳' : 'Send →'}
                </button>
              </div>
            </>
          ) : (
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <div style={{ textAlign: 'center', color: 'var(--text-muted)' }}>
                <div style={{ fontSize: '3rem', marginBottom: 12 }}>💬</div>
                <div style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Select a conversation</div>
                <div style={{ fontSize: '0.875rem', marginTop: 4 }}>Choose a volunteer from the list to start messaging</div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Broadcast Modal */}
      {showBroadcast && (
        <div
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}
          onClick={e => { if (e.target === e.currentTarget) setShowBroadcast(false); }}
        >
          <div className="card animate-fade-in" style={{ width: '100%', maxWidth: 480 }}>
            <div className="flex items-center justify-between" style={{ marginBottom: 20 }}>
              <h2 className="h3 font-display">📢 Broadcast Message</h2>
              <button className="btn btn-ghost btn-sm" onClick={() => setShowBroadcast(false)}>✕</button>
            </div>
            <div style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)', borderRadius: 'var(--radius-sm)', padding: '10px 14px', fontSize: '0.8125rem', color: 'var(--text-secondary)', marginBottom: 16 }}>
              ⚠️ This will send a message to <strong>ALL {threads.length} volunteers</strong>.
            </div>
            <div className="form-group">
              <label className="form-label">Broadcast Message *</label>
              <textarea
                className="form-input"
                rows={4}
                placeholder="e.g. ALERT: All volunteers must report status by 6pm today."
                value={broadcastText}
                onChange={e => setBroadcastText(e.target.value)}
                style={{ resize: 'vertical' }}
              />
            </div>
            <div className="flex gap-3" style={{ marginTop: 12 }}>
              <button className="btn btn-primary" style={{ flex: 1 }} onClick={sendBroadcast} disabled={broadcastSending || !broadcastText.trim()}>
                {broadcastSending ? '⟳ Sending...' : `📢 Send to ${threads.length} Volunteers`}
              </button>
              <button className="btn btn-secondary" onClick={() => setShowBroadcast(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function getTimeStr(iso: string) {
  const d = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMin = Math.round(diffMs / 60000);

  if (diffMin < 1) return 'Just now';
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.round(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  if (diffHr < 48) return 'Yesterday';
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
}
