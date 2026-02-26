import { Tabs } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import { Platform, View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { CONFIG } from '../../constants/config';

export default function ClientTabLayout() {
    const [unreadCount, setUnreadCount] = useState(0);

    const checkUnread = useCallback(async () => {
        try {
            const token = await AsyncStorage.getItem('token');
            if (!token) return;
            const res = await fetch(`${CONFIG.API_BASE_URL}/chat/team`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (!res.ok) return;
            const team = await res.json();
            if (!Array.isArray(team)) return;
            let total = 0;
            for (const member of team) {
                try {
                    const r = await fetch(`${CONFIG.API_BASE_URL}/chat/thread/messages?employeeId=${member.id}`, {
                        headers: { Authorization: `Bearer ${token}` },
                    });
                    if (r.ok) {
                        const data = await r.json();
                        if (data?.thread && !data.thread.is_read_by_client) total++;
                    }
                } catch { /* silent */ }
            }
            setUnreadCount(total);
        } catch { /* silent */ }
    }, []);

    useEffect(() => {
        checkUnread();
        const interval = setInterval(checkUnread, 10000);
        return () => clearInterval(interval);
    }, [checkUnread]);

    return (
        <Tabs
            screenOptions={{
                tabBarActiveTintColor: '#1e293b',
                tabBarInactiveTintColor: '#94a3b8',
                headerShown: false,
                tabBarStyle: {
                    backgroundColor: '#ffffff',
                    borderTopWidth: 1,
                    borderTopColor: '#f1f5f9',
                    height: Platform.OS === 'ios' ? 88 : 68,
                    paddingBottom: Platform.OS === 'ios' ? 28 : 12,
                    paddingTop: 12,
                },
                tabBarLabelStyle: {
                    fontSize: 10,
                    fontWeight: '700',
                },
            }}>
            <Tabs.Screen
                name="index"
                options={{
                    title: 'Home',
                    tabBarIcon: ({ color, focused }) => (
                        <Ionicons name={focused ? 'home' : 'home-outline'} size={24} color={color} />
                    ),
                }}
            />
            <Tabs.Screen
                name="sites"
                options={{
                    title: 'Sites',
                    tabBarIcon: ({ color, focused }) => (
                        <Ionicons name={focused ? 'business' : 'business-outline'} size={24} color={color} />
                    ),
                }}
            />
            <Tabs.Screen
                name="attendance"
                options={{
                    title: 'Attendance',
                    tabBarIcon: ({ color, focused }) => (
                        <Ionicons name={focused ? 'time' : 'time-outline'} size={24} color={color} />
                    ),
                }}
            />
            <Tabs.Screen
                name="payments"
                options={{
                    title: 'Payments',
                    tabBarIcon: ({ color, focused }) => (
                        <Ionicons name={focused ? 'card' : 'card-outline'} size={24} color={color} />
                    ),
                }}
            />
            <Tabs.Screen
                name="complaints"
                options={{
                    title: 'Complaints',
                    tabBarIcon: ({ color, focused }) => (
                        <Ionicons name={focused ? 'alert-circle' : 'alert-circle-outline'} size={24} color={color} />
                    ),
                }}
            />
            <Tabs.Screen
                name="chat"
                options={{
                    title: 'Chat',
                    tabBarIcon: ({ color, focused }) => (
                        <View>
                            <Ionicons name={focused ? 'chatbubbles' : 'chatbubbles-outline'} size={24} color={color} />
                            {unreadCount > 0 && <View style={styles.redDot} />}
                        </View>
                    ),
                }}
            />
            <Tabs.Screen
                name="chat-conversation"
                options={{
                    href: null,
                }}
            />
            <Tabs.Screen
                name="site-detail"
                options={{
                    href: null,
                }}
            />
            <Tabs.Screen
                name="guard-detail"
                options={{
                    href: null,
                }}
            />
        </Tabs>
    );
}

const styles = StyleSheet.create({
    redDot: {
        position: 'absolute',
        top: -2,
        right: -4,
        width: 10,
        height: 10,
        borderRadius: 5,
        backgroundColor: '#ef4444',
        borderWidth: 1.5,
        borderColor: '#ffffff',
    },
});
