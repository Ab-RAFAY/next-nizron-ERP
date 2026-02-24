import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, Alert, RefreshControl, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { CONFIG } from '../../constants/config';

export default function SiteDetailScreen() {
    const [guards, setGuards] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const router = useRouter();
    const params = useLocalSearchParams();
    const siteId = params.id as string;
    const siteName = params.name as string;

    const fetchGuards = async () => {
        try {
            const token = await AsyncStorage.getItem('token');
            const res = await fetch(`${CONFIG.API_BASE_URL}/client-portal/guards?site_id=${siteId}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            setGuards(Array.isArray(data) ? data : []);
        } catch (e) {
            Alert.alert('Error', 'Failed to fetch guards');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchGuards();
    }, []);

    const onRefresh = () => {
        setRefreshing(true);
        fetchGuards();
    };

    const renderGuardItem = ({ item }: { item: any }) => (
        <TouchableOpacity
            style={styles.guardCard}
            onPress={() => router.push(`/(client-tabs)/guard-detail?id=${item.employee_id}` as any)}
        >
            <View style={styles.guardHeader}>
                <View style={styles.guardAvatar}>
                    <Ionicons name="person" size={24} color="#fff" />
                </View>
                <View style={styles.guardInfo}>
                    <Text style={styles.guardName}>{item.full_name || item.first_name || 'N/A'}</Text>
                    <Text style={styles.guardId}>ID: {item.employee_id}</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#94a3b8" />
            </View>

            <View style={styles.guardDetails}>
                <View style={styles.detailRow}>
                    <Ionicons name="briefcase-outline" size={16} color="#64748b" />
                    <Text style={styles.detailText}>{item.designation || 'Guard'}</Text>
                </View>
                {item.assignment_info?.shift && (
                    <View style={styles.detailRow}>
                        <Ionicons name="time-outline" size={16} color="#64748b" />
                        <Text style={styles.detailText}>{item.assignment_info.shift} Shift</Text>
                    </View>
                )}
            </View>
        </TouchableOpacity>
    );

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color="#1e293b" />
                </TouchableOpacity>
                <View style={styles.headerTextContainer}>
                    <Text style={styles.headerTitle}>{siteName}</Text>
                    <Text style={styles.headerSubtitle}>Assigned Guards</Text>
                </View>
            </View>

            {loading && !refreshing ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#1e293b" />
                </View>
            ) : (
                <FlatList
                    data={guards}
                    renderItem={renderGuardItem}
                    keyExtractor={(item) => item.employee_id}
                    contentContainerStyle={styles.listContent}
                    refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
                    ListEmptyComponent={
                        <View style={styles.emptyContainer}>
                            <Ionicons name="people-outline" size={48} color="#cbd5e1" />
                            <Text style={styles.emptyText}>No guards assigned to this site.</Text>
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
        flexDirection: 'row',
        alignItems: 'center',
        padding: 20,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#f1f5f9',
    },
    backButton: {
        marginRight: 12,
    },
    headerTextContainer: {
        flex: 1,
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: '800',
        color: '#1e293b',
    },
    headerSubtitle: {
        fontSize: 12,
        color: '#64748b',
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
    guardCard: {
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 16,
        marginBottom: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
    },
    guardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    guardAvatar: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: '#3b82f6',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    guardInfo: {
        flex: 1,
    },
    guardName: {
        fontSize: 16,
        fontWeight: '700',
        color: '#1e293b',
    },
    guardId: {
        fontSize: 12,
        color: '#64748b',
        marginTop: 2,
    },
    guardDetails: {
        gap: 8,
    },
    detailRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    detailText: {
        fontSize: 14,
        color: '#64748b',
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
