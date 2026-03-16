
import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, Alert, Image, TextInput, ActivityIndicator, Platform, ScrollView, TouchableOpacity, Linking, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Location from 'expo-location';
import * as ImagePicker from 'expo-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { Picker } from '@react-native-picker/picker';
import { CONFIG } from '../../constants/config';
import { Ionicons } from '@expo/vector-icons';
import { Calendar } from 'react-native-calendars';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getAuthHeaders } from '../../lib/query-client';

// Haversine formula to calculate distance between two points in meters
const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
  const toRad = (value: number) => (value * Math.PI) / 180;
  const R = 6371000; // Radius of Earth in meters
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

const DASHBOARD_KEY = ['dashboardStats'];

export default function DashboardScreen() {
  const qc = useQueryClient();
  const router = useRouter();

  // ── Local UI State ──────────────────────────────────────────────────
  const [status, setStatus] = useState('');
  const [statusError, setStatusError] = useState(false);
  const [location, setLocation] = useState<any>(null);
  const [image, setImage] = useState<string | null>(null);
  const [note, setNote] = useState('');
  const [initialLocation, setInitialLocation] = useState<any>(null);
  const [leaveType, setLeaveType] = useState('casual');
  const [attendancePhase, setAttendancePhase] = useState<'check_in' | 'check_out' | 'overtime_in' | 'overtime_out'>('check_in');
  const [activeTab, setActiveTab] = useState<'standard' | 'overtime'>('standard');

  const today = new Date();
  const todayStr = today.toLocaleDateString('en-CA');
  const [selectedDate, setSelectedDate] = useState<string>(todayStr);
  const [calendarMonth, setCalendarMonth] = useState<string>(todayStr);

  const [profile, setProfile] = useState<{ name: string | null; fss: string | null }>({ name: null, fss: null });

  // ── Fetch Profile from AsyncStorage ─────────────────────────────────
  useEffect(() => {
    async function loadProfile() {
      const name = await AsyncStorage.getItem('full_name');
      const fss = await AsyncStorage.getItem('fss_no');
      setProfile({ name, fss });
    }
    loadProfile();
  }, []);

  // ── Dashboard Data Query ────────────────────────────────────────────
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: DASHBOARD_KEY,
    queryFn: async () => {
      const headers = await getAuthHeaders();
      if (!headers.Authorization) throw new Error('No token');

      const [statusRes, statsRes, historyRes] = await Promise.all([
        fetch(`${CONFIG.API_BASE_URL}/attendance/my-status`, { headers }),
        fetch(`${CONFIG.API_BASE_URL}/attendance/my-stats`, { headers }),
        fetch(`${CONFIG.API_BASE_URL}/attendance/my-history`, { headers }),
      ]);

      const safeJson = async (res: Response) => {
        if (res.status === 401) {
          await AsyncStorage.removeItem('token');
          router.replace('/login');
          return null;
        }
        if (!res.ok) return null;
        const text = await res.text();
        return text ? JSON.parse(text) : null;
      };

      const [todayStatus, stats, history] = await Promise.all([
        safeJson(statusRes),
        safeJson(statsRes),
        safeJson(historyRes),
      ]);

      return {
        todayStatus,
        stats: stats || { present: 0, late: 0, absent: 0, leave: 0 },
        history: Array.isArray(history) ? history : [],
      };
    },
    refetchInterval: 60000, // Refresh every minute in background
    staleTime: 5000,
  });

  const todayStatus = data?.todayStatus;
  const stats = data?.stats || { present: 0, late: 0, absent: 0, leave: 0 };
  const history = data?.history || [];

  // ── Derived State ───────────────────────────────────────────────────
  useEffect(() => {
    if (todayStatus) {
      const hasCheckIn = !!(todayStatus.check_in && todayStatus.check_in.trim() !== '');
      const hasCheckOut = !!(todayStatus.check_out && todayStatus.check_out.trim() !== '');
      const hasOTIn = !!(todayStatus.overtime_in && todayStatus.overtime_in.trim() !== '');
      const hasOTOut = !!(todayStatus.overtime_out && todayStatus.overtime_out.trim() !== '');

      if (!hasCheckIn) {
        setAttendancePhase('check_in');
        setActiveTab('standard');
      } else if (!hasCheckOut) {
        setAttendancePhase('check_out');
        setActiveTab('standard');
      } else {
        setActiveTab('overtime');
        if (!hasOTIn) setAttendancePhase('overtime_in');
        else if (!hasOTOut) setAttendancePhase('overtime_out');
        else setAttendancePhase('check_in'); // All done for today
      }
    } else {
      setAttendancePhase('check_in');
      setActiveTab('standard');
    }
  }, [todayStatus]);

  const markedDates = useMemo(() => {
    const marks: any = {};
    const formatDate = (d: any) => {
      const date = new Date(d);
      return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    };

    history.forEach((item: any) => {
      const dateStr = formatDate(item.date);
      let dotColor = '#64748b';
      switch (item.status) {
        case 'present': dotColor = '#10b981'; break;
        case 'late': dotColor = '#f59e0b'; break;
        case 'absent': dotColor = '#ef4444'; break;
        case 'leave': dotColor = '#3b82f6'; break;
      }
      marks[dateStr] = { marked: true, dotColor };
    });
    return marks;
  }, [history]);

  const selectedDayHistory = useMemo(() => {
    return history.filter((item: any) => {
      const itemDate = new Date(item.date);
      const dateStr = `${itemDate.getFullYear()}-${String(itemDate.getMonth() + 1).padStart(2, '0')}-${String(itemDate.getDate()).padStart(2, '0')}`;
      return dateStr === selectedDate;
    });
  }, [selectedDate, history]);

  // ── Mutation ────────────────────────────────────────────────────────
  const attendanceMutation = useMutation({
    mutationFn: async ({ phase, attendanceStatus, coords, imageUri }: any) => {
      const token = await AsyncStorage.getItem('token');
      const formData = new FormData();
      formData.append('type', phase);
      formData.append('status', attendanceStatus);
      formData.append('location', JSON.stringify(coords));
      if (initialLocation) {
        formData.append('initial_location', JSON.stringify(initialLocation));
      }
      formData.append('note', note);
      if (attendanceStatus === 'leave') {
        formData.append('leave_type', leaveType);
      }

      let dateToSend = todayStr;
      if (phase === 'check_out' && todayStatus?.check_in_date) {
        dateToSend = todayStatus.check_in_date;
      } else if (phase === 'overtime_out' && todayStatus?.overtime_in_date) {
        dateToSend = todayStatus.overtime_in_date;
      }
      formData.append('date', dateToSend);

      const fileUri = imageUri.startsWith('file://') ? imageUri : `file://${imageUri}`;
      const fileName = fileUri.split('/').pop() || 'selfie.jpg';
      const fileType = 'image/jpeg';

      if (Platform.OS === 'web') {
        const response = await fetch(imageUri);
        const blob = await response.blob();
        formData.append('picture', blob, fileName);
      } else {
        formData.append('picture', { uri: fileUri, name: fileName, type: fileType } as any);
      }

      const res = await fetch(`${CONFIG.API_BASE_URL}/attendance/mark-self`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Accept': 'application/json' },
        body: formData,
      });

      if (!res.ok) {
        const text = await res.text();
        const errData = text ? JSON.parse(text) : {};
        throw new Error(errData.message || 'Verification failed.');
      }

      const text = await res.text();
      return text ? JSON.parse(text) : {};
    },
    onSuccess: () => {
      Alert.alert('Success', `${attendancePhase.replace('_', ' ').toUpperCase()} recorded successfully.`);
      setImage(null);
      setNote('');
      setStatus('');
      setInitialLocation(null);
      qc.invalidateQueries({ queryKey: DASHBOARD_KEY });
    },
    onError: (error: any) => {
      Alert.alert('Submission Error', error.message || 'An unexpected error occurred.');
    },
  });

  // ── Handlers ────────────────────────────────────────────────────────
  const takeSelfie = async () => {
    let { status: camStatus } = await ImagePicker.requestCameraPermissionsAsync();
    if (camStatus !== 'granted') {
      Alert.alert('Permission denied', 'Camera permission is required.');
      return;
    }
    let result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.5,
      cameraType: ImagePicker.CameraType.front
    });
    if (!result.canceled && result.assets && result.assets.length > 0) {
      const imageUri = result.assets[0].uri;
      setImage(imageUri);

      try {
        let { status: locStatus } = await Location.requestForegroundPermissionsAsync();
        if (locStatus === 'granted') {
          let loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
          setInitialLocation(loc.coords);
        }
      } catch (e) {
        console.warn("Failed to capture initial location:", e);
      }
    }
  };

  const handleManualSubmit = async () => {
    if (attendancePhase === 'check_in' && !status) {
      setStatusError(true);
      Alert.alert('Selection Error', 'Please select your status (Present, Late, etc.) before submitting.');
      return;
    }

    if (!image) {
      Alert.alert('Selfie Required', 'Please take a selfie first.');
      return;
    }

    let { status: locStatus } = await Location.requestForegroundPermissionsAsync();
    if (locStatus !== 'granted') {
      Alert.alert('Permission denied', 'Location permission is required for verification.');
      return;
    }

    let loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });

    if (initialLocation) {
      const distance = calculateDistance(
        initialLocation.latitude,
        initialLocation.longitude,
        loc.coords.latitude,
        loc.coords.longitude
      );
      if (distance > 100) {
        Alert.alert('Security Warning', 'You have moved too far since taking the selfie. Please take a fresh selfie.');
        setImage(null);
        setInitialLocation(null);
        return;
      }
    }

    setLocation(loc.coords);
    attendanceMutation.mutate({
      phase: attendancePhase,
      attendanceStatus: status || 'present',
      coords: loc.coords,
      imageUri: image
    });
  };

  const handleLogout = async () => {
    await AsyncStorage.removeItem('token');
    await AsyncStorage.removeItem('employee_id');
    router.replace('/login');
  };

  const goToPrevMonth = () => {
    const current = new Date(calendarMonth);
    current.setMonth(current.getMonth() - 1);
    setCalendarMonth(current.toISOString().split('T')[0]);
  };

  const goToNextMonth = () => {
    const current = new Date(calendarMonth);
    const nextMonth = new Date(current.getFullYear(), current.getMonth() + 1, 1);
    if (nextMonth <= today) {
      current.setMonth(current.getMonth() + 1);
      setCalendarMonth(current.toISOString().split('T')[0]);
    }
  };

  const isNextMonthDisabled = () => {
    const current = new Date(calendarMonth);
    const nextMonth = new Date(current.getFullYear(), current.getMonth() + 1, 1);
    return nextMonth > today;
  };

  const onDayPress = (day: any) => {
    setSelectedDate(day.dateString);
  };

  const getStatusStyle = (s: string) => {
    switch (s) {
      case 'present': return { color: '#10b981', bg: '#ecfdf5' };
      case 'late': return { color: '#f59e0b', bg: '#fffbeb' };
      case 'absent': return { color: '#ef4444', bg: '#fef2f2' };
      case 'leave': return { color: '#3b82f6', bg: '#eff6ff' };
      default: return { color: '#64748b', bg: '#f8fafc' };
    }
  };

  if (isLoading && !data) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#1677ff" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" />
      <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

        {/* ── Compact Profile Header ── */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <View style={styles.avatarMini}>
              <Text style={styles.avatarMiniText}>{(profile.name || 'E').charAt(0).toUpperCase()}</Text>
            </View>
            <View>
              <Text style={styles.greetText}>Welcome back</Text>
              <Text style={styles.profileFullName}>{profile.name || 'Employee'}</Text>
              <Text style={styles.profileFssNo}>FSE-{profile.fss || '---'}</Text>
            </View>
          </View>
          <View style={styles.headerRight}>
            <View style={styles.liveBadge}>
              <View style={styles.liveDot} />
              <Text style={styles.liveBadgeText}>LIVE</Text>
            </View>
            <TouchableOpacity onPress={handleLogout} style={styles.logoutBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Ionicons name="power-outline" size={18} color="#94a3b8" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Main Attendance Card */}
        <View style={styles.attendanceWhiteCard}>
          <View style={styles.cardHeaderSmall}>
            <Text style={styles.cardHeaderLabel}>Current Status</Text>
            <View style={styles.monthBadge}>
              <Text style={styles.monthBadgeText}>{new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</Text>
            </View>
          </View>
          <Text style={styles.readyText}>{todayStatus ? 'Daily synchronization complete' : 'Ready to mark your attendance'}</Text>

          {todayStatus && todayStatus.check_in && todayStatus.check_out && todayStatus.overtime_in && todayStatus.overtime_out ? (
            <View style={styles.capturedView}>
              <View style={styles.capturedIconCircle}>
                <Ionicons name="checkmark-done" size={40} color="#fff" />
              </View>
              <Text style={styles.capturedTitle}>Shift Completed</Text>
              <Text style={{ color: '#64748b', textAlign: 'center' }}>All attendance phases for today have been recorded.</Text>
            </View>
          ) : selectedDate !== todayStr ? (
            <View style={[styles.capturedView, { paddingVertical: 40 }]}>
              <View style={[styles.capturedIconCircle, { backgroundColor: '#94a3b8' }]}>
                <Ionicons name="calendar-outline" size={40} color="#fff" />
              </View>
              <Text style={styles.capturedTitle}>Past Date Viewing</Text>
              <Text style={{ color: '#64748b', textAlign: 'center', marginTop: 8 }}>
                Attendance can only be marked for the current date ({todayStr}).
              </Text>
            </View>
          ) : (
            <View style={styles.attendanceForm}>
              {todayStatus?.check_out && (
                <View style={styles.tabContainer}>
                  <TouchableOpacity
                    onPress={() => setActiveTab('standard')}
                    style={[styles.tabBtn, activeTab === 'standard' && styles.tabBtnActive]}
                  >
                    <Ionicons name="time" size={16} color={activeTab === 'standard' ? '#2563eb' : '#64748b'} style={{ marginRight: 6 }} />
                    <Text style={[styles.tabText, activeTab === 'standard' && styles.tabTextActive]}>Regular Shift</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => setActiveTab('overtime')}
                    style={[styles.tabBtn, activeTab === 'overtime' && styles.tabBtnActive]}
                  >
                    <Ionicons name="flash" size={16} color={activeTab === 'overtime' ? '#7c3aed' : '#64748b'} style={{ marginRight: 6 }} />
                    <Text style={[styles.tabText, activeTab === 'overtime' && styles.tabTextActive]}>Overtime</Text>
                  </TouchableOpacity>
                </View>
              )}

              <View style={styles.phaseSelectorRow}>
                {(activeTab === 'standard' ? [
                  { id: 'check_in', label: 'CHECK IN', icon: 'enter-outline', color: '#2563eb', active: attendancePhase === 'check_in', done: !!todayStatus?.check_in, disabled: false },
                  { id: 'check_out', label: 'CHECK OUT', icon: 'exit-outline', color: '#f59e0b', active: attendancePhase === 'check_out', done: !!todayStatus?.check_out, disabled: !todayStatus?.check_in },
                ] : [
                  { id: 'overtime_in', label: 'OT IN', icon: 'play-outline', color: '#7c3aed', active: attendancePhase === 'overtime_in', done: !!todayStatus?.overtime_in, disabled: false },
                  { id: 'overtime_out', label: 'OT OUT', icon: 'stop-outline', color: '#10b981', active: attendancePhase === 'overtime_out', done: !!todayStatus?.overtime_out, disabled: !todayStatus?.overtime_in },
                ]).map((phase: any) => (
                  <TouchableOpacity
                    key={phase.id}
                    onPress={() => !phase.disabled && setAttendancePhase(phase.id as any)}
                    disabled={phase.disabled}
                    style={[
                      styles.phaseBtn,
                      phase.active && { borderColor: phase.color, borderBottomWidth: 4 },
                      phase.done && styles.phaseBtnDone,
                      phase.disabled && { opacity: 0.3 }
                    ]}
                  >
                    <Ionicons name={phase.icon as any} size={14} color={phase.active ? phase.color : phase.disabled ? '#cbd5e1' : '#94a3b8'} style={{ marginRight: 4 }} />
                    <Text style={[
                      styles.phaseBtnText,
                      phase.active && { color: phase.color, fontWeight: '900' },
                      phase.done && styles.phaseBtnTextDone,
                      phase.disabled && { color: '#cbd5e1' }
                    ]}>
                      {phase.label}
                    </Text>
                    {phase.done && <Ionicons name={"checkmark-circle" as any} size={12} color="#10b981" style={{ marginLeft: 4 }} />}
                  </TouchableOpacity>
                ))}
              </View>

              {(() => {
                const isCurrentPhaseDone =
                  (attendancePhase === 'check_in' && todayStatus?.check_in && todayStatus.check_in.trim() !== '') ||
                  (attendancePhase === 'check_out' && todayStatus?.check_out && todayStatus.check_out.trim() !== '') ||
                  (attendancePhase === 'overtime_in' && todayStatus?.overtime_in && todayStatus.overtime_in.trim() !== '') ||
                  (attendancePhase === 'overtime_out' && todayStatus?.overtime_out && todayStatus.overtime_out.trim() !== '');

                if (isCurrentPhaseDone) {
                  const phaseData = attendancePhase === 'check_in' ? { time: todayStatus?.check_in, picture: todayStatus?.picture, loc: todayStatus?.location } :
                    attendancePhase === 'check_out' ? { time: todayStatus?.check_out, picture: todayStatus?.check_out_picture, loc: todayStatus?.check_out_location } :
                      attendancePhase === 'overtime_in' ? { time: todayStatus?.overtime_in, picture: todayStatus?.overtime_in_picture, loc: todayStatus?.overtime_in_location } :
                        { time: todayStatus?.overtime_out, picture: todayStatus?.overtime_out_picture, loc: todayStatus?.overtime_out_location };

                  return (
                    <View style={styles.phaseSummaryCard}>
                      <View style={styles.summaryTopRow}>
                        <View style={[styles.summaryStatusBadge, { backgroundColor: attendancePhase.includes('overtime') ? '#f5f3ff' : '#eff6ff' }]}>
                          <Ionicons name="checkmark-circle" size={16} color={attendancePhase.includes('overtime') ? '#7c3aed' : '#2563eb'} />
                          <Text style={[styles.summaryStatusText, { color: attendancePhase.includes('overtime') ? '#7c3aed' : '#2563eb' }]}>RECORDED</Text>
                        </View>
                        <Text style={styles.summaryTimeText}>{phaseData.time}</Text>
                      </View>
                      {phaseData.picture && <Image source={{ uri: phaseData.picture }} style={styles.summaryImage} />}
                      {phaseData.loc && (
                        <TouchableOpacity
                          style={styles.summaryLocationBtn}
                          onPress={() => {
                            try {
                              const coords = JSON.parse(phaseData.loc);
                              Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${coords.latitude},${coords.longitude}`);
                            } catch (e) { }
                          }}
                        >
                          <Ionicons name="location" size={16} color="#64748b" />
                          <Text style={styles.summaryLocationText}>View Captured Location</Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  );
                }

                return (
                  <>
                    <TouchableOpacity
                      style={[
                        styles.dashedCameraTrigger,
                        { borderColor: attendancePhase === 'check_in' ? '#2563eb' : attendancePhase === 'check_out' ? '#f59e0b' : attendancePhase === 'overtime_in' ? '#7c3aed' : '#10b981' }
                      ]}
                      onPress={takeSelfie}
                    >
                      {image ? <Image source={{ uri: image }} style={styles.fullPreview} /> :
                        <View style={styles.cameraCenter}>
                          <View style={styles.cameraIconBg}>
                            <Ionicons name="camera" size={30} color="#1677ff" />
                          </View>
                          <Text style={styles.cameraPromptText}>Take {attendancePhase.replace('_', ' ')} Selfie</Text>
                        </View>
                      }
                    </TouchableOpacity>

                    {attendancePhase === 'check_in' && !todayStatus?.check_in && (
                      <View style={styles.statusBarRow}>
                        {['present', 'late', 'absent', 'leave'].map((s) => (
                          <TouchableOpacity
                            key={s}
                            onPress={() => setStatus(s)}
                            style={[styles.statusSelectBtn, status === s && { backgroundColor: getStatusStyle(s).color }]}
                          >
                            <Text style={[styles.statusSelectText, status === s && { color: '#fff' }]}>{s.toUpperCase()}</Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    )}

                    <TextInput
                      style={styles.whiteNoteInput}
                      placeholder="Note..."
                      value={note}
                      onChangeText={setNote}
                    />

                    <TouchableOpacity
                      style={[styles.confirmBtn, { backgroundColor: '#1677ff' }, (!image || attendanceMutation.isPending) && styles.confirmBtnDisabled]}
                      onPress={handleManualSubmit}
                      disabled={!image || attendanceMutation.isPending}
                    >
                      {attendanceMutation.isPending ? <ActivityIndicator color="#fff" /> : <Text style={styles.confirmBtnText}>SUBMIT</Text>}
                    </TouchableOpacity>
                  </>
                );
              })()}
            </View>
          )}
        </View>

        {/* History / Calendar Section */}
        <View style={styles.historySectionLabel}>
          <Text style={styles.historyMainTitle}>Timeline History</Text>
          <TouchableOpacity onPress={() => router.push('/(tabs)/history')} style={styles.viewAllBtn}>
            <Text style={styles.viewAllText}>Full History</Text>
            <Ionicons name="chevron-forward" size={12} color="#1677ff" />
          </TouchableOpacity>
        </View>

        <View style={styles.premiumCalendarCard}>
          <View style={styles.calendarSummaryHeader}>
            <View style={styles.calMonthInfo}>
              <Text style={styles.calMonthName}>{new Date(calendarMonth).toLocaleString('default', { month: 'long' })}</Text>
            </View>
            <View style={styles.calNavArrows}>
              <TouchableOpacity onPress={goToPrevMonth} style={styles.calNavBtn}><Ionicons name="chevron-back" size={20} color="#64748b" /></TouchableOpacity>
              <TouchableOpacity onPress={goToNextMonth} disabled={isNextMonthDisabled()} style={styles.calNavBtn}><Ionicons name="chevron-forward" size={20} color="#64748b" /></TouchableOpacity>
            </View>
          </View>
          <View style={styles.calStatsRow}>
            <View style={styles.calStatBox}><Text style={styles.calStatVal}>{stats.present + stats.late + stats.absent + stats.leave}</Text><Text style={styles.calStatLab}>LOGS</Text></View>
            <View style={styles.calStatDivider} />
            <View style={styles.calStatBox}><Text style={[styles.calStatVal, { color: '#10b981' }]}>{stats.present}</Text><Text style={styles.calStatLab}>PRES</Text></View>
            <View style={styles.calStatDivider} />
            <View style={styles.calStatBox}><Text style={[styles.calStatVal, { color: '#f59e0b' }]}>{stats.late}</Text><Text style={styles.calStatLab}>LATE</Text></View>
            <View style={styles.calStatDivider} />
            <View style={styles.calStatBox}><Text style={[styles.calStatVal, { color: '#3b82f6' }]}>{stats.leave}</Text><Text style={styles.calStatLab}>LEAV</Text></View>
          </View>
          <Calendar
            current={calendarMonth}
            onDayPress={onDayPress}
            markedDates={{ ...markedDates, [selectedDate]: { ...markedDates[selectedDate], selected: true, selectedColor: '#1677ff' } }}
            theme={{ selectedDayBackgroundColor: '#1677ff', todayTextColor: '#1677ff', dotColor: '#1677ff' }}
            style={{ marginTop: 10 }}
            hideArrows={true}
          />
        </View>

        <View style={styles.activityHeaderRow}>
          <Text style={styles.recentActivityTitle}>ACTIVITY · {selectedDate}</Text>
          <View style={styles.logCountTag}><Text style={styles.logCountText}>{selectedDayHistory.length} logs</Text></View>
        </View>

        {selectedDayHistory.map((item: any, idx: number) => (
          <View key={idx} style={styles.recordWrapper}>
            <View style={styles.dayRecordHeader}>
              <View style={[styles.statusBadge, { backgroundColor: getStatusStyle(item.status).bg }]}>
                <Text style={[styles.statusLabel, { color: getStatusStyle(item.status).color }]}>{item.status.toUpperCase()}</Text>
              </View>
              <Text style={styles.dayRecordTime}>{new Date(item.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Text>
            </View>
            {item.check_in && <Text style={styles.timelineLabel}>Check In: {item.check_in}</Text>}
            {item.check_out && <Text style={styles.timelineLabel}>Check Out: {item.check_out}</Text>}
            {item.note && <Text style={styles.timelineNoteText}>Note: {item.note}</Text>}
          </View>
        ))}

        <View style={styles.bottomSpacer} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#f5f7f9' },
  container: { flex: 1 },
  scrollContent: { paddingHorizontal: 16, paddingTop: 8 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#ffffff', borderRadius: 6, padding: 12, marginBottom: 12, marginTop: 4, borderWidth: 1, borderColor: '#e2e8f0' },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  avatarMini: { width: 40, height: 40, borderRadius: 6, backgroundColor: '#1677ff', justifyContent: 'center', alignItems: 'center' },
  avatarMiniText: { color: '#fff', fontSize: 16, fontWeight: '800' },
  greetText: { fontSize: 11, color: '#94a3b8', fontWeight: '500' },
  profileFullName: { fontSize: 15, fontWeight: '700', color: '#1e293b' },
  profileFssNo: { fontSize: 11, fontWeight: '600', color: '#94a3b8' },
  liveBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f0fdf4', paddingHorizontal: 7, paddingVertical: 3, borderRadius: 10, gap: 4 },
  liveDot: { width: 5, height: 5, borderRadius: 3, backgroundColor: '#22c55e' },
  liveBadgeText: { fontSize: 10, fontWeight: '700', color: '#22c55e' },
  logoutBtn: { padding: 4 },
  attendanceWhiteCard: { backgroundColor: '#fff', borderRadius: 6, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: '#e2e8f0' },
  cardHeaderSmall: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  cardHeaderLabel: { fontSize: 15, fontWeight: '700', color: '#1e293b' },
  monthBadge: { backgroundColor: '#e6f4ff', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10 },
  monthBadgeText: { fontSize: 11, fontWeight: '700', color: '#0958d9' },
  readyText: { fontSize: 13, color: '#94a3b8', marginBottom: 14, fontWeight: '500' },
  attendanceForm: { width: '100%' },
  dashedCameraTrigger: { width: '100%', height: 160, borderRadius: 6, borderStyle: 'dashed', borderWidth: 2, borderColor: '#e2e8f0', justifyContent: 'center', alignItems: 'center', marginBottom: 14, overflow: 'hidden' },
  fullPreview: { width: '100%', height: '100%', objectFit: 'cover' },
  cameraCenter: { alignItems: 'center' },
  cameraIconBg: { width: 52, height: 52, borderRadius: 26, backgroundColor: '#f5f7f9', justifyContent: 'center', alignItems: 'center', marginBottom: 10 },
  cameraPromptText: { fontSize: 13, fontWeight: '600', color: '#64748b' },
  statusBarRow: { flexDirection: 'row', gap: 8, marginBottom: 14 },
  statusSelectBtn: { flex: 1, height: 36, borderRadius: 6, borderWidth: 1, borderColor: '#e2e8f0', backgroundColor: '#f5f7f9', justifyContent: 'center', alignItems: 'center' },
  statusSelectText: { fontSize: 10, fontWeight: '700', color: '#94a3b8' },
  whiteNoteInput: { backgroundColor: '#f5f7f9', borderRadius: 6, padding: 12, fontSize: 13, color: '#1e293b', marginBottom: 14, borderWidth: 1, borderColor: '#e2e8f0' },
  confirmBtn: { height: 44, borderRadius: 6, flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },
  confirmBtnDisabled: { opacity: 0.5 },
  confirmBtnText: { color: '#fff', fontSize: 14, fontWeight: '700' },
  recordWrapper: { backgroundColor: '#fff', borderRadius: 6, padding: 12, marginBottom: 10, borderWidth: 1, borderColor: '#e2e8f0' },
  dayRecordHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  statusBadge: { paddingHorizontal: 7, paddingVertical: 3, borderRadius: 4 },
  statusLabel: { fontSize: 10, fontWeight: '700' },
  dayRecordTime: { fontSize: 12, fontWeight: '600', color: '#64748b' },
  historySectionLabel: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  historyMainTitle: { fontSize: 15, fontWeight: '700', color: '#1e293b' },
  viewAllBtn: { flexDirection: 'row', alignItems: 'center', gap: 3, paddingHorizontal: 10, paddingVertical: 5, backgroundColor: '#e6f4ff', borderRadius: 10 },
  viewAllText: { fontSize: 11, fontWeight: '700', color: '#1677ff' },
  premiumCalendarCard: { backgroundColor: '#fff', borderRadius: 6, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: '#e2e8f0' },
  calendarSummaryHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  calMonthInfo: { flex: 1 },
  calMonthName: { fontSize: 16, fontWeight: '700', color: '#1e293b' },
  calNavArrows: { flexDirection: 'row', gap: 4 },
  calNavBtn: { padding: 6, borderRadius: 6, backgroundColor: '#f5f7f9' },
  calStatsRow: { flexDirection: 'row', paddingVertical: 12, borderTopWidth: 1, borderTopColor: '#f1f5f9', borderBottomWidth: 1, borderBottomColor: '#f1f5f9', marginBottom: 8 },
  calStatBox: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  calStatVal: { fontSize: 18, fontWeight: '800', marginBottom: 2 },
  calStatLab: { fontSize: 9, fontWeight: '700', color: '#94a3b8' },
  calStatDivider: { width: 1, height: '70%', backgroundColor: '#e2e8f0', alignSelf: 'center' },
  activityHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  recentActivityTitle: { fontSize: 11, fontWeight: '700', color: '#94a3b8' },
  logCountTag: { backgroundColor: '#f1f5f9', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10 },
  logCountText: { fontSize: 11, fontWeight: '600', color: '#475569' },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  phaseSelectorRow: { flexDirection: 'row', gap: 8, marginBottom: 14 },
  phaseBtn: { flex: 1, paddingVertical: 9, borderRadius: 6, backgroundColor: '#f5f7f9', alignItems: 'center', justifyContent: 'center', flexDirection: 'row', borderWidth: 1, borderColor: '#e2e8f0' },
  phaseBtnDone: { backgroundColor: '#f6ffed' },
  phaseBtnText: { fontSize: 10, fontWeight: '700', color: '#64748b' },
  phaseBtnTextDone: { color: '#22c55e' },
  phaseSummaryCard: { backgroundColor: '#f5f7f9', borderRadius: 6, padding: 14, borderWidth: 1, borderColor: '#e2e8f0' },
  summaryTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  summaryStatusBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 4 },
  summaryStatusText: { fontSize: 11, fontWeight: '700' },
  summaryTimeText: { fontSize: 14, fontWeight: '700', color: '#1e293b' },
  summaryImage: { width: '100%', height: 180, borderRadius: 6, marginBottom: 10 },
  summaryLocationBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 6 },
  summaryLocationText: { fontSize: 12, color: '#64748b' },
  statusInfoRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 10 },
  statusInfoLabel: { fontSize: 12, fontWeight: '600', color: '#94a3b8' },
  statusInfoValue: { fontSize: 12, fontWeight: '800' },
  bottomSpacer: { height: 40 },
  tabContainer: { flexDirection: 'row', backgroundColor: '#f5f7f9', borderRadius: 6, padding: 3, marginBottom: 14, borderWidth: 1, borderColor: '#e2e8f0' },
  tabBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 8, borderRadius: 4, gap: 4 },
  tabBtnActive: { backgroundColor: '#ffffff', borderWidth: 1, borderColor: '#e2e8f0' },
  tabText: { fontSize: 12, fontWeight: '600', color: '#64748b' },
  tabTextActive: { color: '#1e293b' },
  capturedView: { alignItems: 'center', paddingVertical: 14 },
  capturedIconCircle: { width: 64, height: 64, borderRadius: 32, backgroundColor: '#22c55e', justifyContent: 'center', alignItems: 'center', marginBottom: 14 },
  capturedTitle: { fontSize: 20, fontWeight: '700', color: '#1e293b', marginBottom: 8 },
  timelineLabel: { fontSize: 12, fontWeight: '600', color: '#475569' },
  timelineNoteText: { fontSize: 12, color: '#64748b', fontStyle: 'italic' },
});
