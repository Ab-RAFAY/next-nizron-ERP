import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    ActivityIndicator,
    Alert,
    RefreshControl,
    TextInput,
    Modal,
    FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { CONFIG } from '../../constants/config';

interface Complaint {
    id: number;
    clientId: string;
    title: string;
    description: string;
    category: string;
    status: string;
    priority: string;
    assignedTo?: string;
    resolution?: string;
    createdAt: string;
    updatedAt: string;
}

const CATEGORIES = ['General', 'Guard Performance', 'Site Issue', 'Billing', 'Service Quality'];
const PRIORITIES = ['Low', 'Medium', 'High', 'Urgent'];

export default function ComplaintsScreen() {
    const [complaints, setComplaints] = useState<Complaint[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [showForm, setShowForm] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    // Form state
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('General');
    const [selectedPriority, setSelectedPriority] = useState('Medium');
    const [categoryDropdownOpen, setCategoryDropdownOpen] = useState(false);
    const [priorityDropdownOpen, setPriorityDropdownOpen] = useState(false);

    const router = useRouter();

    const fetchComplaints = async () => {
        try {
            const token = await AsyncStorage.getItem('token');
            if (!token) {
                router.replace('/login');
                return;
            }

            const headers = {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            };

            const res = await fetch(`${CONFIG.API_BASE_URL}/client-portal/complaints`, { headers });
            const data = await res.json();

            setComplaints(Array.isArray(data) ? data : []);
        } catch (e) {
            console.error(e);
            Alert.alert('Error', 'Failed to fetch complaints');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchComplaints();
    }, []);

    const onRefresh = () => {
        setRefreshing(true);
        fetchComplaints();
    };

    const handleSubmitComplaint = async () => {
        if (!title.trim()) {
            Alert.alert('Error', 'Please enter a title');
            return;
        }

        if (!description.trim()) {
            Alert.alert('Error', 'Please enter a description');
            return;
        }

        try {
            setSubmitting(true);
            const token = await AsyncStorage.getItem('token');

            const response = await fetch(`${CONFIG.API_BASE_URL}/client-portal/complaints`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    title: title.trim(),
                    description: description.trim(),
                    category: selectedCategory.toLowerCase(),
                    priority: selectedPriority.toLowerCase(),
                })
            });

            if (!response.ok) {
                throw new Error('Failed to submit complaint');
            }

            Alert.alert('Success', 'Your complaint has been submitted successfully');
            setTitle('');
            setDescription('');
            setSelectedCategory('General');
            setSelectedPriority('Medium');
            setShowForm(false);
            await fetchComplaints();
        } catch (e) {
            console.error(e);
            Alert.alert('Error', 'Failed to submit complaint');
        } finally {
            setSubmitting(false);
        }
    };

    const formatDate = (dateString: string) => {
        try {
            return new Date(dateString).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
        } catch {
            return dateString;
        }
    };

    const getStatusColor = (status: string) => {
        switch (status.toLowerCase()) {
            case 'open':
                return '#f59e0b';
            case 'in_progress':
                return '#3b82f6';
            case 'resolved':
                return '#10b981';
            case 'closed':
                return '#64748b';
            default:
                return '#94a3b8';
        }
    };

    const getPriorityColor = (priority: string) => {
        switch (priority.toLowerCase()) {
            case 'urgent':
                return '#ef4444';
            case 'high':
                return '#f97316';
            case 'medium':
                return '#f59e0b';
            case 'low':
                return '#10b981';
            default:
                return '#94a3b8';
        }
    };

    const renderComplaintCard = (complaint: Complaint) => (
        <View key={complaint.id} style={styles.card}>
            <View style={styles.cardHeader}>
                <View style={{ flex: 1 }}>
                    <Text style={styles.complaintTitle}>{complaint.title}</Text>
                    <View style={styles.badgesContainer}>
                        <View style={[styles.badge, { backgroundColor: getStatusColor(complaint.status) + '20' }]}>
                            <Text style={[styles.badgeText, { color: getStatusColor(complaint.status) }]}>
                                {complaint.status.replace('_', ' ').toUpperCase()}
                            </Text>
                        </View>
                        <View style={[styles.badge, { backgroundColor: getPriorityColor(complaint.priority) + '20' }]}>
                            <Text style={[styles.badgeText, { color: getPriorityColor(complaint.priority) }]}>
                                {complaint.priority.toUpperCase()}
                            </Text>
                        </View>
                    </View>
                </View>
            </View>

            <Text style={styles.complaintDescription}>{complaint.description}</Text>

            <View style={styles.cardFooter}>
                <View style={styles.footerItem}>
                    <Text style={styles.footerLabel}>Category:</Text>
                    <Text style={styles.footerValue}>{complaint.category}</Text>
                </View>
                <View style={styles.footerItem}>
                    <Text style={styles.footerLabel}>Submitted:</Text>
                    <Text style={styles.footerValue}>{formatDate(complaint.createdAt)}</Text>
                </View>
            </View>

            {complaint.resolution && (
                <View style={styles.resolutionSection}>
                    <Text style={styles.resolutionLabel}>Resolution:</Text>
                    <Text style={styles.resolutionText}>{complaint.resolution}</Text>
                </View>
            )}
        </View>
    );

    if (loading && !refreshing) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#1e293b" />
            </View>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView
                contentContainerStyle={styles.scrollContent}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
            >
                <View style={styles.header}>
                    <View>
                        <Text style={styles.title}>Complaints</Text>
                        <Text style={styles.subtitle}>Report issues or concerns</Text>
                    </View>
                    <TouchableOpacity
                        style={styles.submitButton}
                        onPress={() => setShowForm(true)}
                    >
                        <Ionicons name="add" size={24} color="#ffffff" />
                    </TouchableOpacity>
                </View>

                {complaints.length > 0 ? (
                    <View style={styles.statsContainer}>
                        <View style={styles.statItem}>
                            <Text style={styles.statLabel}>Total</Text>
                            <Text style={styles.statValue}>{complaints.length}</Text>
                        </View>
                        <View style={styles.statItem}>
                            <Text style={styles.statLabel}>Open</Text>
                            <Text style={styles.statValue}>
                                {complaints.filter(c => c.status.toLowerCase() === 'open').length}
                            </Text>
                        </View>
                        <View style={styles.statItem}>
                            <Text style={styles.statLabel}>Resolved</Text>
                            <Text style={styles.statValue}>
                                {complaints.filter(c => c.status.toLowerCase() === 'resolved').length}
                            </Text>
                        </View>
                    </View>
                ) : null}

                <View style={styles.complaintsContainer}>
                    {complaints.length > 0 ? (
                        complaints.map(complaint => renderComplaintCard(complaint))
                    ) : (
                        <View style={styles.emptyState}>
                            <Ionicons name="chat-bubble-outline" size={48} color="#cbd5e1" />
                            <Text style={styles.emptyText}>No complaints yet</Text>
                            <Text style={styles.emptySubtext}>Submit your first complaint to get started</Text>
                        </View>
                    )}
                </View>
            </ScrollView>

            {/* Submit Form Modal */}
            <Modal visible={showForm} animationType="slide" transparent={true}>
                <SafeAreaView style={styles.modal}>
                    <View style={styles.modalHeader}>
                        <TouchableOpacity onPress={() => setShowForm(false)}>
                            <Ionicons name="close" size={28} color="#1e293b" />
                        </TouchableOpacity>
                        <Text style={styles.modalTitle}>New Complaint</Text>
                        <View style={{ width: 28 }} />
                    </View>

                    <ScrollView style={styles.modalContent}>
                        <View style={styles.formGroup}>
                            <Text style={styles.label}>Title *</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="Brief title for your complaint"
                                placeholderTextColor="#cbd5e1"
                                value={title}
                                onChangeText={setTitle}
                                editable={!submitting}
                            />
                        </View>

                        <View style={styles.formGroup}>
                            <Text style={styles.label}>Description *</Text>
                            <TextInput
                                style={[styles.input, styles.textArea]}
                                placeholder="Detailed description of your complaint"
                                placeholderTextColor="#cbd5e1"
                                value={description}
                                onChangeText={setDescription}
                                multiline
                                numberOfLines={5}
                                editable={!submitting}
                                textAlignVertical="top"
                            />
                        </View>

                        <View style={styles.formGroup}>
                            <Text style={styles.label}>Category</Text>
                            <TouchableOpacity
                                style={styles.dropdown}
                                onPress={() => setCategoryDropdownOpen(!categoryDropdownOpen)}
                                disabled={submitting}
                            >
                                <Text style={styles.dropdownText}>{selectedCategory}</Text>
                                <Ionicons
                                    name={categoryDropdownOpen ? "chevron-up" : "chevron-down"}
                                    size={20}
                                    color="#64748b"
                                />
                            </TouchableOpacity>

                            {categoryDropdownOpen && (
                                <View style={styles.dropdownMenu}>
                                    {CATEGORIES.map(cat => (
                                        <TouchableOpacity
                                            key={cat}
                                            style={styles.dropdownItem}
                                            onPress={() => {
                                                setSelectedCategory(cat);
                                                setCategoryDropdownOpen(false);
                                            }}
                                        >
                                            <Text style={[
                                                styles.dropdownItemText,
                                                selectedCategory === cat && styles.selectedDropdownItem
                                            ]}>
                                                {cat}
                                            </Text>
                                        </TouchableOpacity>
                                    ))}
                                </View>
                            )}
                        </View>

                        <View style={styles.formGroup}>
                            <Text style={styles.label}>Priority</Text>
                            <TouchableOpacity
                                style={styles.dropdown}
                                onPress={() => setPriorityDropdownOpen(!priorityDropdownOpen)}
                                disabled={submitting}
                            >
                                <Text style={styles.dropdownText}>{selectedPriority}</Text>
                                <Ionicons
                                    name={priorityDropdownOpen ? "chevron-up" : "chevron-down"}
                                    size={20}
                                    color="#64748b"
                                />
                            </TouchableOpacity>

                            {priorityDropdownOpen && (
                                <View style={styles.dropdownMenu}>
                                    {PRIORITIES.map(pri => (
                                        <TouchableOpacity
                                            key={pri}
                                            style={styles.dropdownItem}
                                            onPress={() => {
                                                setSelectedPriority(pri);
                                                setPriorityDropdownOpen(false);
                                            }}
                                        >
                                            <Text style={[
                                                styles.dropdownItemText,
                                                selectedPriority === pri && styles.selectedDropdownItem
                                            ]}>
                                                {pri}
                                            </Text>
                                        </TouchableOpacity>
                                    ))}
                                </View>
                            )}
                        </View>

                        <TouchableOpacity
                            style={[styles.submitBtn, submitting && styles.submitBtnDisabled]}
                            onPress={handleSubmitComplaint}
                            disabled={submitting}
                        >
                            {submitting ? (
                                <ActivityIndicator size="small" color="#ffffff" />
                            ) : (
                                <Text style={styles.submitBtnText}>Submit Complaint</Text>
                            )}
                        </TouchableOpacity>
                    </ScrollView>
                </SafeAreaView>
            </Modal>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8fafc',
    },
    scrollContent: {
        paddingBottom: 20,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#f8fafc',
    },
    header: {
        paddingHorizontal: 20,
        paddingVertical: 16,
        backgroundColor: '#ffffff',
        borderBottomWidth: 1,
        borderBottomColor: '#f1f5f9',
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    title: {
        fontSize: 24,
        fontWeight: '700',
        color: '#1e293b',
    },
    subtitle: {
        fontSize: 13,
        color: '#94a3b8',
        marginTop: 4,
    },
    submitButton: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: '#3b82f6',
        justifyContent: 'center',
        alignItems: 'center',
    },
    statsContainer: {
        flexDirection: 'row',
        paddingHorizontal: 16,
        marginTop: 16,
        gap: 12,
    },
    statItem: {
        flex: 1,
        backgroundColor: '#ffffff',
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderRadius: 8,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#f1f5f9',
    },
    statLabel: {
        fontSize: 12,
        color: '#94a3b8',
        fontWeight: '600',
    },
    statValue: {
        fontSize: 20,
        fontWeight: '700',
        color: '#1e293b',
        marginTop: 4,
    },
    complaintsContainer: {
        paddingHorizontal: 16,
        marginTop: 16,
    },
    card: {
        backgroundColor: '#ffffff',
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
        borderLeftWidth: 4,
        borderLeftColor: '#3b82f6',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
    },
    cardHeader: {
        marginBottom: 12,
    },
    complaintTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: '#1e293b',
        marginBottom: 8,
    },
    badgesContainer: {
        flexDirection: 'row',
        gap: 8,
        flexWrap: 'wrap',
    },
    badge: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 4,
    },
    badgeText: {
        fontSize: 11,
        fontWeight: '600',
    },
    complaintDescription: {
        fontSize: 13,
        color: '#475569',
        lineHeight: 20,
        marginBottom: 12,
    },
    cardFooter: {
        flexDirection: 'row',
        gap: 16,
        paddingTop: 12,
        borderTopWidth: 1,
        borderTopColor: '#f1f5f9',
    },
    footerItem: {
        flex: 1,
    },
    footerLabel: {
        fontSize: 11,
        color: '#94a3b8',
        fontWeight: '600',
        marginBottom: 2,
    },
    footerValue: {
        fontSize: 12,
        color: '#64748b',
    },
    resolutionSection: {
        marginTop: 12,
        paddingTop: 12,
        borderTopWidth: 1,
        borderTopColor: '#f1f5f9',
        backgroundColor: '#f0fdf4',
        padding: 10,
        borderRadius: 6,
    },
    resolutionLabel: {
        fontSize: 12,
        fontWeight: '600',
        color: '#15803d',
        marginBottom: 4,
    },
    resolutionText: {
        fontSize: 13,
        color: '#22c55e',
        lineHeight: 18,
    },
    emptyState: {
        paddingVertical: 60,
        alignItems: 'center',
        justifyContent: 'center',
    },
    emptyText: {
        fontSize: 16,
        color: '#94a3b8',
        marginTop: 12,
        fontWeight: '600',
    },
    emptySubtext: {
        fontSize: 13,
        color: '#cbd5e1',
        marginTop: 4,
    },
    modal: {
        flex: 1,
        backgroundColor: '#f8fafc',
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 16,
        backgroundColor: '#ffffff',
        borderBottomWidth: 1,
        borderBottomColor: '#f1f5f9',
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: '#1e293b',
    },
    modalContent: {
        flex: 1,
        paddingHorizontal: 20,
        paddingVertical: 16,
    },
    formGroup: {
        marginBottom: 20,
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        color: '#1e293b',
        marginBottom: 8,
    },
    input: {
        backgroundColor: '#ffffff',
        borderWidth: 1,
        borderColor: '#e2e8f0',
        borderRadius: 8,
        paddingHorizontal: 12,
        paddingVertical: 10,
        fontSize: 14,
        color: '#1e293b',
    },
    textArea: {
        minHeight: 120,
        paddingTop: 12,
    },
    dropdown: {
        backgroundColor: '#ffffff',
        borderWidth: 1,
        borderColor: '#e2e8f0',
        borderRadius: 8,
        paddingHorizontal: 12,
        paddingVertical: 10,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    dropdownText: {
        fontSize: 14,
        color: '#1e293b',
        fontWeight: '500',
    },
    dropdownMenu: {
        backgroundColor: '#ffffff',
        borderWidth: 1,
        borderColor: '#e2e8f0',
        borderRadius: 6,
        marginTop: 4,
        overflow: 'hidden',
    },
    dropdownItem: {
        paddingHorizontal: 12,
        paddingVertical: 10,
        borderBottomWidth: 1,
        borderBottomColor: '#f1f5f9',
    },
    dropdownItemText: {
        fontSize: 14,
        color: '#475569',
    },
    selectedDropdownItem: {
        color: '#3b82f6',
        fontWeight: '600',
    },
    submitBtn: {
        backgroundColor: '#3b82f6',
        borderRadius: 8,
        paddingVertical: 12,
        alignItems: 'center',
        marginTop: 20,
        marginBottom: 40,
    },
    submitBtnDisabled: {
        opacity: 0.6,
    },
    submitBtnText: {
        color: '#ffffff',
        fontSize: 16,
        fontWeight: '700',
    },
});
