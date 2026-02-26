'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Badge, Button, Input, Spin, Typography, Avatar } from 'antd';
import { SendOutlined, MessageOutlined, SearchOutlined } from '@ant-design/icons';
import { chatApi } from '@/lib/api';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';

dayjs.extend(relativeTime);

const { Text } = Typography;

interface ClientInfo {
  id: number;
  name?: string;
  company_name?: string;
  email?: string;
}

interface DirectThread {
  id: number;
  client_id: number;
  client_name?: string;
  client_company_name?: string;
  client_email?: string;
  last_message?: string;
  last_message_sender?: string;
  last_message_at?: string;
  is_read_by_admin?: boolean;
}

interface ChatMessage {
  id: number;
  thread_id: number;
  sender_type: 'client' | 'user';
  sender_id: number;
  message: string;
  created_at: string;
}

type SidebarEntry = ClientInfo & {
  thread?: DirectThread;
  last_message?: string;
  last_message_sender?: string;
  last_message_at?: string;
  is_read_by_admin?: boolean;
};

function buildSidebarEntries(clients: ClientInfo[], threads: DirectThread[]): SidebarEntry[] {
  const threadByClient = new Map<number, DirectThread>();
  threads.forEach((t) => threadByClient.set(t.client_id, t));

  return clients.map((c) => {
    const t = threadByClient.get(c.id);
    return {
      ...c,
      thread: t,
      last_message: t?.last_message,
      last_message_sender: t?.last_message_sender,
      last_message_at: t?.last_message_at,
      is_read_by_admin: t?.is_read_by_admin ?? true,
    };
  });
}

