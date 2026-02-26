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
import { useLocalSearchParams, useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { CONFIG } from '../../constants/config';

type ChatMessage = {
    id: number;
    sender_type: 'client' | 'user' | 'employee';
    sender_id: number;
    message: string;
    created_at: string;
};

const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));

    const hours = date.getHours();
    const minutes = date.getMinutes();
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const h = hours % 12 || 12;
    const m = minutes.toString().padStart(2, '0');
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

    const months = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December',
    ];
    return `${months[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`;
};

const isSameDay = (d1: string, d2: string) => {
    const a = new Date(d1);
    const b = new Date(d2);
    return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
};

export default function ChatConversationScreen() {
    const router = useRouter();
    const params = useLocalSearchParams<{ employeeId?: string; name?: string; role?: string }>();

    // If employeeId is provided, use per-employee endpoints; otherwise use direct admin endpoints
    const employeeId = params.employeeId ? Number(params.employeeId) : null;
    const contactName = params.name || 'Admin';
    const contactRole = params.role || 'Management';
    const isAdmin = !employeeId;

    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [loading, setLoading] = useState(true);
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

    // Build endpoint URLs based on whether chatting with admin or employee
    const getMessagesUrl = useCallback(() => {
        if (isAdmin) return `${CONFIG.API_BASE_URL}/chat/direct/messages`;
        return `${CONFIG.API_BASE_URL}/chat/thread/messages?employeeId=${employeeId}`;
    }, [isAdmin, employeeId]);

    const getSendUrl = useCallback(() => {
        if (isAdmin) return `${CONFIG.API_BASE_URL}/chat/direct/messages`;
        return `${CONFIG.API_BASE_URL}/chat/thread/messages?employeeId=${employeeId}`;
    }, [isAdmin, employeeId]);

    const getReadUrl = useCallback(() => {
        if (isAdmin) return `${CONFIG.API_BASE_URL}/chat/direct/read`;
        return `${CONFIG.API_BASE_URL}/chat/thread/read?employeeId=${employeeId}`;
    }, [isAdmin, employeeId]);

    const loadMessages = useCallback(async (silent = false) => {
        if (!silent) setLoading(true);
        try {
            const response = await fetch(getMessagesUrl(), {
                headers: await getAuthHeaders(),
            });
            const payload = await response.json();
            if (response.ok) {
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
        } catch (error) {
            if (!silent) console.warn('Failed to load messages', error);
        } finally {
            if (!silent) setLoading(false);
        }
    }, [getAuthHeaders, getMessagesUrl]);

    const markAsRead = useCallback(async () => {
        try {
            await fetch(getReadUrl(), {
                method: 'PATCH',
                headers: await getAuthHeaders(),
            });
        } catch {
            /* silent */
        }
    }, [getAuthHeaders, getReadUrl]);

    const sendMessage = useCallback(async () => {
        if (!draft.trim()) return;
        setSending(true);
        const body = draft.trim();
        setDraft('');

        const optimisticMsg: ChatMessage = {
            id: Date.now(),
            sender_type: 'client',
            sender_id: 0,
            message: body,
            created_at: new Date().toISOString(),
        };
        setMessages((prev) => [...prev, optimisticMsg]);

        try {
            const response = await fetch(getSendUrl(), {
                method: 'POST',
                headers: await getAuthHeaders(),
                body: JSON.stringify({ message: body }),
            });
            if (response.ok) {
                await loadMessages(true);
            } else {
                setMessages((prev) => prev.filter((m) => m.id !== optimisticMsg.id));
            }
        } catch (error) {
            setMessages((prev) => prev.filter((m) => m.id !== optimisticMsg.id));
            console.warn('Failed to send message', error);
        } finally {
            setSending(false);
        }
    }, [draft, getAuthHeaders, getSendUrl, loadMessages]);

    // Initial load
    useEffect(() => {
        loadMessages();
        markAsRead();
    }, [loadMessages, markAsRead]);

    // Poll every 5 seconds
    useEffect(() => {
        const interval = setInterval(() => {
            loadMessages(true);
        }, 5000);
        return () => clearInterval(interval);
    }, [loadMessages]);

    // Auto-scroll
    useEffect(() => {
        if (messages.length > 0) {
            setTimeout(() => {
                flatListRef.current?.scrollToEnd({ animated: true });
            }, 150);
        }
    }, [messages]);

    const avatarIcon = isAdmin ? 'shield-checkmark' : 'person';
    const avatarColor = isAdmin ? '#1e293b' : '#3b82f6';

    const renderMessage = useCallback(
        ({ item, index }: { item: ChatMessage; index: number }) => {
            const isClient = item.sender_type === 'client';
            const showDateHeader =
                index === 0 || !isSameDay(item.created_at, messages[index - 1].created_at);

            return (
                <View>
                    {showDateHeader && (
                        <View style={styles.dateHeaderWrap}>
                            <View style={styles.dateHeaderBadge}>
                                <Text style={styles.dateHeaderText}>
                                    {formatDateHeader(item.created_at)}
                                </Text>
                            </View>
                        </View>
                    )}
                    <View style={isClient ? styles.msgRowRight : styles.msgRowLeft}>
                        {!isClient && (
                            <View style={[styles.msgAvatar, { backgroundColor: avatarColor }]}>
                                <Ionicons name={avatarIcon} size={13} color="#ffffff" />
                            </View>
                        )}
                        <View style={isClient ? styles.bubbleClient : styles.bubbleAdmin}>
                            {!isClient && (
                                <Text style={styles.senderLabel}>{contactName}</Text>
                            )}
                            <Text style={styles.msgText}>{item.message}</Text>
                            <Text style={isClient ? styles.timeClient : styles.timeAdmin}>
                                {formatTime(item.created_at)}
                            </Text>
                        </View>
                    </View>
                </View>
            );
        },
        [messages, avatarColor, avatarIcon, contactName],
    );

    return (
        <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
            <KeyboardAvoidingView
                style={styles.container}
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
            >
                {/* Header with back button */}
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} activeOpacity={0.6}>
                        <Ionicons name="arrow-back" size={24} color="#ffffff" />
                    </TouchableOpacity>
                    <View style={[styles.headerAvatar, { borderColor: isAdmin ? '#334155' : '#60a5fa' }]}>
                        <Ionicons name={avatarIcon} size={18} color="#ffffff" />
                        <View style={styles.headerOnlineDot} />
                    </View>
                    <View style={styles.headerInfo}>
                        <Text style={styles.headerName} numberOfLines={1}>
                            {contactName}
                        </Text>
                        <Text style={styles.headerRole}>{contactRole}</Text>
                    </View>
                    <TouchableOpacity style={styles.headerAction} activeOpacity={0.6}>
                        <Ionicons name="call-outline" size={20} color="#94a3b8" />
                    </TouchableOpacity>
                </View>

                {/* Messages */}
                {loading && messages.length === 0 ? (
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
                        onContentSizeChange={() => {
                            flatListRef.current?.scrollToEnd({ animated: false });
                        }}
                        ListEmptyComponent={() => (
                            <View style={styles.emptyState}>
                                <View style={[styles.emptyAvatar, { backgroundColor: avatarColor }]}>
                                    <Ionicons name={avatarIcon} size={32} color="#ffffff" />
                                </View>
                                <Text style={styles.emptyName}>{contactName}</Text>
                                <Text style={styles.emptyRole}>{contactRole}</Text>
                                <Text style={styles.emptyHint}>
                                    Send a message to start the conversation
                                </Text>
                            </View>
                        )}
                    />
                )}

                {/* Input bar */}
                <View style={styles.inputBar}>
                    <TextInput
                        style={styles.input}
                        placeholder="Type a message..."
                        placeholderTextColor="#94a3b8"
                        value={draft}
                        onChangeText={setDraft}
                        multiline
                        returnKeyType="default"
                    />
                    <TouchableOpacity
                        style={[
                            styles.sendBtn,
                            (!draft.trim() || sending) && styles.sendBtnDisabled,
                        ]}
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
    container: {
        flex: 1,
        backgroundColor: '#ece5dd',
    },
    // ─── Header ───
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        paddingHorizontal: 12,
        paddingVertical: 10,
        backgroundColor: '#1e293b',
    },
    backBtn: {
        padding: 4,
    },
    headerAvatar: {
        width: 40,
        height: 40,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#1e293b',
        borderWidth: 2,
        borderColor: '#334155',
        position: 'relative',
    },

    headerOnlineDot: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        width: 12,
        height: 12,
        borderRadius: 6,
        backgroundColor: '#22c55e',
        borderWidth: 2,
        borderColor: '#1e293b',
    },
    headerInfo: {
        flex: 1,
    },
    headerName: {
        fontSize: 16,
        fontWeight: '700',
        color: '#ffffff',
    },
    headerRole: {
        fontSize: 11,
        color: '#94a3b8',
        marginTop: 1,
    },
    headerAction: {
        padding: 8,
    },
    // ─── Messages ───
    messagesContent: {
        paddingHorizontal: 12,
        paddingVertical: 10,
        flexGrow: 1,
    },
    dateHeaderWrap: {
        alignItems: 'center',
        marginVertical: 12,
    },
    dateHeaderBadge: {
        backgroundColor: '#ffffff',
        paddingHorizontal: 14,
        paddingVertical: 5,
        borderRadius: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.08,
        shadowRadius: 2,
        elevation: 1,
    },
    dateHeaderText: {
        fontSize: 11,
        color: '#64748b',
        fontWeight: '600',
    },
    msgRowLeft: {
        flexDirection: 'row',
        alignItems: 'flex-end',
        marginBottom: 3,
        gap: 6,
    },
    msgRowRight: {
        alignItems: 'flex-end',
        marginBottom: 3,
    },
    msgAvatar: {
        width: 26,
        height: 26,
        borderRadius: 13,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 1,
    },

    bubbleAdmin: {
        backgroundColor: '#ffffff',
        borderRadius: 10,
        borderTopLeftRadius: 3,
        paddingHorizontal: 10,
        paddingVertical: 7,
        maxWidth: '75%',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.04,
        shadowRadius: 1,
        elevation: 1,
    },
    bubbleClient: {
        backgroundColor: '#d9fdd3',
        borderRadius: 10,
        borderTopRightRadius: 3,
        paddingHorizontal: 10,
        paddingVertical: 7,
        maxWidth: '80%',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.04,
        shadowRadius: 1,
        elevation: 1,
    },
    senderLabel: {
        fontSize: 11,
        fontWeight: '700',
        marginBottom: 1,
        color: '#1e293b',
    },
    msgText: {
        color: '#0f172a',
        fontSize: 14,
        lineHeight: 20,
    },
    timeAdmin: {
        fontSize: 10,
        color: '#94a3b8',
        textAlign: 'right',
        marginTop: 3,
    },
    timeClient: {
        fontSize: 10,
        color: '#64748b',
        textAlign: 'right',
        marginTop: 3,
    },
    // ─── Input ───
    inputBar: {
        flexDirection: 'row',
        alignItems: 'flex-end',
        gap: 8,
        paddingHorizontal: 10,
        paddingVertical: 8,
        backgroundColor: '#f0f2f5',
        borderTopWidth: 1,
        borderTopColor: '#e2e8f0',
    },
    input: {
        flex: 1,
        minHeight: 42,
        maxHeight: 120,
        paddingHorizontal: 16,
        paddingVertical: 10,
        backgroundColor: '#ffffff',
        borderRadius: 24,
        fontSize: 14,
        color: '#0f172a',
    },
    sendBtn: {
        width: 42,
        height: 42,
        borderRadius: 21,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#25d366',
    },
    sendBtnDisabled: {
        backgroundColor: '#94a3b8',
    },
    // ─── Empty ───
    emptyState: {
        alignItems: 'center',
        justifyContent: 'center',
        flex: 1,
        paddingHorizontal: 40,
        paddingTop: 60,
    },
    emptyAvatar: {
        width: 80,
        height: 80,
        borderRadius: 40,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#1e293b',
        marginBottom: 14,
    },

    emptyName: {
        fontSize: 18,
        fontWeight: '700',
        color: '#1e293b',
        marginBottom: 2,
    },
    emptyRole: {
        fontSize: 13,
        color: '#64748b',
        marginBottom: 16,
    },
    emptyHint: {
        fontSize: 13,
        color: '#94a3b8',
        textAlign: 'center',
        lineHeight: 18,
    },
    // ─── Loading ───
    loadingWrap: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
    },
    loadingText: {
        fontSize: 13,
        color: '#94a3b8',
    },
});
