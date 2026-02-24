import { Tabs } from 'expo-router';
import React from 'react';
import { Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function ClientTabLayout() {
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
                        <Ionicons name={focused ? 'chatbubbles' : 'chatbubbles-outline'} size={24} color={color} />
                    ),
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
