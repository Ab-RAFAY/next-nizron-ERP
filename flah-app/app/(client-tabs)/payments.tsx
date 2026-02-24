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
    FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { CONFIG } from '../../constants/config';

interface Invoice {
    id: number;
    invoiceId: string;
    clientId: string;
    amount: number;
    dueDate: string;
    status: string;
    createdAt: string;
}

interface Payment {
    id: number;
    clientId: string;
    invoiceId?: string;
    amount: number;
    paymentDate: string;
    paymentMethod?: string;
    createdAt: string;
}

export default function PaymentsScreen() {
    const [invoices, setInvoices] = useState<Invoice[]>([]);
    const [payments, setPayments] = useState<Payment[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [activeTab, setActiveTab] = useState<'invoices' | 'payments'>('invoices');
    const router = useRouter();

    const fetchData = async () => {
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

            const [invoicesRes, paymentsRes] = await Promise.all([
                fetch(`${CONFIG.API_BASE_URL}/client-portal/invoices`, { headers }),
                fetch(`${CONFIG.API_BASE_URL}/client-portal/payments`, { headers })
            ]);

            const invoicesData = await invoicesRes.json();
            const paymentsData = await paymentsRes.json();

            setInvoices(Array.isArray(invoicesData) ? invoicesData : []);
            setPayments(Array.isArray(paymentsData) ? paymentsData : []);
        } catch (e) {
            console.error(e);
            Alert.alert('Error', 'Failed to fetch payment data');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const onRefresh = () => {
        setRefreshing(true);
        fetchData();
    };

    const getTotalPending = () => {
        return invoices
            .filter(inv => inv.status === 'unpaid' || inv.status !== 'paid')
            .reduce((sum, inv) => sum + inv.amount, 0);
    };

    const getTotalPaid = () => {
        return payments.reduce((sum, payment) => sum + payment.amount, 0);
    };

    const formatDate = (dateString: string) => {
        try {
            return new Date(dateString).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric'
            });
        } catch {
            return dateString;
        }
    };

    const isOverdue = (dueDate: string) => {
        return new Date(dueDate) < new Date();
    };

    const renderInvoiceCard = (invoice: Invoice) => (
        <View key={invoice.id} style={styles.card}>
            <View style={styles.cardHeader}>
                <View>
                    <Text style={styles.invoiceId}>{invoice.invoiceId}</Text>
                    <Text style={styles.cardLabel}>Invoice ID</Text>
                </View>
                <View style={[
                    styles.statusBadge,
                    {
                        backgroundColor: invoice.status === 'paid' ? '#10b981' : isOverdue(invoice.dueDate) ? '#ef4444' : '#f59e0b'
                    }
                ]}>
                    <Text style={styles.statusText}>
                        {invoice.status === 'paid' ? 'Paid' : isOverdue(invoice.dueDate) ? 'Overdue' : 'Pending'}
                    </Text>
                </View>
            </View>

            <View style={styles.cardContent}>
                <View style={styles.row}>
                    <Text style={styles.label}>Amount Due:</Text>
                    <Text style={styles.amountText}>PKR {invoice.amount.toFixed(2)}</Text>
                </View>

                <View style={styles.row}>
                    <Text style={styles.label}>Due Date:</Text>
                    <Text style={[
                        styles.dateText,
                        { color: isOverdue(invoice.dueDate) ? '#ef4444' : '#64748b' }
                    ]}>
                        {formatDate(invoice.dueDate)}
                    </Text>
                </View>

                <View style={styles.row}>
                    <Text style={styles.label}>Created:</Text>
                    <Text style={styles.dateText}>{formatDate(invoice.createdAt)}</Text>
                </View>
            </View>
        </View>
    );

    const renderPaymentCard = (payment: Payment) => (
        <View key={payment.id} style={styles.card}>
            <View style={styles.cardHeader}>
                <View>
                    <Text style={styles.invoiceId}>{payment.invoiceId || 'N/A'}</Text>
                    <Text style={styles.cardLabel}>Invoice ID</Text>
                </View>
                <View style={styles.statusBadge}>
                    <Ionicons name="checkmark-circle" size={20} color="#10b981" />
                </View>
            </View>

            <View style={styles.cardContent}>
                <View style={styles.row}>
                    <Text style={styles.label}>Amount Paid:</Text>
                    <Text style={[styles.amountText, { color: '#10b981' }]}>
                        + PKR {payment.amount.toFixed(2)}
                    </Text>
                </View>

                <View style={styles.row}>
                    <Text style={styles.label}>Payment Date:</Text>
                    <Text style={styles.dateText}>{formatDate(payment.paymentDate)}</Text>
                </View>

                {payment.paymentMethod && (
                    <View style={styles.row}>
                        <Text style={styles.label}>Method:</Text>
                        <Text style={styles.dateText}>{payment.paymentMethod}</Text>
                    </View>
                )}
            </View>
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
                    <Text style={styles.title}>Payment Overview</Text>
                </View>

                {/* Summary Cards */}
                <View style={styles.summaryContainer}>
                    <View style={[styles.summaryCard, { backgroundColor: '#fee2e2' }]}>
                        <Ionicons name="alert-circle" size={28} color="#ef4444" />
                        <Text style={styles.summaryLabel}>Pending</Text>
                        <Text style={[styles.summaryAmount, { color: '#ef4444' }]}>
                            PKR {getTotalPending().toFixed(2)}
                        </Text>
                    </View>

                    <View style={[styles.summaryCard, { backgroundColor: '#dcfce7' }]}>
                        <Ionicons name="checkmark-done-circle" size={28} color="#10b981" />
                        <Text style={styles.summaryLabel}>Paid</Text>
                        <Text style={[styles.summaryAmount, { color: '#10b981' }]}>
                            PKR {getTotalPaid().toFixed(2)}
                        </Text>
                    </View>
                </View>

                {/* Tab Navigation */}
                <View style={styles.tabContainer}>
                    <TouchableOpacity
                        style={[styles.tab, activeTab === 'invoices' && styles.activeTab]}
                        onPress={() => setActiveTab('invoices')}
                    >
                        <Text style={[styles.tabText, activeTab === 'invoices' && styles.activeTabText]}>
                            Invoices ({invoices.length})
                        </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.tab, activeTab === 'payments' && styles.activeTab]}
                        onPress={() => setActiveTab('payments')}
                    >
                        <Text style={[styles.tabText, activeTab === 'payments' && styles.activeTabText]}>
                            Payments ({payments.length})
                        </Text>
                    </TouchableOpacity>
                </View>

                {/* Content */}
                <View style={styles.contentContainer}>
                    {activeTab === 'invoices' ? (
                        invoices.length > 0 ? (
                            invoices.map(invoice => renderInvoiceCard(invoice))
                        ) : (
                            <View style={styles.emptyState}>
                                <Ionicons name="document-outline" size={48} color="#cbd5e1" />
                                <Text style={styles.emptyText}>No invoices found</Text>
                            </View>
                        )
                    ) : (
                        payments.length > 0 ? (
                            payments.map(payment => renderPaymentCard(payment))
                        ) : (
                            <View style={styles.emptyState}>
                                <Ionicons name="receipt-outline" size={48} color="#cbd5e1" />
                                <Text style={styles.emptyText}>No payment history</Text>
                            </View>
                        )
                    )}
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
    },
    title: {
        fontSize: 24,
        fontWeight: '700',
        color: '#1e293b',
    },
    summaryContainer: {
        flexDirection: 'row',
        paddingHorizontal: 16,
        marginTop: 20,
        gap: 12,
    },
    summaryCard: {
        flex: 1,
        padding: 16,
        borderRadius: 12,
        alignItems: 'center',
        backgroundColor: '#f0fdf4',
    },
    summaryLabel: {
        fontSize: 13,
        fontWeight: '600',
        color: '#64748b',
        marginTop: 8,
    },
    summaryAmount: {
        fontSize: 16,
        fontWeight: '700',
        marginTop: 4,
    },
    tabContainer: {
        flexDirection: 'row',
        paddingHorizontal: 16,
        marginTop: 20,
        gap: 12,
        backgroundColor: '#ffffff',
        borderRadius: 12,
        padding: 4,
        marginHorizontal: 16,
    },
    tab: {
        flex: 1,
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
    },
    activeTab: {
        backgroundColor: '#1e293b',
    },
    tabText: {
        fontSize: 13,
        fontWeight: '600',
        color: '#64748b',
    },
    activeTabText: {
        color: '#ffffff',
    },
    contentContainer: {
        paddingHorizontal: 16,
        marginTop: 20,
        gap: 12,
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
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
        paddingBottom: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#f1f5f9',
    },
    invoiceId: {
        fontSize: 14,
        fontWeight: '700',
        color: '#1e293b',
    },
    cardLabel: {
        fontSize: 12,
        color: '#94a3b8',
        marginTop: 4,
    },
    statusBadge: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
        backgroundColor: '#fef08a',
    },
    statusText: {
        fontSize: 12,
        fontWeight: '600',
        color: '#92400e',
    },
    cardContent: {
        gap: 8,
    },
    row: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    label: {
        fontSize: 13,
        fontWeight: '600',
        color: '#64748b',
    },
    amountText: {
        fontSize: 14,
        fontWeight: '700',
        color: '#1e293b',
    },
    dateText: {
        fontSize: 13,
        color: '#64748b',
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
        fontWeight: '500',
    },
});
