/**
 * app/(tabs)/_layout.tsx
 *
 * Admin tab bar. The unread-count badge is now driven by TanStack Query's
 * cached 'chatThreads' data (same key as chat.tsx) — zero extra network
 * requests. The query is invalidated whenever chat.tsx refreshes.
 */
import { Tabs } from 'expo-router';
import React from 'react';
import { Platform, View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { CONFIG } from '../../constants/config';

const THREADS_KEY = ['chatThreads'] as const;

async function fetchThreads() {
  const token = await AsyncStorage.getItem('token');
  if (!token) return [];
  const res = await fetch(`${CONFIG.API_BASE_URL}/chat/threads`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) return [];
  const data = await res.json();
  return Array.isArray(data) ? data : [];
}

export default function TabLayout() {
  // Re-uses the same query key as chat.tsx, so results are shared from cache —
  // no duplicate network call when both are mounted.
  const { data: threads = [] } = useQuery({
    queryKey: THREADS_KEY,
    queryFn: fetchThreads,
    refetchInterval: 15_000,
    staleTime: 0,
  });

  const unreadCount = threads.filter((t: any) => !t.is_read_by_admin).length;

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#1677ff',
        tabBarInactiveTintColor: '#94a3b8',
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#ffffff',
          borderTopWidth: 1,
          borderTopColor: '#e2e8f0',
          height: Platform.OS === 'ios' ? 82 : 60,
          paddingBottom: Platform.OS === 'ios' ? 24 : 8,
          paddingTop: 8,
        },
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: '600',
          marginTop: 2,
        },
      }}
    >
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
        name="history"
        options={{
          title: 'History',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? 'calendar' : 'calendar-outline'}
              size={24}
              color={color}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="chat"
        options={{
          title: 'Messages',
          tabBarIcon: ({ color, focused }) => (
            <View>
              <Ionicons
                name={focused ? 'chatbubbles' : 'chatbubbles-outline'}
                size={24}
                color={color}
              />
              {unreadCount > 0 && <View style={styles.badge} />}
            </View>
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  badge: {
    position: 'absolute',
    top: -2,
    right: -4,
    width: 9,
    height: 9,
    borderRadius: 5,
    backgroundColor: '#ef4444',
    borderWidth: 1.5,
    borderColor: '#ffffff',
  },
});
