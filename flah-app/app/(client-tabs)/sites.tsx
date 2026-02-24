import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, Alert, RefreshControl, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { CONFIG } from '../../constants/config';

export default function ClientSitesScreen() {
    const [sites, setSites] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const router = useRouter();

    const fetchSites = async () => {
        try {
            const token = await AsyncStorage.getItem('token');
            const res = await fetch(`${CONFIG.API_BASE_URL}/client-portal/sites`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            setSites(Array.isArray(data) ? data : []);
        } catch (e) {
            Alert.alert('Error', 'Failed to fetch sites');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchSites();
    }, []);

    const onRefresh = () => {
        setRefreshing(true);
        fetchSites();
    };

    const renderSiteItem = ({ item }: { item: any }) => (
        <TouchableOpacity
            style={styles.siteCard}
            onPress={() => router.push(`/(client-tabs)/site-detail?id=${item.id}&name=${encodeURIComponent(item.name)}`)}
        >
            <View style={styles.siteHeader}>
                <View style={styles.siteIcon}>
                    <Ionicons name="business" size={24} color="#3b82f6" />
                </View>
                <View style={styles.siteInfo}>
                    <Text style={styles.siteName}>{item.name}</Text>
                    <View style={[
                        styles.statusBadge,
                        { backgroundColor: item.status === 'active' ? '#dcfce7' : '#fee2e2' }
                    ]}>
                        <Text style={[
                            styles.statusText,
                            { color: item.status === 'active' ? '#166534' : '#991b1b' }
                        ]}>
                            {item.status?.toUpperCase()}
                        </Text>
                    </View>
                </View>
            </View>

            <View style={styles.siteDetails}>
                <View style={styles.detailRow}>
                    <Ionicons name="location-outline" size={16} color="#64748b" />
                    <Text style={styles.detailText}>{item.address || 'No address'}, {item.city || ''}</Text>
                </View>
                <View style={styles.detailRow}>
                    <Ionicons name="people-outline" size={16} color="#64748b" />
                    <Text style={styles.detailText}>{item.guards_required || 0} Guards Required</Text>
                </View>
            </View>

            <View style={styles.viewGuardsButton}>
                <Text style={styles.viewGuardsText}>View Guards</Text>
                <Ionicons name="chevron-forward" size={16} color="#3b82f6" />
            </View>
        </TouchableOpacity>
    );

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.headerTitle}>My Sites</Text>
                <Text style={styles.headerSubtitle}>{sites.length} sites assigned</Text>
            </View>

            {loading && !refreshing ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#1e293b" />
                </View>
            ) : (
                <FlatList
                    data={sites}
                    renderItem={renderSiteItem}
                    keyExtractor={(item) => item.id?.toString()}
                    contentContainerStyle={styles.listContent}
                    refreshControl={
                        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                    }
                    ListEmptyComponent={
                        <View style={styles.emptyContainer}>
                            <Ionicons name="business-outline" size={48} color="#cbd5e1" />
                            <Text style={styles.emptyText}>No sites assigned to you.</Text>
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
    siteCard: {
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 16,
        marginBottom: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
    },
    siteHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    siteIcon: {
        width: 48,
        height: 48,
        borderRadius: 12,
        backgroundColor: '#eff6ff',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    siteInfo: {
        flex: 1,
    },
    siteName: {
        fontSize: 16,
        fontWeight: '700',
        color: '#1e293b',
        marginBottom: 4,
    },
    statusBadge: {
        alignSelf: 'flex-start',
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 6,
    },
    statusText: {
        fontSize: 10,
        fontWeight: '800',
    },
    siteDetails: {
        gap: 8,
        marginBottom: 12,
    },
    detailRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    detailText: {
        fontSize: 14,
        color: '#64748b',
    },
    viewGuardsButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#eff6ff',
        paddingVertical: 10,
        borderRadius: 8,
        gap: 6,
    },
    viewGuardsText: {
        color: '#3b82f6',
        fontSize: 14,
        fontWeight: '700',
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
