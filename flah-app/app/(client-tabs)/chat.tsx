import React, { useCallback, useEffect, useState } from 'react';
import {
    ActivityIndicator,
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { CONFIG } from '../../constants/config';

type ThreadInfo = {
    id: number;
    last_message?: string;
    last_message_at?: string;
    last_message_sender?: string;
    is_read_by_client?: boolean;
};

export default function ChatScreen() {
    const [thread, setThread] = useState<ThreadInfo | null>(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const router = useRouter();

    const getAuthHeaders = useCallback(async () => {
        const token = await AsyncStorage.getItem('token');
        return {
            'Content-Type': 'application/json',
            Authorization: token ? `Bearer ${token}` : '',
        };
    }, []);

    const loadThread = useCallback(async (silent = false) => {
        if (!silent) setLoading(true);
        try {
            const headers = await getAuthHeaders();
            const response = await fetch(`${CONFIG.API_BASE_URL}/chat/direct/thread`, { headers });
            if (response.ok) {
                const data = await response.json();
                if (data?.thread) {
                    setThread(data.thread);
                }
            }
        } catch {
            /* silent */
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [getAuthHeaders]);

    useEffect(() => {
        loadThread();
    }, [loadThread]);

    // Poll for new messages every 10 seconds
    useEffect(() => {
        const interval = setInterval(() => loadThread(true), 10000);
        return () => clearInterval(interval);
    }, [loadThread]);

    const onRefresh = useCallback(() => {
        setRefreshing(true);
        loadThread(true);
    }, [loadThread]);

    const openChat = useCallback(() => {
        router.push({ pathname: '/(client-tabs)/chat-conversation' });
    }, [router]);

    const formatTime = (dateStr: string) => {
        const date = new Date(dateStr);
        const now = new Date();
        const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
        const h = date.getHours() % 12 || 12;
        const m = date.getMinutes().toString().padStart(2, '0');
        const ampm = date.getHours() >= 12 ? 'PM' : 'AM';
        const timeStr = `${h}:${m} ${ampm}`;
        if (diffDays === 0) return timeStr;
        if (diffDays === 1) return 'Yesterday';
        return `${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear()}`;
    };

    const isUnread = thread?.is_read_by_client === false;

    return (
        <SafeAreaView style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Chat</Text>
                <Text style={styles.headerSubtitle}>Contact Admin</Text>
            </View>

            {/* Info bar */}
            <View style={styles.infoBar}>
                <Ionicons name="shield-checkmark" size={16} color="#3b82f6" />
                <Text style={styles.infoText}>
                    Messages are private between you and admin
                </Text>
            </View>

            {loading ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#1e293b" />
                    <Text style={styles.loadingText}>Loading...</Text>
                </View>
            ) : (
                <ScrollView
                    contentContainerStyle={styles.scrollContent}
                    refreshControl={
                        <RefreshControl
                            refreshing={refreshing}
                            onRefresh={onRefresh}
                            tintColor="#1e293b"
                        />
                    }
                >
                    {/* Admin chat card */}
                    <TouchableOpacity
                        style={styles.chatCard}
                        onPress={openChat}
                        activeOpacity={0.6}
                    >
                        <View style={styles.avatar}>
                            <Ionicons name="shield-checkmark" size={24} color="#ffffff" />
                            <View style={styles.onlineDot} />
                        </View>
                        <View style={styles.chatInfo}>
                            <View style={styles.topRow}>
                                <Text style={[styles.chatName, isUnread && styles.unreadName]} numberOfLines={1}>
                                    Admin
                                </Text>
                                {thread?.last_message_at && (
                                    <Text style={[styles.timeText, isUnread && styles.unreadTime]}>
                                        {formatTime(thread.last_message_at)}
                                    </Text>
                                )}
                            </View>
                            <View style={styles.bottomRow}>
                                <Text style={[styles.lastMsg, isUnread && styles.unreadMsg]} numberOfLines={1}>
                                    {thread?.last_message
                                        ? `${thread.last_message_sender === 'client' ? 'You: ' : ''}${thread.last_message}`
                                        : 'Tap to start a conversation'}
                                </Text>
                                {isUnread && <View style={styles.unreadDot} />}
                            </View>
                        </View>
                        <Ionicons name="chevron-forward" size={20} color="#cbd5e1" />
                    </TouchableOpacity>

                    {/* Helpful hint */}
                    <View style={styles.hintWrap}>
                        <Ionicons name="chatbubble-ellipses-outline" size={40} color="#e2e8f0" />
                        <Text style={styles.hintText}>
                            Send messages directly to admin.{'\n'}They will respond as soon as possible.
                        </Text>
                    </View>
                </ScrollView>
            )}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#ffffff',
    },
    header: {
        paddingHorizontal: 20,
        paddingTop: 16,
        paddingBottom: 12,
        backgroundColor: '#1e293b',
    },
    headerTitle: {
        fontSize: 26,
        fontWeight: '800',
        color: '#ffffff',
    },
    headerSubtitle: {
        fontSize: 13,
        color: '#94a3b8',
        marginTop: 2,
    },
    infoBar: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        paddingHorizontal: 20,
        paddingVertical: 10,
        backgroundColor: '#f0f9ff',
        borderBottomWidth: 1,
        borderBottomColor: '#e2e8f0',
    },
    infoText: {
        fontSize: 12,
        color: '#3b82f6',
        fontWeight: '500',
    },
    scrollContent: {
        flexGrow: 1,
    },
    chatCard: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 18,
        gap: 14,
        borderBottomWidth: 1,
        borderBottomColor: '#f1f5f9',
    },
    avatar: {
        width: 52,
        height: 52,
        borderRadius: 26,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#1e293b',
        position: 'relative',
    },
    onlineDot: {
        position: 'absolute',
        bottom: 1,
        right: 1,
        width: 14,
        height: 14,
        borderRadius: 7,
        backgroundColor: '#22c55e',
        borderWidth: 2.5,
        borderColor: '#ffffff',
    },
    chatInfo: {
        flex: 1,
    },
    topRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    chatName: {
        fontSize: 17,
        fontWeight: '600',
        color: '#0f172a',
        flex: 1,
    },
    unreadName: {
        fontWeight: '800',
    },
    timeText: {
        fontSize: 11,
        color: '#94a3b8',
        marginLeft: 8,
    },
    unreadTime: {
        color: '#22c55e',
        fontWeight: '700',
    },
    bottomRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 3,
    },
    lastMsg: {
        fontSize: 13,
        color: '#94a3b8',
        flex: 1,
    },
    unreadMsg: {
        color: '#475569',
        fontWeight: '600',
    },
    unreadDot: {
        width: 10,
        height: 10,
        borderRadius: 5,
        backgroundColor: '#22c55e',
        marginLeft: 8,
    },
    hintWrap: {
        alignItems: 'center',
        paddingTop: 60,
        paddingHorizontal: 40,
        gap: 14,
    },
    hintText: {
        fontSize: 13,
        color: '#94a3b8',
        textAlign: 'center',
        lineHeight: 19,
    },
    loadingContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        gap: 12,
    },
    loadingText: {
        fontSize: 14,
        color: '#94a3b8',
    },
});
