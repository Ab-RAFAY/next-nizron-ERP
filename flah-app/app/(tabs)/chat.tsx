/**
 * app/(tabs)/chat.tsx
 *
 * Admin-side chat: Thread list + Conversation view.
 * Uses TanStack Query v5 for all data fetching:
 *  – useQuery(['chatThreads'])           : thread list, 10 s background refresh
 *  – useQuery(['messages', threadId])    : messages, 6 s background refresh
 *  – useMutation(sendMessage)            : optimistic send with rollback on error
 */

import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  useQuery,
  useMutation,
  useQueryClient,
  QueryKey,
} from '@tanstack/react-query';
import { CONFIG } from '../../constants/config';
import { getAuthHeaders } from '../../lib/query-client';

// ── Types ─────────────────────────────────────────────────────────────────
type ChatThread = {
  id: number;
  client_id: number;
  client_name?: string;
  client_company_name?: string;
  client_email?: string;
  last_message?: string;
  last_message_sender?: string;
  last_message_at?: string;
  is_read_by_admin?: boolean;
};

type ChatMessage = {
  id: number;
  sender_type: 'client' | 'user' | 'employee';
  sender_id: number;
  message: string;
  created_at: string;
  /** True only for optimistic (not-yet-confirmed) messages */
  is_sending?: boolean;
};

// ── Query Keys ────────────────────────────────────────────────────────────
const THREADS_KEY: QueryKey = ['chatThreads'];
const messagesKey = (threadId: number): QueryKey => ['messages', threadId];

// ── API fetchers ──────────────────────────────────────────────────────────
async function fetchThreads(): Promise<ChatThread[]> {
  const headers = await getAuthHeaders();
  if (!headers.Authorization) return [];
  const res = await fetch(`${CONFIG.API_BASE_URL}/chat/threads`, { headers });
  if (!res.ok) throw new Error(`fetchThreads ${res.status}`);
  const data = await res.json();
  return Array.isArray(data) ? data : [];
}

async function fetchMessages(threadId: number): Promise<ChatMessage[]> {
  const headers = await getAuthHeaders();
  if (!headers.Authorization) return [];
  const res = await fetch(`${CONFIG.API_BASE_URL}/chat/threads/${threadId}/messages`, {
    headers,
  });
  if (!res.ok) throw new Error(`fetchMessages ${res.status}`);
  const payload = await res.json();
  return payload?.messages ?? [];
}

async function postMessage({
  threadId,
  message,
}: {
  threadId: number;
  message: string;
}): Promise<void> {
  const headers = await getAuthHeaders();
  const res = await fetch(`${CONFIG.API_BASE_URL}/chat/threads/${threadId}/messages`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ message }),
  });
  if (!res.ok) throw new Error(`postMessage ${res.status}`);
}

async function markThreadRead(threadId: number): Promise<void> {
  const headers = await getAuthHeaders();
  await fetch(`${CONFIG.API_BASE_URL}/chat/threads/${threadId}/read`, {
    method: 'PATCH',
    headers,
  });
}

// ── Utility helpers ───────────────────────────────────────────────────────
const AVATAR_COLORS = ['#1677ff', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];
const getAvatarColor = (id: number) => AVATAR_COLORS[id % AVATAR_COLORS.length];
const getInitials = (name: string) =>
  name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

