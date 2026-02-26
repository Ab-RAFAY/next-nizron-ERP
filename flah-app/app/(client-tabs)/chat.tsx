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

type TeamMember = {
    id: number;
    employee_id: string;
    full_name: string;
    email: string;
    phone: string;
    designation: string;
    role: string;
};

type ChatContact = {
    type: 'admin' | 'employee';
    employeeId?: number;
    name: string;
    role: string;
    thread?: ThreadInfo | null;
};

export default function ChatScreen() {
    const [contacts, setContacts] = useState<ChatContact[]>([]);
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

    const loadContacts = useCallback(async (silent = false) => {
        if (!silent) setLoading(true);
        try {
            const headers = await getAuthHeaders();

            // Fetch admin direct thread + team members in parallel
            const [adminRes, teamRes] = await Promise.all([
                fetch(`${CONFIG.API_BASE_URL}/chat/direct/thread`, { headers }),
                fetch(`${CONFIG.API_BASE_URL}/chat/team`, { headers }),
            ]);

            const contactList: ChatContact[] = [];

            // Admin contact (always first)
            let adminThread: ThreadInfo | null = null;
            if (adminRes.ok) {
                const adminData = await adminRes.json();
                adminThread = adminData?.thread || adminData || null;
            }
            contactList.push({
                type: 'admin',
                name: 'Admin',
                role: 'Management',
                thread: adminThread,
            });

            // Team members (managers with chat permission)
            if (teamRes.ok) {
                const team: TeamMember[] = await teamRes.json();
                if (Array.isArray(team) && team.length > 0) {
                    // Fetch thread info for each team member
                    const threadPromises = team.map(async (member) => {
                        try {
                            const res = await fetch(
                                `${CONFIG.API_BASE_URL}/chat/thread/messages?employeeId=${member.id}`,
                                { headers }
                            );
                            if (res.ok) {
                                const data = await res.json();
                                return { memberId: member.id, thread: data?.thread || null };
                            }
                        } catch { /* silent */ }
                        return { memberId: member.id, thread: null };
                    });

                    const threadResults = await Promise.all(threadPromises);
                    const threadMap = new Map(threadResults.map(r => [r.memberId, r.thread]));

                    for (const member of team) {
                        contactList.push({
                            type: 'employee',
                            employeeId: member.id,
                            name: member.full_name,
                            role: member.role || member.designation || 'Manager',
                            thread: threadMap.get(member.id) || null,
                        });
                    }
                }
            }

            setContacts(contactList);
        } catch {
            /* silent */
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [getAuthHeaders]);

    useEffect(() => {
        loadContacts();
    }, [loadContacts]);

    // Poll for new messages every 10 seconds
    useEffect(() => {
        const interval = setInterval(() => loadContacts(true), 10000);
        return () => clearInterval(interval);
    }, [loadContacts]);

    const onRefresh = useCallback(() => {
        setRefreshing(true);
        loadContacts(true);
    }, [loadContacts]);

    const openChat = useCallback((contact: ChatContact) => {
        if (contact.type === 'admin') {
            router.push({
                pathname: '/(client-tabs)/chat-conversation',
                params: { name: 'Admin', role: 'Management' },
            });
        } else {
            router.push({
                pathname: '/(client-tabs)/chat-conversation',
                params: {
                    employeeId: String(contact.employeeId),
                    name: contact.name,
                    role: contact.role,
                },
            });
        }
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

    const getAvatarIcon = (contact: ChatContact): keyof typeof Ionicons.glyphMap => {
        return contact.type === 'admin' ? 'shield-checkmark' : 'person';
    };

    const getAvatarColor = (contact: ChatContact) => {
        return contact.type === 'admin' ? '#1e293b' : '#3b82f6';
    };

    return (
        <SafeAreaView style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Chat</Text>
                <Text style={styles.headerSubtitle}>Contact Admin & Managers</Text>
            </View>

            {/* Info bar */}
            <View style={styles.infoBar}>
                <Ionicons name="shield-checkmark" size={16} color="#3b82f6" />
                <Text style={styles.infoText}>
                    Messages are private between you and your contacts
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
                    {contacts.map((contact) => {
                        const isUnread = contact.thread?.is_read_by_client === false;
                        return (
                            <TouchableOpacity
                                key={contact.type === 'admin' ? 'admin' : `emp-${contact.employeeId}`}
                                style={styles.chatCard}
                                onPress={() => openChat(contact)}
                                activeOpacity={0.6}
                            >
                                <View style={[styles.avatar, { backgroundColor: getAvatarColor(contact) }]}>
                                    <Ionicons name={getAvatarIcon(contact)} size={24} color="#ffffff" />
                                    <View style={styles.onlineDot} />
                                </View>
                                <View style={styles.chatInfo}>
                                    <View style={styles.topRow}>
                                        <Text style={[styles.chatName, isUnread && styles.unreadName]} numberOfLines={1}>
                                            {contact.name}
                                        </Text>
                                        {contact.thread?.last_message_at && (
                                            <Text style={[styles.timeText, isUnread && styles.unreadTime]}>
                                                {formatTime(contact.thread.last_message_at)}
                                            </Text>
                                        )}
                                    </View>
                                    <View style={styles.roleRow}>
                                        <Text style={styles.roleText}>{contact.role}</Text>
                                    </View>
                                    <View style={styles.bottomRow}>
                                        <Text style={[styles.lastMsg, isUnread && styles.unreadMsg]} numberOfLines={1}>
                                            {contact.thread?.last_message
                                                ? `${contact.thread.last_message_sender === 'client' ? 'You: ' : ''}${contact.thread.last_message}`
                                                : 'Tap to start a conversation'}
                                        </Text>
                                        {isUnread && <View style={styles.unreadDot} />}
                                    </View>
                                </View>
                                <Ionicons name="chevron-forward" size={20} color="#cbd5e1" />
                            </TouchableOpacity>
                        );
                    })}

                    {contacts.length <= 1 && (
                        <View style={styles.hintWrap}>
                            <Ionicons name="chatbubble-ellipses-outline" size={40} color="#e2e8f0" />
                            <Text style={styles.hintText}>
                                Send messages directly to admin or managers.{'\n'}They will respond as soon as possible.
                            </Text>
                        </View>
                    )}
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
        paddingVertical: 16,
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
    roleRow: {
        marginTop: 1,
    },
    roleText: {
        fontSize: 11,
        color: '#64748b',
        fontWeight: '500',
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
