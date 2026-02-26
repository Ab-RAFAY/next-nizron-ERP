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
import { CONFIG } from '../../constants/config';

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
};

const AVATAR_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#f97316'];
const getAvatarColor = (id: number) => AVATAR_COLORS[id % AVATAR_COLORS.length];
const getInitials = (name: string) =>
    name.split(' ').map((w) => w[0]).join('').toUpperCase().slice(0, 2);

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
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    return `${months[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`;
};

const isSameDay = (d1: string, d2: string) => {
    const a = new Date(d1);
    const b = new Date(d2);
    return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
};

export default function EmployeeChatScreen() {
    const [threads, setThreads] = useState<ChatThread[]>([]);
    const [activeThread, setActiveThread] = useState<ChatThread | null>(null);
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [loading, setLoading] = useState(true);
    const [loadingMessages, setLoadingMessages] = useState(false);
    const [sending, setSending] = useState(false);
    const [draft, setDraft] = useState('');
    const flatListRef = useRef<FlatList>(null);

    const getAuthHeaders = useCallback(async () => {
        const token = await AsyncStorage.getItem('token');
        return {
            'Content-Type': 'application/json',
            Authorization: token ? `Bearer ${token}` : '',
        };
    }, []);

    const loadThreads = useCallback(async (silent = false) => {
        if (!silent) setLoading(true);
        try {
            const response = await fetch(`${CONFIG.API_BASE_URL}/chat/threads`, {
                headers: await getAuthHeaders(),
            });
            const data = await response.json();
            if (response.ok && Array.isArray(data)) {
                setThreads(data);
            }
        } catch {
            /* silent */
        } finally {
            if (!silent) setLoading(false);
        }
    }, [getAuthHeaders]);

    const loadMessages = useCallback(async (threadId: number, silent = false) => {
        if (!silent) setLoadingMessages(true);
        try {
            const response = await fetch(`${CONFIG.API_BASE_URL}/chat/threads/${threadId}/messages`, {
                headers: await getAuthHeaders(),
            });
            const payload = await response.json();
            if (response.ok) {
                const newMsgs = payload?.messages || [];
                setMessages((prev) => {
                    if (prev.length !== newMsgs.length || (newMsgs.length > 0 && prev[prev.length - 1]?.id !== newMsgs[newMsgs.length - 1]?.id)) {
                        return newMsgs;
                    }
                    return prev;
                });
            }
        } catch {
            /* silent */
        } finally {
            if (!silent) setLoadingMessages(false);
        }
    }, [getAuthHeaders]);

    const markAsRead = useCallback(async (threadId: number) => {
        try {
            await fetch(`${CONFIG.API_BASE_URL}/chat/threads/${threadId}/read`, {
                method: 'PATCH',
                headers: await getAuthHeaders(),
            });
        } catch {
            /* silent */
        }
    }, [getAuthHeaders]);

    const sendMessage = useCallback(async () => {
        if (!draft.trim() || !activeThread) return;
        setSending(true);
        const body = draft.trim();
        setDraft('');

        const optimisticMsg: ChatMessage = {
            id: Date.now(),
            sender_type: 'employee',
            sender_id: 0,
            message: body,
            created_at: new Date().toISOString(),
        };
        setMessages((prev) => [...prev, optimisticMsg]);

        try {
            const response = await fetch(`${CONFIG.API_BASE_URL}/chat/threads/${activeThread.id}/messages`, {
                method: 'POST',
                headers: await getAuthHeaders(),
                body: JSON.stringify({ message: body }),
            });
            if (response.ok) {
                await loadMessages(activeThread.id, true);
                await loadThreads(true);
            } else {
                setMessages((prev) => prev.filter((m) => m.id !== optimisticMsg.id));
            }
        } catch {
            setMessages((prev) => prev.filter((m) => m.id !== optimisticMsg.id));
        } finally {
            setSending(false);
        }
    }, [draft, activeThread, getAuthHeaders, loadMessages, loadThreads]);

    useEffect(() => {
        loadThreads();
    }, [loadThreads]);

    useEffect(() => {
        if (activeThread) {
            loadMessages(activeThread.id);
            markAsRead(activeThread.id);
        }
    }, [activeThread?.id]);

    // Poll
    useEffect(() => {
        const interval = setInterval(() => {
            loadThreads(true);
            if (activeThread) loadMessages(activeThread.id, true);
        }, 5000);
        return () => clearInterval(interval);
    }, [activeThread?.id, loadThreads, loadMessages]);

    // Auto-scroll
    useEffect(() => {
        if (messages.length > 0) {
            setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 150);
        }
    }, [messages]);

    const openThread = (thread: ChatThread) => {
        setActiveThread(thread);
        setMessages([]);
    };

    // ─── Thread list view ─────────────────────────────────
    if (!activeThread) {
        return (
            <SafeAreaView style={styles.container} edges={['top']}>
                <View style={styles.header}>
                    <Text style={styles.headerTitle}>Client Messages</Text>
                    <Text style={styles.headerSubtitle}>
                        {threads.filter((t) => !t.is_read_by_admin).length > 0
                            ? `${threads.filter((t) => !t.is_read_by_admin).length} unread`
                            : 'All caught up'}
                    </Text>
                </View>

                {loading && threads.length === 0 ? (
                    <View style={styles.loadingWrap}>
                        <ActivityIndicator size="small" color="#1e293b" />
                    </View>
                ) : threads.length === 0 ? (
                    <View style={styles.emptyState}>
                        <Ionicons name="chatbubbles-outline" size={48} color="#cbd5e1" />
                        <Text style={styles.emptyText}>No client messages yet</Text>
                        <Text style={styles.emptyHint}>Messages from clients will appear here</Text>
                    </View>
                ) : (
                    <FlatList
                        data={threads}
                        keyExtractor={(item) => String(item.id)}
                        renderItem={({ item }) => (
                            <TouchableOpacity
                                style={styles.threadRow}
                                onPress={() => openThread(item)}
                                activeOpacity={0.6}
                            >
                                <View style={[styles.avatar, { backgroundColor: getAvatarColor(item.client_id) }]}>
                                    <Text style={styles.avatarText}>
                                        {getInitials(item.client_company_name || item.client_name || 'C')}
                                    </Text>
                                </View>
                                <View style={styles.threadInfo}>
                                    <View style={styles.threadTopRow}>
                                        <Text style={styles.threadName} numberOfLines={1}>
                                            {item.client_company_name || item.client_name || 'Client'}
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
                                            {item.last_message_sender === 'user' || item.last_message_sender === 'employee'
                                                ? 'You: '
                                                : ''}
                                            {item.last_message || 'No messages yet'}
                                        </Text>
                                        {!item.is_read_by_admin && (
                                            <View style={styles.unreadBadge}>
                                                <Text style={styles.unreadText}>!</Text>
                                            </View>
                                        )}
                                    </View>
                                </View>
                            </TouchableOpacity>
                        )}
                    />
                )}
            </SafeAreaView>
        );
    }

    // ─── Conversation view ────────────────────────────────
    const renderMessage = ({ item, index }: { item: ChatMessage; index: number }) => {
        const isClient = item.sender_type === 'client';
        const showDateHeader = index === 0 || !isSameDay(item.created_at, messages[index - 1].created_at);

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
                        <View style={[styles.msgAvatar, { backgroundColor: getAvatarColor(item.sender_id) }]}>
                            <Text style={styles.msgAvatarText}>
                                {getInitials(activeThread.client_company_name || activeThread.client_name || 'C')}
                            </Text>
                        </View>
                    )}
                    <View style={isClient ? styles.bubbleClient : styles.bubbleMe}>
                        {isClient && (
                            <Text style={styles.senderLabel}>
                                {activeThread.client_name || 'Client'}
                            </Text>
                        )}
                        <Text style={styles.msgText}>{item.message}</Text>
                        <Text style={isClient ? styles.timeLeft : styles.timeRight}>
                            {formatTime(item.created_at)}
                        </Text>
                    </View>
                </View>
            </View>
        );
    };

    return (
        <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
            <KeyboardAvoidingView
                style={styles.container}
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            >
                {/* Header */}
                <View style={styles.convHeader}>
                    <TouchableOpacity onPress={() => setActiveThread(null)} style={styles.backBtn} activeOpacity={0.6}>
                        <Ionicons name="arrow-back" size={24} color="#ffffff" />
                    </TouchableOpacity>
                    <View style={[styles.convAvatar, { backgroundColor: getAvatarColor(activeThread.client_id) }]}>
                        <Text style={styles.convAvatarText}>
                            {getInitials(activeThread.client_company_name || activeThread.client_name || 'C')}
                        </Text>
                    </View>
                    <View style={styles.convInfo}>
                        <Text style={styles.convName} numberOfLines={1}>
                            {activeThread.client_company_name || activeThread.client_name || 'Client'}
                        </Text>
                        {activeThread.client_email && (
                            <Text style={styles.convSub}>{activeThread.client_email}</Text>
                        )}
                    </View>
                </View>

                {/* Messages */}
                {loadingMessages && messages.length === 0 ? (
                    <View style={styles.loadingWrap}>
                        <ActivityIndicator size="small" color="#1e293b" />
                        <Text style={styles.loadingText}>Loading messages...</Text>
                    </View>
                ) : (
                    <FlatList
                        ref={flatListRef}
                        data={messages}
                        keyExtractor={(item) => String(item.id)}
                        contentContainerStyle={styles.messagesContent}
                        renderItem={renderMessage}
                        onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: false })}
                        ListEmptyComponent={() => (
                            <View style={styles.emptyState}>
                                <Ionicons name="chatbubbles-outline" size={40} color="#cbd5e1" />
                                <Text style={styles.emptyText}>No messages yet</Text>
                            </View>
                        )}
                    />
                )}

                {/* Input */}
                <View style={styles.inputBar}>
                    <TextInput
                        style={styles.input}
                        placeholder="Type a message..."
                        placeholderTextColor="#94a3b8"
                        value={draft}
                        onChangeText={setDraft}
                        multiline
                    />
                    <TouchableOpacity
                        style={[styles.sendBtn, (!draft.trim() || sending) && styles.sendBtnDisabled]}
                        onPress={sendMessage}
                        disabled={!draft.trim() || sending}
                        activeOpacity={0.7}
                    >
                        {sending ? (
                            <ActivityIndicator size="small" color="#ffffff" />
                        ) : (
                            <Ionicons name="send" size={18} color="#ffffff" />
                        )}
                    </TouchableOpacity>
                </View>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f8fafc' },
    // ─── Header ───
    header: {
        paddingHorizontal: 20,
        paddingVertical: 16,
        backgroundColor: '#1e293b',
    },
    headerTitle: { fontSize: 22, fontWeight: '800', color: '#ffffff' },
    headerSubtitle: { fontSize: 12, color: '#94a3b8', marginTop: 2 },
    // ─── Thread list ───
    threadRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 14,
        borderBottomWidth: 1,
        borderBottomColor: '#f1f5f9',
        backgroundColor: '#ffffff',
    },
    avatar: {
        width: 48,
        height: 48,
        borderRadius: 24,
        alignItems: 'center',
        justifyContent: 'center',
    },
    avatarText: { color: '#ffffff', fontSize: 16, fontWeight: '700' },
    threadInfo: { flex: 1, marginLeft: 12 },
    threadTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    threadName: { fontSize: 15, fontWeight: '700', color: '#1e293b', flex: 1 },
    threadTime: { fontSize: 11, color: '#94a3b8', marginLeft: 8 },
    threadSubName: { fontSize: 12, color: '#64748b', marginTop: 1 },
    threadBottomRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 2 },
    threadLastMsg: { fontSize: 13, color: '#94a3b8', flex: 1 },
    unreadBadge: {
        width: 20,
        height: 20,
        borderRadius: 10,
        backgroundColor: '#22c55e',
        alignItems: 'center',
        justifyContent: 'center',
        marginLeft: 8,
    },
    unreadText: { color: '#ffffff', fontSize: 10, fontWeight: '800' },
    // ─── Conversation header ───
    convHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        paddingHorizontal: 12,
        paddingVertical: 10,
        backgroundColor: '#1e293b',
    },
    backBtn: { padding: 4 },
    convAvatar: {
        width: 40,
        height: 40,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
    },
    convAvatarText: { color: '#ffffff', fontSize: 15, fontWeight: '700' },
    convInfo: { flex: 1 },
    convName: { fontSize: 16, fontWeight: '700', color: '#ffffff' },
    convSub: { fontSize: 11, color: '#94a3b8' },
    // ─── Messages ───
    messagesContent: { paddingHorizontal: 12, paddingVertical: 8 },
    dateHeaderWrap: { alignItems: 'center', marginVertical: 12 },
    dateHeaderBadge: {
        backgroundColor: '#e2e8f0',
        paddingHorizontal: 14,
        paddingVertical: 4,
        borderRadius: 12,
    },
    dateHeaderText: { fontSize: 11, color: '#64748b', fontWeight: '600' },
    msgRowLeft: { flexDirection: 'row', marginBottom: 6, alignItems: 'flex-end' },
    msgRowRight: { flexDirection: 'row', justifyContent: 'flex-end', marginBottom: 6 },
    msgAvatar: {
        width: 28,
        height: 28,
        borderRadius: 14,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 6,
    },
    msgAvatarText: { color: '#ffffff', fontSize: 10, fontWeight: '700' },
    bubbleClient: {
        backgroundColor: '#ffffff',
        borderRadius: 12,
        borderBottomLeftRadius: 4,
        paddingHorizontal: 12,
        paddingVertical: 8,
        maxWidth: '75%',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 1,
    },
    bubbleMe: {
        backgroundColor: '#d9fdd3',
        borderRadius: 12,
        borderBottomRightRadius: 4,
        paddingHorizontal: 12,
        paddingVertical: 8,
        maxWidth: '75%',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 1,
    },
    senderLabel: { fontSize: 11, fontWeight: '700', color: '#3b82f6', marginBottom: 2 },
    msgText: { fontSize: 14, color: '#1e293b', lineHeight: 20 },
    timeLeft: { fontSize: 10, color: '#94a3b8', marginTop: 4 },
    timeRight: { fontSize: 10, color: '#64748b', marginTop: 4, textAlign: 'right' },
    // ─── Input ───
    inputBar: {
        flexDirection: 'row',
        alignItems: 'flex-end',
        paddingHorizontal: 12,
        paddingVertical: 8,
        backgroundColor: '#ffffff',
        borderTopWidth: 1,
        borderTopColor: '#e2e8f0',
    },
    input: {
        flex: 1,
        backgroundColor: '#f1f5f9',
        borderRadius: 20,
        paddingHorizontal: 16,
        paddingVertical: 10,
        fontSize: 14,
        color: '#1e293b',
        maxHeight: 100,
    },
    sendBtn: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#25d366',
        alignItems: 'center',
        justifyContent: 'center',
        marginLeft: 8,
    },
    sendBtnDisabled: { backgroundColor: '#94a3b8' },
    // ─── Common ───
    loadingWrap: { flex: 1, alignItems: 'center', justifyContent: 'center' },
    loadingText: { fontSize: 13, color: '#94a3b8', marginTop: 8 },
    emptyState: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 60 },
    emptyText: { fontSize: 16, fontWeight: '600', color: '#94a3b8', marginTop: 12 },
    emptyHint: { fontSize: 13, color: '#cbd5e1', marginTop: 4 },
});