const formatTime = (dateStr: string) => {
  const date = new Date(dateStr);
  const now = new Date();
  const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
  const h = date.getHours() % 12 || 12;
  const m = date.getMinutes().toString().padStart(2, '0');
  const ampm = date.getHours() >= 12 ? 'PM' : 'AM';
  const timeStr = `${h}:${m} ${ampm}`;
  if (diffDays === 0) return timeStr;
  if (diffDays === 1) return `Yesterday ${timeStr}`;
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${months[date.getMonth()]} ${date.getDate()}, ${timeStr}`;
};

const formatDateHeader = (dateStr: string) => {
  const date = new Date(dateStr);
  const now = new Date();
  const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August',
    'September', 'October', 'November', 'December'];
  return `${days[date.getDay()]}, ${months[date.getMonth()]} ${date.getDate()}`;
};

const isSameDay = (d1: string, d2: string) => {
  const a = new Date(d1);
  const b = new Date(d2);
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
};

// ══════════════════════════════════════════════════════════════════════════
// Main Component
// ══════════════════════════════════════════════════════════════════════════
export default function EmployeeChatScreen() {
  const qc = useQueryClient();
  const [activeThread, setActiveThread] = useState<ChatThread | null>(null);
  const [draft, setDraft] = useState('');
  const flatListRef = useRef<FlatList>(null);

  // ── Thread List Query ─────────────────────────────────────────────────
  const {
    data: threads = [],
    isLoading: threadsLoading,
  } = useQuery({
    queryKey: THREADS_KEY,
    queryFn: fetchThreads,
    refetchInterval: 10_000,             // 10 s background sync
    refetchOnWindowFocus: true,
    staleTime: 0,                        // always re-validate threads
  });

  // ── Messages Query (only active when a thread is open) ───────────────
  const {
    data: messages = [],
    isLoading: messagesLoading,
  } = useQuery({
    queryKey: messagesKey(activeThread?.id ?? 0),
    queryFn: () => fetchMessages(activeThread!.id),
    enabled: !!activeThread,
    refetchInterval: 6_000,              // 6 s background sync in conversation
    staleTime: 0,
  });

  // Auto-scroll when messages change
  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 150);
    }
  }, [messages]);

  // Mark as read when a thread is opened
  useEffect(() => {
    if (activeThread) {
      markThreadRead(activeThread.id).catch(() => {});
    }
  }, [activeThread?.id]);

  // ── Send Message Mutation with Optimistic Update ─────────────────────
  const sendMutation = useMutation({
    mutationFn: postMessage,

    // 1️⃣ Before the request: inject optimistic message into the cache
    onMutate: async ({ threadId, message }) => {
      // Cancel any in-flight refetch that would overwrite our optimistic data
      await qc.cancelQueries({ queryKey: messagesKey(threadId) });

      // Snapshot the current messages for potential rollback
      const previous = qc.getQueryData<ChatMessage[]>(messagesKey(threadId));

      const optimistic: ChatMessage = {
        id: Date.now(),
        sender_type: 'employee',
        sender_id: 0,
        message,
        created_at: new Date().toISOString(),
        is_sending: true,
      };

      qc.setQueryData<ChatMessage[]>(messagesKey(threadId), (old = []) => [
        ...old,
        optimistic,
      ]);

      return { previous, threadId };
    },

    // 2️⃣ On error: roll back to the snapshot
    onError: (_err, _vars, context) => {
      if (context?.previous !== undefined) {
        qc.setQueryData(messagesKey(context.threadId), context.previous);
      }
    },

    // 3️⃣ Always: invalidate to sync confirmed state from server
    onSettled: (_data, _err, { threadId }) => {
      qc.invalidateQueries({ queryKey: messagesKey(threadId) });
      qc.invalidateQueries({ queryKey: THREADS_KEY });
    },
  });

  const handleSend = useCallback(() => {
    const body = draft.trim();
    if (!body || !activeThread) return;
    setDraft('');
    sendMutation.mutate({ threadId: activeThread.id, message: body });
  }, [draft, activeThread, sendMutation]);

  const openThread = useCallback((thread: ChatThread) => {
    setActiveThread(thread);
    // Pre-warm cache with empty array so loading state shows immediately
    if (!qc.getQueryData(messagesKey(thread.id))) {
      qc.setQueryData(messagesKey(thread.id), []);
    }
  }, [qc]);

  // ── Unread count (derived from cached threads) ────────────────────────
  const unreadCount = threads.filter((t) => !t.is_read_by_admin).length;

  // ══════════════════════════════════════════════════════════════════════
  // Thread List View
  // ══════════════════════════════════════════════════════════════════════
  if (!activeThread) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        {/* Slim sticky header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.headerTitle}>Client Messages</Text>
            {unreadCount > 0 && (
              <Text style={styles.headerSub}>
                {unreadCount} unread conversation{unreadCount > 1 ? 's' : ''}
              </Text>
            )}
          </View>
          {unreadCount > 0 && (
            <View style={styles.unreadCountBadge}>
              <Text style={styles.unreadCountText}>{unreadCount}</Text>
            </View>
          )}
        </View>

        {threadsLoading && threads.length === 0 ? (
          <View style={styles.centered}>
            <ActivityIndicator size="small" color="#1677ff" />
          </View>
        ) : threads.length === 0 ? (
          <View style={styles.centered}>
            <View style={styles.emptyIcon}>
              <Ionicons name="chatbubbles-outline" size={36} color="#94a3b8" />
            </View>
            <Text style={styles.emptyTitle}>No client messages yet</Text>
            <Text style={styles.emptyHint}>Messages from clients will appear here</Text>
          </View>
        ) : (
          <FlatList
            data={threads}
            keyExtractor={(item) => String(item.id)}
            renderItem={({ item }) => {
              const isUnread = !item.is_read_by_admin;
              const name = item.client_company_name || item.client_name || 'Client';
              return (
                <TouchableOpacity
                  style={[styles.threadRow, isUnread && styles.threadRowUnread]}
                  onPress={() => openThread(item)}
                  activeOpacity={0.6}
                >
                  <View style={[styles.avatar, { backgroundColor: getAvatarColor(item.client_id) }]}>
                    <Text style={styles.avatarText}>{getInitials(name)}</Text>
                  </View>
                  <View style={styles.threadInfo}>
                    <View style={styles.threadTopRow}>
                      <Text
                        style={[styles.threadName, isUnread && styles.threadNameUnread]}
                        numberOfLines={1}
                      >
                        {name}
                      </Text>
                      <Text style={styles.threadTime}>
                        {item.last_message_at ? formatTime(item.last_message_at) : ''}
                      </Text>
                    </View>
                    {item.client_name && item.client_company_name && (
                      <Text style={styles.threadSubName} numberOfLines={1}>
                        {item.client_name}
                      </Text>
                    )}
                    <View style={styles.threadBottomRow}>
                      <Text style={styles.threadLastMsg} numberOfLines={1}>
                        {item.last_message_sender === 'user' ||
                        item.last_message_sender === 'employee'
                          ? 'You: '
                          : ''}
                        {item.last_message || 'No messages yet'}
                      </Text>
                      {isUnread && <View style={styles.unreadDot} />}
                    </View>
                  </View>
                </TouchableOpacity>
              );
            }}
            ItemSeparatorComponent={() => <View style={styles.separator} />}
          />
        )}
      </SafeAreaView>
    );
  }

  // ══════════════════════════════════════════════════════════════════════
  // Conversation View
  // ══════════════════════════════════════════════════════════════════════
  const renderMessage = ({ item, index }: { item: ChatMessage; index: number }) => {
    const isClient = item.sender_type === 'client';
    const showDateHeader =
      index === 0 || !isSameDay(item.created_at, messages[index - 1].created_at);

    return (
      <View>
        {showDateHeader && (
          <View style={styles.dateHeaderWrap}>
            <View style={styles.dateHeaderBadge}>
              <Text style={styles.dateHeaderText}>{formatDateHeader(item.created_at)}</Text>
            </View>
          </View>
        )}

        <View style={isClient ? styles.msgRowLeft : styles.msgRowRight}>
          {isClient && (
            <View
              style={[styles.msgAvatar, { backgroundColor: getAvatarColor(item.sender_id) }]}
            >
              <Text style={styles.msgAvatarText}>
                {getInitials(
                  activeThread.client_company_name || activeThread.client_name || 'C'
                )}
              </Text>
            </View>
          )}

          {/* Bubble */}
          <View style={isClient ? styles.bubbleReceived : styles.bubbleSent}>
            {isClient && (
              <Text style={styles.senderLabel}>
                {activeThread.client_name || 'Client'}
              </Text>
            )}
            {/* Optimistic message: slightly muted text */}
            <Text style={[styles.msgText, item.is_sending && styles.msgTextSending]}>
              {item.message}
            </Text>
            <View style={styles.timeRow}>
              <Text style={isClient ? styles.timeLeft : styles.timeRight}>
                {formatTime(item.created_at)}
              </Text>
              {/* Sending indicator */}
              {item.is_sending && (
                <Text style={styles.sendingLabel}> · Sending…</Text>
              )}
            </View>
          </View>
        </View>
      </View>
    );
  };

  const clientName =
    activeThread.client_company_name || activeThread.client_name || 'Client';

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        {/* Slim Conversation Header */}
        <View style={styles.convHeader}>
          <TouchableOpacity
            onPress={() => setActiveThread(null)}
            style={styles.backBtn}
            activeOpacity={0.6}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons name="arrow-back" size={20} color="#ffffff" />
          </TouchableOpacity>
          <View
            style={[
              styles.convAvatar,
              { backgroundColor: getAvatarColor(activeThread.client_id) },
            ]}
          >
            <Text style={styles.convAvatarText}>
              {getInitials(
                activeThread.client_company_name || activeThread.client_name || 'C'
              )}
            </Text>
          </View>
          <View style={styles.convInfo}>
            <Text style={styles.convName} numberOfLines={1}>
              {clientName}
            </Text>
            {activeThread.client_email && (
              <Text style={styles.convSub} numberOfLines={1}>
                {activeThread.client_email}
              </Text>
            )}
          </View>
          <View style={styles.onlineBadge}>
            <View style={styles.onlineDot} />
            <Text style={styles.onlineText}>Live</Text>
          </View>
        </View>

        {/* Messages */}
        {messagesLoading && messages.length === 0 ? (
          <View style={styles.centered}>
            <ActivityIndicator size="small" color="#1677ff" />
            <Text style={styles.loadingText}>Loading messages…</Text>
          </View>
        ) : (
          <FlatList
            ref={flatListRef}
            data={messages}
            keyExtractor={(item) => String(item.id)}
            contentContainerStyle={styles.messagesContent}
            renderItem={renderMessage}
            onContentSizeChange={() =>
              flatListRef.current?.scrollToEnd({ animated: false })
            }
            ListEmptyComponent={() => (
              <View style={styles.centered}>
                <Ionicons name="chatbubble-ellipses-outline" size={36} color="#e2e8f0" />
                <Text style={styles.emptyTitle}>Start the conversation</Text>
              </View>
            )}
          />
        )}

        {/* Input Bar */}
        <View style={styles.inputBar}>
          <TextInput
            style={styles.msgInput}
            placeholder="Type a message…"
            placeholderTextColor="#94a3b8"
            value={draft}
            onChangeText={setDraft}
            multiline
            maxLength={1000}
          />
          <TouchableOpacity
            style={[
              styles.sendBtn,
              (!draft.trim() || sendMutation.isPending) && styles.sendBtnDisabled,
            ]}
            onPress={handleSend}
            disabled={!draft.trim() || sendMutation.isPending}
            activeOpacity={0.75}
          >
            {sendMutation.isPending ? (
              <ActivityIndicator size="small" color="#ffffff" />
            ) : (
              <Ionicons name="send" size={16} color="#ffffff" />
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// ══════════════════════════════════════════════════════════════════════════
// Styles (unchanged from prior UI pass)
// ══════════════════════════════════════════════════════════════════════════
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f7f9' },

  // ── Thread List Header ────────────────────────────────────────────
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    height: 50,
    paddingHorizontal: 16,
    backgroundColor: '#1e293b',
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
  },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#ffffff' },
  headerSub: { fontSize: 11, color: '#94a3b8', marginTop: 1 },
  unreadCountBadge: {
    backgroundColor: '#ef4444',
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 2,
    minWidth: 24,
    alignItems: 'center',
  },
  unreadCountText: { fontSize: 11, fontWeight: '800', color: '#fff' },

  // ── Thread Row ────────────────────────────────────────────────────
  threadRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#ffffff',
  },
  threadRowUnread: { backgroundColor: '#fafcff' },
  separator: { height: 1, backgroundColor: '#f1f5f9', marginLeft: 72 },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { color: '#ffffff', fontSize: 14, fontWeight: '700' },
  threadInfo: { flex: 1, marginLeft: 12 },
  threadTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  threadName: { fontSize: 13, fontWeight: '600', color: '#475569', flex: 1 },
  threadNameUnread: { fontWeight: '700', color: '#1e293b' },
  threadTime: { fontSize: 11, color: '#94a3b8', marginLeft: 6 },
  threadSubName: { fontSize: 11, color: '#94a3b8', marginTop: 1 },
  threadBottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 3,
  },
  threadLastMsg: { fontSize: 13, color: '#94a3b8', flex: 1 },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#1677ff',
    marginLeft: 6,
  },

  // ── Conversation Header ───────────────────────────────────────────
  convHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 50,
    paddingHorizontal: 12,
    backgroundColor: '#1e293b',
    gap: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
  },
  backBtn: { padding: 2 },
  convAvatar: {
    width: 32,
    height: 32,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  convAvatarText: { color: '#ffffff', fontSize: 12, fontWeight: '700' },
  convInfo: { flex: 1 },
  convName: { fontSize: 14, fontWeight: '700', color: '#ffffff' },
  convSub: { fontSize: 11, color: '#94a3b8' },
  onlineBadge: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  onlineDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#22c55e' },
  onlineText: { fontSize: 11, color: '#22c55e', fontWeight: '600' },

  // ── Messages ──────────────────────────────────────────────────────
  messagesContent: { paddingHorizontal: 12, paddingVertical: 12 },
  dateHeaderWrap: { alignItems: 'center', marginVertical: 14 },
  dateHeaderBadge: {
    backgroundColor: '#e2e8f0',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 10,
  },
  dateHeaderText: { fontSize: 11, color: '#64748b', fontWeight: '600' },

  msgRowLeft: { flexDirection: 'row', marginBottom: 6, alignItems: 'flex-end' },
  msgRowRight: { flexDirection: 'row', justifyContent: 'flex-end', marginBottom: 6 },

  msgAvatar: {
    width: 26,
    height: 26,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 6,
  },
  msgAvatarText: { color: '#ffffff', fontSize: 9, fontWeight: '700' },

  // Received: white + 1px border
  bubbleReceived: {
    backgroundColor: '#ffffff',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    paddingHorizontal: 12,
    paddingVertical: 8,
    maxWidth: '75%',
  },
  // Sent: light green, no border
  bubbleSent: {
    backgroundColor: '#e7f9e1',
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    maxWidth: '75%',
  },
  senderLabel: { fontSize: 11, fontWeight: '700', color: '#1677ff', marginBottom: 3 },
  msgText: { fontSize: 13, color: '#1e293b', lineHeight: 19 },
  // Subtle grey for unconfirmed (optimistic) messages
  msgTextSending: { color: '#94a3b8' },
  timeRow: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
  timeLeft: { fontSize: 10, color: '#94a3b8' },
  timeRight: { fontSize: 10, color: '#64748b', textAlign: 'right' },
  sendingLabel: { fontSize: 10, color: '#94a3b8', fontStyle: 'italic' },

  // ── Input Bar ─────────────────────────────────────────────────────
  inputBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    gap: 8,
  },
  msgInput: {
    flex: 1,
    backgroundColor: '#f5f7f9',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 13,
    color: '#1e293b',
    maxHeight: 100,
    minHeight: 40,
  },
  sendBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#1677ff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendBtnDisabled: { backgroundColor: '#c0cfe8' },

  // ── Common ────────────────────────────────────────────────────────
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  emptyIcon: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  emptyTitle: { fontSize: 15, fontWeight: '600', color: '#475569', marginTop: 8 },
  emptyHint: { fontSize: 13, color: '#94a3b8', marginTop: 4 },
  loadingText: { fontSize: 13, color: '#94a3b8', marginTop: 8 },
});