export default function ChatPage() {
  const [clients, setClients] = useState<ClientInfo[]>([]);
  const [threads, setThreads] = useState<DirectThread[]>([]);
  const [activeClientId, setActiveClientId] = useState<number | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loadingClients, setLoadingClients] = useState(false);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [draft, setDraft] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = useCallback(() => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  }, []);

  const loadClients = useCallback(async (silent = false) => {
    if (!silent) setLoadingClients(true);
    try {
      const [clientsRes, threadsRes] = await Promise.all([
        chatApi.getClients(),
        chatApi.getDirectThreads(),
      ]);
      if (!clientsRes.error) {
        setClients((clientsRes.data as ClientInfo[]) || []);
      }
      if (!threadsRes.error) {
        setThreads((threadsRes.data as DirectThread[]) || []);
      }
    } catch {
      /* silent fail on poll */
    }
    if (!silent) setLoadingClients(false);
  }, []);

  const loadMessages = useCallback(async (clientId: number, silent = false) => {
    if (!silent) setLoadingMessages(true);
    try {
      const response = await chatApi.getDirectMessages(clientId);
      if (!response.error) {
        const payload = response.data as { messages: ChatMessage[] };
        const newMsgs = payload?.messages || [];
        setMessages((prev) => {
          if (
            prev.length !== newMsgs.length ||
            (newMsgs.length > 0 && prev[prev.length - 1]?.id !== newMsgs[newMsgs.length - 1]?.id)
          ) {
            return newMsgs;
          }
          return prev;
        });
      }
    } catch {
      /* silent fail */
    }
    if (!silent) setLoadingMessages(false);
  }, []);

  useEffect(() => {
    loadClients();
  }, [loadClients]);

  useEffect(() => {
    if (activeClientId) {
      loadMessages(activeClientId);
      chatApi.markDirectRead(activeClientId).catch(() => {});
    }
  }, [activeClientId, loadMessages]);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  useEffect(() => {
    const interval = setInterval(() => {
      loadClients(true);
      if (activeClientId) {
        loadMessages(activeClientId, true);
      }
    }, 5000);
    return () => clearInterval(interval);
  }, [activeClientId, loadClients, loadMessages]);

  const sidebarItems = useMemo(() => {
    const entries = buildSidebarEntries(clients, threads);
    const q = searchQuery.toLowerCase().trim();
    const filtered = q
      ? entries.filter(
          (e) =>
            e.name?.toLowerCase().includes(q) ||
            e.company_name?.toLowerCase().includes(q) ||
            e.email?.toLowerCase().includes(q),
        )
      : entries;

    return filtered.sort((a, b) => {
      const aHasThread = !!a.thread;
      const bHasThread = !!b.thread;
      if (aHasThread && !bHasThread) return -1;
      if (!aHasThread && bHasThread) return 1;
      if (aHasThread && bHasThread) {
        const aTime = a.last_message_at ? new Date(a.last_message_at).getTime() : 0;
        const bTime = b.last_message_at ? new Date(b.last_message_at).getTime() : 0;
        return bTime - aTime;
      }
      return (a.company_name || a.name || '').localeCompare(b.company_name || b.name || '');
    });
  }, [clients, threads, searchQuery]);

  const activeClient = useMemo(
    () => clients.find((c) => c.id === activeClientId) || null,
    [clients, activeClientId],
  );

  const sendMessage = async () => {
    if (!activeClientId || !draft.trim()) return;
    const body = draft.trim();
    setDraft('');

    const optimisticMsg: ChatMessage = {
      id: Date.now(),
      thread_id: 0,
      sender_type: 'user',
      sender_id: 0,
      message: body,
      created_at: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, optimisticMsg]);
    scrollToBottom();

    try {
      const response = await chatApi.sendDirectMessage(activeClientId, body);
      if (response.error) {
        setMessages((prev) => prev.filter((m) => m.id !== optimisticMsg.id));
      } else {
        await loadMessages(activeClientId, true);
        await loadClients(true);
      }
    } catch {
      setMessages((prev) => prev.filter((m) => m.id !== optimisticMsg.id));
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const formatTime = (dateStr: string) => {
    const date = dayjs(dateStr);
    const now = dayjs();
    if (now.diff(date, 'day') === 0) return date.format('h:mm A');
    if (now.diff(date, 'day') === 1) return 'Yesterday ' + date.format('h:mm A');
    return date.format('MMM D, h:mm A');
  };

  const formatThreadTime = (dateStr?: string) => {
    if (!dateStr) return '';
    const date = dayjs(dateStr);
    const now = dayjs();
    if (now.diff(date, 'day') === 0) return date.format('h:mm A');
    if (now.diff(date, 'day') === 1) return 'Yesterday';
    return date.format('MMM D');
  };

  const getInitials = (name?: string) => {
    if (!name) return '?';
    return name.split(' ').map((w) => w[0]).join('').toUpperCase().slice(0, 2);
  };

  const unreadCount = threads.filter((t) => !t.is_read_by_admin).length;

  return (
    <div className="flex h-[calc(100vh-120px)] overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
      {/* Left sidebar: All clients */}
      <div className="flex w-[340px] flex-col border-r border-gray-200 bg-white">
        <div className="border-b border-gray-100 bg-gray-50 px-5 py-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-gray-800">Client Chats</h2>
            <Badge count={unreadCount} size="small">
              <MessageOutlined className="text-lg text-gray-500" />
            </Badge>
          </div>
          <Input
            prefix={<SearchOutlined className="text-gray-400" />}
            placeholder="Search clients..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="mt-3"
            allowClear
          />
        </div>

        <div className="flex-1 overflow-y-auto">
          {loadingClients && clients.length === 0 ? (
            <div className="flex items-center justify-center py-12">
              <Spin size="small" />
            </div>
          ) : sidebarItems.length === 0 ? (
            <div className="py-12 text-center text-sm text-gray-400">
              {searchQuery ? 'No matching clients' : 'No clients found'}
            </div>
          ) : (
            sidebarItems.map((entry) => (
              <div
                key={entry.id}
                onClick={() => setActiveClientId(entry.id)}
                className={`cursor-pointer border-b border-gray-50 px-4 py-3 transition-colors ${
                  activeClientId === entry.id
                    ? 'bg-blue-50 border-l-2 border-l-blue-500'
                    : 'hover:bg-gray-50'
                }`}
              >
                <div className="flex items-start gap-3">
                  <Avatar
                    size={44}
                    style={{
                      backgroundColor: activeClientId === entry.id ? '#3b82f6' : '#64748b',
                      flexShrink: 0,
                    }}
                  >
                    {getInitials(entry.company_name || entry.name)}
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between">
                      <Text strong className="truncate text-sm">
                        {entry.company_name || entry.name || 'Client'}
                      </Text>
                      <Text className="ml-2 flex-shrink-0 text-[11px] text-gray-400">
                        {formatThreadTime(entry.last_message_at)}
                      </Text>
                    </div>
                    <Text className="block truncate text-xs text-gray-500">
                      {entry.name && entry.company_name ? entry.name : entry.email || ''}
                    </Text>
                    {entry.thread && (
                      <div className="mt-0.5 flex items-center justify-between">
                        <Text className="block truncate text-xs text-gray-400">
                          {entry.last_message_sender === 'user' && (
                            <span className="text-blue-500">You: </span>
                          )}
                          {entry.last_message || 'No messages yet'}
                        </Text>
                        {!entry.is_read_by_admin && (
                          <span className="ml-2 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-green-500 text-[10px] font-bold text-white">
                            !
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Right panel: Messages */}
      <div className="flex flex-1 flex-col bg-[#f0f2f5]">
        {!activeClient ? (
          <div className="flex flex-1 flex-col items-center justify-center text-gray-400">
            <MessageOutlined className="mb-3 text-5xl text-gray-300" />
            <Text className="text-lg text-gray-400">Select a client to start messaging</Text>
            <Text className="mt-1 text-sm text-gray-300">
              Choose a client from the list on the left
            </Text>
          </div>
        ) : (
          <>
            {/* Chat header */}
            <div className="flex items-center gap-3 border-b border-gray-200 bg-white px-5 py-3">
              <Avatar size={40} style={{ backgroundColor: '#3b82f6' }}>
                {getInitials(activeClient.company_name || activeClient.name)}
              </Avatar>
              <div>
                <Text strong className="block text-sm">
                  {activeClient.company_name || activeClient.name || 'Client'}
                </Text>
                {activeClient.email && (
                  <Text className="block text-xs text-gray-400">{activeClient.email}</Text>
                )}
              </div>
            </div>

            {/* Messages */}
            <div
              ref={messagesContainerRef}
              className="flex-1 overflow-y-auto px-5 py-4"
              style={{
                backgroundImage:
                  'url("data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'none\' fill-rule=\'evenodd\'%3E%3Cg fill=\'%23d1d5db\' fill-opacity=\'0.15\'%3E%3Cpath d=\'M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z\'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")',
              }}
            >
              {loadingMessages && messages.length === 0 ? (
                <div className="flex items-center justify-center py-12">
                  <Spin size="small" />
                </div>
              ) : messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-gray-400">
                  <MessageOutlined className="mb-2 text-3xl text-gray-300" />
                  <Text className="text-sm text-gray-400">
                    No messages yet. Start the conversation!
                  </Text>
                </div>
              ) : (
                <div className="space-y-1">
                  {messages.map((msg, idx) => {
                    const isAdmin = msg.sender_type === 'user';
                    const showDate =
                      idx === 0 ||
                      dayjs(msg.created_at).format('YYYY-MM-DD') !==
                        dayjs(messages[idx - 1].created_at).format('YYYY-MM-DD');

                    return (
                      <div key={msg.id}>
                        {showDate && (
                          <div className="my-3 flex justify-center">
                            <span className="rounded-lg bg-white px-3 py-1 text-xs text-gray-500 shadow-sm">
                              {dayjs(msg.created_at).format('MMMM D, YYYY')}
                            </span>
                          </div>
                        )}
                        <div className={`flex ${isAdmin ? 'justify-end' : 'justify-start'} mb-1`}>
                          <div
                            className={`relative max-w-[65%] rounded-lg px-3 py-2 shadow-sm ${
                              isAdmin ? 'bg-[#d9fdd3] text-gray-800' : 'bg-white text-gray-800'
                            }`}
                          >
                            {!isAdmin && (
                              <Text className="mb-0.5 block text-[11px] font-semibold text-blue-600">
                                {activeClient.company_name || activeClient.name || 'Client'}
                              </Text>
                            )}
                            <span className="whitespace-pre-wrap text-sm">{msg.message}</span>
                            <Text className="mt-0.5 block text-right text-[10px] text-gray-400">
                              {formatTime(msg.created_at)}
                            </Text>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  <div ref={messagesEndRef} />
                </div>
              )}
            </div>

            {/* Message input */}
            <div className="border-t border-gray-200 bg-white px-4 py-3">
              <div className="flex items-end gap-2">
                <Input.TextArea
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Type a message..."
                  autoSize={{ minRows: 1, maxRows: 4 }}
                  className="flex-1 rounded-lg"
                  style={{ resize: 'none' }}
                />
                <Button
                  type="primary"
                  shape="circle"
                  size="large"
                  icon={<SendOutlined />}
                  onClick={sendMessage}
                  disabled={!draft.trim()}
                  style={{ backgroundColor: '#25d366', borderColor: '#25d366' }}
                />
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
