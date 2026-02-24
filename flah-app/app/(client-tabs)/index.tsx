import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Alert, RefreshControl, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { LineChart } from 'react-native-chart-kit';
import { CONFIG } from '../../constants/config';

const screenWidth = Dimensions.get('window').width;

export default function ClientDashboardHome() {
    const [stats, setStats] = useState({ sites: 0, guards: 0, attendance: 0 });
    const [weeklyAttendance, setWeeklyAttendance] = useState<number[]>([]);
    const [weekLabels, setWeekLabels] = useState<string[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [clientName, setClientName] = useState('');
    const router = useRouter();

    const fetchStats = async () => {
        try {
            const token = await AsyncStorage.getItem('token');
            if (!token) {
                router.replace('/login');
                return;
            }

            const name = await AsyncStorage.getItem('full_name');
            setClientName(name || 'Client');

            const headers = {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            };

            // Get last 7 days
            const dates = [];
            const labels = [];
            for (let i = 6; i >= 0; i--) {
                const date = new Date();
                date.setDate(date.getDate() - i);
                dates.push(date.toISOString().split('T')[0]);
                labels.push(date.toLocaleDateString('en-US', { weekday: 'short' }));
            }

            const [sitesRes, guardsRes, ...attendanceResponses] = await Promise.all([
                fetch(`${CONFIG.API_BASE_URL}/client-portal/sites`, { headers }),
                fetch(`${CONFIG.API_BASE_URL}/client-portal/guards`, { headers }),
                ...dates.map(date =>
                    fetch(`${CONFIG.API_BASE_URL}/client-portal/attendance?from_date=${date}&to_date=${date}`, { headers })
                )
            ]);

            const sitesData = await sitesRes.json();
            const guardsData = await guardsRes.json();

            const attendanceCounts = await Promise.all(
                attendanceResponses.map(async (res) => {
                    const data = await res.json();
                    return Array.isArray(data) ? data.length : 0;
                })
            );

            const todayAttendance = attendanceCounts[attendanceCounts.length - 1];

            setStats({
                sites: Array.isArray(sitesData) ? sitesData.length : 0,
                guards: Array.isArray(guardsData) ? guardsData.length : 0,
                attendance: todayAttendance
            });

            setWeeklyAttendance(attendanceCounts);
            setWeekLabels(labels);
        } catch (e) {
            console.error(e);
            Alert.alert('Error', 'Failed to fetch dashboard data');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchStats();
    }, []);

    const onRefresh = () => {
        setRefreshing(true);
        fetchStats();
    };

    const handleLogout = async () => {
        await AsyncStorage.multiRemove(['token', 'user_type', 'client_id', 'full_name']);
        router.replace('/login');
    };

    if (loading && !refreshing) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#1e293b" />
            </View>
        );
    }

    const chartConfig = {
        backgroundColor: '#ffffff',
        backgroundGradientFrom: '#ffffff',
        backgroundGradientTo: '#ffffff',
        decimalPlaces: 0,
        color: (opacity = 1) => `rgba(59, 130, 246, ${opacity})`,
        labelColor: (opacity = 1) => `rgba(100, 116, 139, ${opacity})`,
        style: {
            borderRadius: 16,
        },
        propsForDots: {
            r: '6',
            strokeWidth: '2',
            stroke: '#3b82f6',
        },
    };

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView
                contentContainerStyle={styles.scrollContent}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
            >
                <View style={styles.header}>
                    <View>
                        <Text style={styles.greeting}>Welcome,</Text>
                        <Text style={styles.clientName}>{clientName}</Text>
                    </View>
                    <View style={styles.headerButtons}>
                        <TouchableOpacity onPress={onRefresh} style={styles.refreshButton}>
                            <Ionicons name="refresh-outline" size={24} color="#3b82f6" />
                        </TouchableOpacity>
                        <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
                            <Ionicons name="log-out-outline" size={24} color="#ef4444" />
                        </TouchableOpacity>
                    </View>
                </View>

                <View style={styles.statsGrid}>
                    <View style={[styles.statCard, { borderLeftColor: '#3b82f6' }]}>
                        <Ionicons name="business" size={24} color="#3b82f6" />
                        <Text style={styles.statValue}>{stats.sites}</Text>
                        <Text style={styles.statLabel}>My Sites</Text>
                    </View>

                    <View style={[styles.statCard, { borderLeftColor: '#10b981' }]}>
                        <Ionicons name="people" size={24} color="#10b981" />
                        <Text style={styles.statValue}>{stats.guards}</Text>
                        <Text style={styles.statLabel}>Total Guards</Text>
                    </View>

                    <View style={[styles.statCard, { borderLeftColor: '#f59e0b' }]}>
                        <Ionicons name="time" size={24} color="#f59e0b" />
                        <Text style={styles.statValue}>{stats.attendance}</Text>
                        <Text style={styles.statLabel}>Present Today</Text>
                    </View>
                </View>

                {weeklyAttendance.length > 0 && (
                    <View style={styles.chartCard}>
                        <Text style={styles.chartTitle}>Weekly Attendance Trend</Text>
                        <LineChart
                            data={{
                                labels: weekLabels,
                                datasets: [{
                                    data: weeklyAttendance.length > 0 ? weeklyAttendance : [0],
                                }],
                            }}
                            width={screenWidth - 60}
                            height={220}
                            chartConfig={chartConfig}
                            bezier
                            style={styles.chart}
                            withInnerLines={false}
                            withOuterLines={true}
                            withVerticalLines={false}
                            withHorizontalLines={true}
                            fromZero
                        />
                    </View>
                )}

                <View style={styles.welcomeCard}>
                    <Text style={styles.welcomeTitle}>Nizron Client Portal</Text>
                    <Text style={styles.welcomeText}>
                        Monitor your sites, track guard attendance, and stay updated with real-time operations data from your mobile device.
                    </Text>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8fafc',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    scrollContent: {
        padding: 20,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 30,
        marginTop: 10,
    },
    greeting: {
        fontSize: 16,
        color: '#64748b',
        fontWeight: '500',
    },
    clientName: {
        fontSize: 24,
        fontWeight: '800',
        color: '#1e293b',
    },
    headerButtons: {
        flexDirection: 'row',
        gap: 8,
    },
    refreshButton: {
        padding: 8,
        borderRadius: 12,
        backgroundColor: '#dbeafe',
    },
    logoutButton: {
        padding: 8,
        borderRadius: 12,
        backgroundColor: '#fee2e2',
    },
    statsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        marginBottom: 24,
    },
    statCard: {
        width: '31%',
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 16,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 2,
        borderLeftWidth: 4,
    },
    statValue: {
        fontSize: 20,
        fontWeight: '800',
        color: '#1e293b',
        marginTop: 8,
    },
    statLabel: {
        fontSize: 10,
        color: '#64748b',
        fontWeight: '700',
        textTransform: 'uppercase',
        marginTop: 4,
    },
    chartCard: {
        backgroundColor: '#fff',
        borderRadius: 24,
        padding: 20,
        marginBottom: 24,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.1,
        shadowRadius: 20,
        elevation: 5,
    },
    chartTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: '#1e293b',
        marginBottom: 16,
    },
    chart: {
        marginVertical: 8,
        borderRadius: 16,
    },
    welcomeCard: {
        backgroundColor: '#1e293b',
        borderRadius: 24,
        padding: 24,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.1,
        shadowRadius: 20,
        elevation: 5,
    },
    welcomeTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#fff',
        marginBottom: 8,
    },
    welcomeText: {
        fontSize: 14,
        color: '#cbd5e1',
        lineHeight: 22,
    },
});
