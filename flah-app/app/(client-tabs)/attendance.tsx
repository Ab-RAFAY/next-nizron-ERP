import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, Alert, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { CONFIG } from '../../constants/config';

export default function ClientAttendanceScreen() {
    const [attendance, setAttendance] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const fetchAttendance = async () => {
        try {
            const token = await AsyncStorage.getItem('token');
            // Fetch last 7 days by default
            const today = new Date().toISOString().split('T')[0];
            const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

            const res = await fetch(`${CONFIG.API_BASE_URL}/client-portal/attendance?from_date=${weekAgo}&to_date=${today}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            setAttendance(Array.isArray(data) ? data : []);
        } catch (e) {
            Alert.alert('Error', 'Failed to fetch attendance');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchAttendance();
    }, []);

    const onRefresh = () => {
        setRefreshing(true);
        fetchAttendance();
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'Present': return { bg: '#dcfce7', text: '#166534' };
            case 'Absent': return { bg: '#fee2e2', text: '#991b1b' };
            case 'Late': return { bg: '#fef3c7', text: '#92400e' };
            default: return { bg: '#f1f5f9', text: '#475569' };
        }
    };

    const renderAttendanceItem = ({ item }: { item: any }) => {
        const colors = getStatusColor(item.status);
        return (
            <View style={styles.logCard}>
                <View style={styles.logHeader}>
                    <View>
                        <Text style={styles.dateText}>{new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</Text>
                        <Text style={styles.guardId}>Guard ID: {item.employee_id}</Text>
                    </View>
                    <View style={[styles.statusBadge, { backgroundColor: colors.bg }]}>
                        <Text style={[styles.statusText, { color: colors.text }]}>
                            {item.status?.toUpperCase()}
                        </Text>
                    </View>
                </View>

                <View style={styles.timeInfo}>
                    <View style={styles.timeBox}>
                        <Text style={styles.timeLabel}>CHECK IN</Text>
                        <Text style={styles.timeValue}>{item.time_in || '--:--'}</Text>
                    </View>
                    <View style={styles.timeDivider} />
                    <View style={styles.timeBox}>
                        <Text style={styles.timeLabel}>CHECK OUT</Text>
                        <Text style={styles.timeValue}>{item.time_out || '--:--'}</Text>
                    </View>
                </View>
            </View>
        );
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Attendance History</Text>
                <Text style={styles.headerSubtitle}>Last 7 Days</Text>
            </View>

            {loading && !refreshing ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#1e293b" />
                </View>
            ) : (
                <FlatList
                    data={attendance}
                    renderItem={renderAttendanceItem}
                    keyExtractor={(item) => item.id.toString()}
                    contentContainerStyle={styles.listContent}
                    refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
                    ListEmptyComponent={
                        <View style={styles.emptyContainer}>
                            <Ionicons name="time-outline" size={48} color="#cbd5e1" />
                            <Text style={styles.emptyText}>No attendance records found.</Text>
                        </View>
                    }
                />
            )}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8fafc',
    },
    header: {
        padding: 20,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#f1f5f9',
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: '800',
        color: '#1e293b',
    },
    headerSubtitle: {
        fontSize: 12,
        color: '#94a3b8',
        fontWeight: '600',
        marginTop: 2,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    listContent: {
        padding: 20,
    },
    logCard: {
        backgroundColor: '#fff',
        borderRadius: 20,
        padding: 16,
        marginBottom: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 2,
    },
    logHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 16,
    },
    dateText: {
        fontSize: 16,
        fontWeight: '700',
        color: '#1e293b',
    },
    guardId: {
        fontSize: 12,
        color: '#64748b',
        marginTop: 2,
    },
    statusBadge: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6,
    },
    statusText: {
        fontSize: 10,
        fontWeight: '800',
    },
    timeInfo: {
        flexDirection: 'row',
        backgroundColor: '#f8fafc',
        borderRadius: 12,
        padding: 12,
    },
    timeBox: {
        flex: 1,
        alignItems: 'center',
    },
    timeLabel: {
        fontSize: 9,
        color: '#94a3b8',
        fontWeight: '800',
        marginBottom: 4,
    },
    timeValue: {
        fontSize: 14,
        fontWeight: '700',
        color: '#1e293b',
    },
    timeDivider: {
        width: 1,
        backgroundColor: '#e2e8f0',
        marginHorizontal: 10,
    },
    emptyContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 60,
    },
    emptyText: {
        fontSize: 16,
        color: '#94a3b8',
        marginTop: 12,
    },
});
