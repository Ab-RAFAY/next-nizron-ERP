
import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Calendar } from 'react-native-calendars';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { CONFIG } from '../../constants/config';
import { useQuery } from '@tanstack/react-query';
import { getAuthHeaders } from '../../lib/query-client';

const HISTORY_KEY = ['attendanceHistory'];

const STATUS_CONFIG: Record<string, { color: string; bg: string; textColor: string; label: string }> = {
  present: { color: '#22c55e', bg: '#f6ffed', textColor: '#52c41a', label: 'Present' },
  late:    { color: '#f59e0b', bg: '#fffbe6', textColor: '#d48806', label: 'Late' },
  absent:  { color: '#ef4444', bg: '#fff1f0', textColor: '#cf1322', label: 'Absent' },
  leave:   { color: '#1677ff', bg: '#e6f4ff', textColor: '#0958d9', label: 'Leave' },
};

const getStatusConfig = (s: string) =>
  STATUS_CONFIG[s] ?? { color: '#94a3b8', bg: '#f5f7f9', textColor: '#475569', label: s.toUpperCase() };

export default function AttendanceHistoryScreen() {
  const { data: history = [], isLoading } = useQuery({
    queryKey: HISTORY_KEY,
    queryFn: async () => {
      const headers = await getAuthHeaders();
      const res = await fetch(`${CONFIG.API_BASE_URL}/attendance/my-history`, { headers });
      if (!res.ok) throw new Error('Failed to fetch history');
      return await res.json();
    },
    staleTime: 1000 * 60 * 5,
  });

  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);

  const markedDates = useMemo(() => {
    const marks: Record<string, any> = {};
    history.forEach((item: any) => {
      const dateStr = new Date(item.date).toISOString().split('T')[0];
      const cfg = getStatusConfig(item.status);
      marks[dateStr] = {
        marked: true,
        dotColor: cfg.color,
        selected: selectedDate === dateStr,
        selectedColor: '#1677ff',
      };
    });
    if (selectedDate && !marks[selectedDate]) {
      marks[selectedDate] = { selected: true, selectedColor: '#1677ff' };
    }
    return marks;
  }, [history, selectedDate]);

  const selectedRecords = useMemo(() => {
    return history.filter(
      (item: any) => new Date(item.date).toISOString().split('T')[0] === selectedDate
    );
  }, [history, selectedDate]);

  const totalStats = useMemo(() => {
    return history.reduce(
      (acc: any, item: any) => {
        const key = item.status as string;
        if (key in acc) acc[key]++;
        return acc;
      },
      { present: 0, late: 0, absent: 0, leave: 0 }
    );
  }, [history]);

  const STAT_CARDS = [
    { key: 'present', label: 'Present', value: totalStats.present, color: '#22c55e', bg: '#f6ffed' },
    { key: 'late',    label: 'Late',    value: totalStats.late,    color: '#f59e0b', bg: '#fffbe6' },
    { key: 'absent',  label: 'Absent',  value: totalStats.absent,  color: '#ef4444', bg: '#fff1f0' },
    { key: 'leave',   label: 'Leave',   value: totalStats.leave,   color: '#1677ff', bg: '#e6f4ff' },
  ];

  const selectedDateFormatted = new Date(selectedDate).toLocaleDateString('en-US', {
    weekday: 'short',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  if (isLoading && history.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Attendance History</Text>
        </View>
        <View style={styles.centered}>
          <ActivityIndicator size="small" color="#1677ff" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Attendance History</Text>
      </View>

      <FlatList
        data={selectedRecords}
        keyExtractor={(_, i) => String(i)}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={() => (
          <>
            <View style={styles.statsGrid}>
              {STAT_CARDS.map((s) => (
                <View key={s.key} style={[styles.statCard, { backgroundColor: s.bg, borderColor: s.color + '30' }]}>
                  <Text style={[styles.statValue, { color: s.color }]}>{s.value}</Text>
                  <Text style={styles.statLabel}>{s.label}</Text>
                </View>
              ))}
            </View>

            <View style={styles.calendarCard}>
              <Calendar
                onDayPress={(day) => setSelectedDate(day.dateString)}
                markedDates={markedDates}
                maxDate={new Date().toISOString().split('T')[0]}
                theme={{
                  selectedDayBackgroundColor: '#1677ff',
                  todayTextColor: '#1677ff',
                  dotColor: '#1677ff',
                  textDayFontSize: 13,
                  textMonthFontSize: 16,
                  textDayHeaderFontSize: 11,
                }}
              />
            </View>

            <View style={styles.dateLabelRow}>
              <View style={styles.calendarDot} />
              <Text style={styles.dateLabel}>{selectedDateFormatted}</Text>
              <View style={[styles.recordCountTag, { backgroundColor: '#f1f5f9' }]}>
                <Text style={styles.recordCountText}>{selectedRecords.length} record{selectedRecords.length !== 1 ? 's' : ''}</Text>
              </View>
            </View>
          </>
        )}
        ListEmptyComponent={() => (
          <View style={styles.emptyCard}>
            <Ionicons name="calendar-outline" size={36} color="#e2e8f0" />
            <Text style={styles.emptyText}>No records for this date</Text>
          </View>
        )}
        renderItem={({ item }) => {
          const cfg = getStatusConfig(item.status);
          return (
            <View style={styles.recordCard}>
              <View style={styles.recordHeaderRow}>
                <View style={[styles.statusTag, { backgroundColor: cfg.bg }]}>
                  <Text style={[styles.statusTagText, { color: cfg.textColor }]}>{cfg.label}</Text>
                </View>
                <Text style={styles.recordTime}>
                  {new Date(item.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </Text>
              </View>

              {(item.check_in || item.check_out) && (
                <View style={styles.timelineRow}>
                  {item.check_in && (
                    <View style={styles.timelineChip}>
                      <Ionicons name="enter-outline" size={11} color="#1677ff" />
                      <Text style={styles.timelineChipText}>IN {item.check_in}</Text>
                    </View>
                  )}
                  {item.check_out && (
                    <View style={[styles.timelineChip, { backgroundColor: '#fff7ed' }]}>
                      <Ionicons name="exit-outline" size={11} color="#f59e0b" />
                      <Text style={[styles.timelineChipText, { color: '#b45309' }]}>OUT {item.check_out}</Text>
                    </View>
                  )}
                </View>
              )}

              {item.note && (
                <View style={styles.noteRow}>
                  <Ionicons name="chatbubble-outline" size={12} color="#94a3b8" />
                  <Text style={styles.noteText}>{item.note}</Text>
                </View>
              )}

              {item.location && (
                <TouchableOpacity
                  style={styles.locBtn}
                  onPress={() => {
                    try {
                      const coords = JSON.parse(item.location);
                      Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${coords.latitude},${coords.longitude}`);
                    } catch { }
                  }}
                >
                  <Ionicons name="location-outline" size={12} color="#1677ff" />
                  <Text style={styles.locText}>View on Maps</Text>
                </TouchableOpacity>
              )}
            </View>
          );
        }}
        ListFooterComponent={() => <View style={{ height: 40 }} />}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f7f9' },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  header: { height: 50, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, backgroundColor: '#ffffff', borderBottomWidth: 1, borderBottomColor: '#e2e8f0' },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#1e293b' },
  listContent: { paddingHorizontal: 16, paddingTop: 16 },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 16 },
  statCard: { width: '47.5%', borderRadius: 6, paddingVertical: 14, paddingHorizontal: 16, borderWidth: 1, alignItems: 'center' },
  statValue: { fontSize: 24, fontWeight: '800', marginBottom: 2 },
  statLabel: { fontSize: 11, fontWeight: '600', color: '#64748b' },
  calendarCard: { backgroundColor: '#ffffff', borderRadius: 6, borderWidth: 1, borderColor: '#e2e8f0', marginBottom: 16, overflow: 'hidden' },
  dateLabelRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  calendarDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#1677ff' },
  dateLabel: { flex: 1, fontSize: 13, fontWeight: '700', color: '#1e293b' },
  recordCountTag: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10 },
  recordCountText: { fontSize: 11, color: '#475569', fontWeight: '600' },
  recordCard: { backgroundColor: '#ffffff', borderRadius: 6, padding: 12, marginBottom: 8, borderWidth: 1, borderColor: '#e2e8f0' },
  recordHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  statusTag: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 4 },
  statusTagText: { fontSize: 11, fontWeight: '700' },
  recordTime: { fontSize: 13, fontWeight: '600', color: '#475569' },
  timelineRow: { flexDirection: 'row', gap: 6, flexWrap: 'wrap', marginBottom: 6 },
  timelineChip: { flexDirection: 'row', alignItems: 'center', gap: 3, backgroundColor: '#e6f4ff', paddingHorizontal: 7, paddingVertical: 3, borderRadius: 4 },
  timelineChipText: { fontSize: 11, fontWeight: '600', color: '#0958d9' },
  noteRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 6, marginBottom: 6 },
  noteText: { fontSize: 12, color: '#64748b', flex: 1 },
  locBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, alignSelf: 'flex-start' },
  locText: { fontSize: 12, fontWeight: '600', color: '#1677ff' },
  emptyCard: { alignItems: 'center', justifyContent: 'center', paddingVertical: 40, backgroundColor: '#ffffff', borderRadius: 6, borderWidth: 1, borderStyle: 'dashed', borderColor: '#e2e8f0', gap: 8 },
  emptyText: { fontSize: 13, color: '#94a3b8', fontWeight: '500' },
});
