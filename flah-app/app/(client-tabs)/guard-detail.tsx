import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, Alert, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { CONFIG } from '../../constants/config';

export default function GuardDetailScreen() {
    const [guard, setGuard] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const router = useRouter();
    const params = useLocalSearchParams();
    const guardId = params.id as string;

    const fetchGuardDetails = async () => {
        try {
            const token = await AsyncStorage.getItem('token');
            const res = await fetch(`${CONFIG.API_BASE_URL}/client-portal/guards`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            const guardData = Array.isArray(data) ? data.find((g: any) => g.employee_id === guardId) : null;
            setGuard(guardData);
        } catch (e) {
            Alert.alert('Error', 'Failed to fetch guard details');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchGuardDetails();
    }, []);

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#1e293b" />
            </View>
        );
    }

    if (!guard) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                        <Ionicons name="arrow-back" size={24} color="#1e293b" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Guard Not Found</Text>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color="#1e293b" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Guard Profile</Text>
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent}>
                {/* Profile Header */}
                <View style={styles.profileHeader}>
                    <View style={styles.avatar}>
                        <Ionicons name="person" size={48} color="#fff" />
                    </View>
                    <Text style={styles.guardName}>{guard.full_name || guard.first_name || 'N/A'}</Text>
                    <Text style={styles.guardId}>ID: {guard.employee_id}</Text>
                </View>

                {/* Basic Information */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Basic Information</Text>
                    <View style={styles.infoCard}>
                        <InfoRow icon="briefcase-outline" label="Designation" value={guard.designation || 'N/A'} />
                        <InfoRow icon="business-outline" label="Department" value={guard.department || 'N/A'} />
                        <InfoRow icon="calendar-outline" label="Date of Birth" value={guard.dob || guard.date_of_birth || 'N/A'} />
                        <InfoRow icon="male-female-outline" label="Gender" value={guard.gender || 'N/A'} />
                        <InfoRow icon="card-outline" label="CNIC" value={guard.cnic || guard.cnic_no || 'N/A'} />
                    </View>
                </View>

                {/* Contact Information */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Contact Information</Text>
                    <View style={styles.infoCard}>
                        <InfoRow icon="call-outline" label="Mobile" value={guard.mobile_number || guard.phone || 'N/A'} />
                        <InfoRow icon="mail-outline" label="Email" value={guard.email || 'N/A'} />
                        <InfoRow icon="location-outline" label="Address" value={guard.address || 'N/A'} />
                        <InfoRow icon="location-outline" label="City" value={guard.city || 'N/A'} />
                    </View>
                </View>

                {/* Employment Details */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Employment Details</Text>
                    <View style={styles.infoCard}>
                        <InfoRow icon="checkmark-circle-outline" label="Status" value={guard.status || 'N/A'} />
                        <InfoRow icon="briefcase-outline" label="Employment Type" value={guard.employment_type || 'N/A'} />
                        {guard.assignment_info?.shift && (
                            <InfoRow icon="time-outline" label="Shift" value={guard.assignment_info.shift} />
                        )}
                        <InfoRow icon="cash-outline" label="Salary" value={guard.salary ? `Rs ${guard.salary}` : 'N/A'} />
                    </View>
                </View>

                {/* Emergency Contact */}
                {(guard.emergency_contact_name || guard.emergency_contact_number) && (
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Emergency Contact</Text>
                        <View style={styles.infoCard}>
                            <InfoRow icon="person-outline" label="Name" value={guard.emergency_contact_name || 'N/A'} />
                            <InfoRow icon="call-outline" label="Phone" value={guard.emergency_contact_number || 'N/A'} />
                        </View>
                    </View>
                )}
            </ScrollView>
        </SafeAreaView>
    );
}

function InfoRow({ icon, label, value }: { icon: any; label: string; value: string }) {
    return (
        <View style={styles.infoRow}>
            <View style={styles.infoLabel}>
                <Ionicons name={icon} size={18} color="#64748b" />
                <Text style={styles.labelText}>{label}</Text>
            </View>
            <Text style={styles.valueText}>{value}</Text>
        </View>
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
    headerTitle: {
        fontSize: 20,
        fontWeight: '800',
        color: '#1e293b',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    scrollContent: {
        padding: 20,
    },
    profileHeader: {
        alignItems: 'center',
        backgroundColor: '#fff',
        borderRadius: 24,
        padding: 24,
        marginBottom: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 2,
    },
    avatar: {
        width: 96,
        height: 96,
        borderRadius: 48,
        backgroundColor: '#3b82f6',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
    },
    guardName: {
        fontSize: 24,
        fontWeight: '800',
        color: '#1e293b',
        marginBottom: 4,
    },
    guardId: {
        fontSize: 14,
        color: '#64748b',
        fontWeight: '600',
    },
    section: {
        marginBottom: 20,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: '#1e293b',
        marginBottom: 12,
    },
    infoCard: {
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
    },
    infoRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#f1f5f9',
    },
    infoLabel: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        flex: 1,
    },
    labelText: {
        fontSize: 14,
        color: '#64748b',
        fontWeight: '600',
    },
    valueText: {
        fontSize: 14,
        color: '#1e293b',
        fontWeight: '600',
        flex: 1,
        textAlign: 'right',
    },
});
