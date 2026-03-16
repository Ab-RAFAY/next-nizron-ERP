
import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { CONFIG } from '../constants/config';
import { SplashOverlay } from '../components/SplashOverlay';

export default function LoginScreen() {
  const [fssNo, setFssNo] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showSplash, setShowSplash] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();

  const formatCNIC = (text: string) => {
    const cleaned = text.replace(/\D/g, '');
    let formatted = cleaned;
    if (cleaned.length > 5 && cleaned.length <= 12) {
      formatted = `${cleaned.slice(0, 5)}-${cleaned.slice(5)}`;
    } else if (cleaned.length > 12) {
      formatted = `${cleaned.slice(0, 5)}-${cleaned.slice(5, 12)}-${cleaned.slice(12, 13)}`;
    }
    return formatted;
  };

  const handleIdentifierChange = (text: string) => {
    if (isClient) {
      setFssNo(text);
      return;
    }
    if (text.length > 5 || (fssNo.includes('-') && text.length > 4)) {
      setFssNo(formatCNIC(text));
    } else {
      setFssNo(text);
    }
  };

  const handleLogin = async () => {
    if (!fssNo || !password) {
      Alert.alert('Required Fields', `Please enter your ${isClient ? 'email' : 'FSS Number or CNIC'} and password.`);
      return;
    }
    setLoading(true);
    try {
      const endpoint = isClient ? '/auth/client-login' : '/auth/employee-login';
      const body = isClient ? { email: fssNo, password } : { fss_no: fssNo, password };

      const res = await fetch(`${CONFIG.API_BASE_URL}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();

      if (res.ok && (data.token || data.access_token)) {
        const token = data.token || data.access_token;
        await AsyncStorage.setItem('token', token);
        await AsyncStorage.setItem('user_type', isClient ? 'client' : 'employee');
        if (isClient) {
          await AsyncStorage.setItem('client_id', String(data.client_id));
          await AsyncStorage.setItem('full_name', data.name || '');
          setShowSplash(true);
        } else {
          await AsyncStorage.setItem('employee_id', data.employee_id);
          await AsyncStorage.setItem('full_name', data.full_name || '');
          await AsyncStorage.setItem('fss_no', data.fss_no || '');
          setShowSplash(true);
        }
      } else {
        Alert.alert('Login Failed', data.message || 'Invalid credentials');
      }
    } catch (e: any) {
      Alert.alert('Error', `Could not connect to server: ${e.message || 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.root}
    >
      <SplashOverlay
        visible={showSplash}
        onFinish={() => router.replace(isClient ? '/(client-tabs)' : '/(tabs)')}
      />

      {/* Dark gradient background */}
      <View style={styles.bgLayer} />

      <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
        <ScrollView
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Brand mark */}
          <View style={styles.brandSection}>
            <View style={styles.logoBox}>
              <Image
                source={require('../assets/images/images.png')}
                style={styles.logoImg}
                resizeMode="contain"
              />
            </View>
            <Text style={styles.brandName}>NIZRON TECH ERP</Text>
            <Text style={styles.brandTagline}>Enterprise Resource Platform</Text>
          </View>

          {/* Login Card */}
          <View style={styles.card}>
            {/* Tab Switcher */}
            <View style={styles.tabRow}>
              <TouchableOpacity
                style={[styles.tabPill, !isClient && styles.tabPillActive]}
                onPress={() => { setIsClient(false); setFssNo(''); }}
                activeOpacity={0.7}
              >
                <Ionicons
                  name="person-outline"
                  size={14}
                  color={!isClient ? '#ffffff' : '#94a3b8'}
                  style={{ marginRight: 5 }}
                />
                <Text style={[styles.tabPillText, !isClient && styles.tabPillTextActive]}>
                  Employee
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.tabPill, isClient && styles.tabPillClientActive]}
                onPress={() => { setIsClient(true); setFssNo(''); }}
                activeOpacity={0.7}
              >
                <Ionicons
                  name="business-outline"
                  size={14}
                  color={isClient ? '#ffffff' : '#94a3b8'}
                  style={{ marginRight: 5 }}
                />
                <Text style={[styles.tabPillText, isClient && styles.tabPillTextActive]}>
                  Client
                </Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.cardTitle}>
              {isClient ? 'Client Sign In' : 'Employee Sign In'}
            </Text>
            <Text style={styles.cardSub}>
              {isClient
                ? 'Access your sites, guards and reports.'
                : 'Manage your attendance and daily tasks.'}
            </Text>

            {/* Identifier */}
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>
                {isClient ? 'EMAIL ADDRESS' : 'FSS NO. / CNIC'}
              </Text>
              <View style={styles.inputWrap}>
                <Ionicons
                  name={isClient ? 'mail-outline' : 'card-outline'}
                  size={16}
                  color="#94a3b8"
                  style={styles.inputIcon}
                />
                <TextInput
                  style={styles.textInput}
                  placeholder={isClient ? 'email@example.com' : '000 or 1111-42347771-1'}
                  placeholderTextColor="#94a3b8"
                  value={fssNo}
                  onChangeText={handleIdentifierChange}
                  autoCapitalize="none"
                  keyboardType={isClient ? 'email-address' : 'numeric'}
                />
              </View>
            </View>

            {/* Password */}
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>PASSWORD</Text>
              <View style={styles.inputWrap}>
                <Ionicons name="lock-closed-outline" size={16} color="#94a3b8" style={styles.inputIcon} />
                <TextInput
                  style={[styles.textInput, { flex: 1 }]}
                  placeholder="••••••••"
                  placeholderTextColor="#94a3b8"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                />
                <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeBtn}>
                  <Ionicons name={showPassword ? 'eye-outline' : 'eye-off-outline'} size={16} color="#94a3b8" />
                </TouchableOpacity>
              </View>
            </View>

            {/* Login Button */}
            <TouchableOpacity
              style={[styles.loginBtn, loading && styles.loginBtnDisabled]}
              onPress={handleLogin}
              disabled={loading}
              activeOpacity={0.85}
            >
              {loading ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <>
                  <Text style={styles.loginBtnText}>SIGN IN</Text>
                  <Ionicons name="arrow-forward" size={16} color="#fff" style={{ marginLeft: 8 }} />
                </>
              )}
            </TouchableOpacity>
          </View>

          {/* Footer */}
          <View style={styles.footer}>
            <View style={styles.footerDividerRow}>
              <View style={styles.footerLine} />
              <Text style={styles.footerCenter}>AUTHORIZED PERSONNEL ONLY</Text>
              <View style={styles.footerLine} />
            </View>
            <Text style={styles.versionText}>v1.0.4 · Nizron Tech ERP</Text>
          </View>
        </ScrollView>
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#001529',
  },
  bgLayer: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#001529',
    // simulate gradient: dark navy to deep blue
    // React Native doesn't support CSS linear-gradient natively without expo-linear-gradient
    // We use a solid dark navy which is consistent with enterprise design
  },
  safe: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  scroll: {
    flexGrow: 1,
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 48,
    paddingBottom: 32,
  },

  // Brand Section
  brandSection: {
    alignItems: 'center',
    marginBottom: 32,
  },
  logoBox: {
    width: 72,
    height: 72,
    borderRadius: 16,
    backgroundColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
  },
  logoImg: {
    width: '100%',
    height: '100%',
  },
  brandName: {
    fontSize: 18,
    fontWeight: '800',
    color: '#ffffff',
    letterSpacing: 2,
  },
  brandTagline: {
    fontSize: 12,
    color: '#94a3b8',
    marginTop: 4,
    fontWeight: '500',
    letterSpacing: 0.5,
  },

  // Card
  card: {
    width: '100%',
    maxWidth: 340,
    backgroundColor: '#ffffff',
    borderRadius: 6,
    padding: 28,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },

  // Tab Switcher
  tabRow: {
    flexDirection: 'row',
    backgroundColor: '#f1f5f9',
    borderRadius: 6,
    padding: 3,
    marginBottom: 24,
  },
  tabPill: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: 4,
  },
  tabPillActive: {
    backgroundColor: '#1677ff',
  },
  tabPillClientActive: {
    backgroundColor: '#1677ff',
  },
  tabPillText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#94a3b8',
  },
  tabPillTextActive: {
    color: '#ffffff',
  },

  // Card text
  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: 4,
  },
  cardSub: {
    fontSize: 13,
    color: '#94a3b8',
    marginBottom: 24,
    lineHeight: 18,
  },

  // Fields
  fieldGroup: {
    marginBottom: 16,
  },
  fieldLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#475569',
    marginBottom: 6,
    letterSpacing: 0.8,
  },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    height: 44,
    paddingHorizontal: 12,
  },
  inputIcon: {
    marginRight: 8,
  },
  textInput: {
    flex: 1,
    fontSize: 14,
    color: '#1e293b',
    fontWeight: '500',
    paddingVertical: 0,
  },
  eyeBtn: {
    padding: 4,
  },

  // Login Button
  loginBtn: {
    height: 44,
    backgroundColor: '#1677ff',
    borderRadius: 6,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
  },
  loginBtnDisabled: {
    opacity: 0.65,
  },
  loginBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#ffffff',
    letterSpacing: 1,
  },

  // Footer
  footer: {
    alignItems: 'center',
    marginTop: 32,
    width: '100%',
  },
  footerDividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    marginBottom: 10,
  },
  footerLine: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  footerCenter: {
    fontSize: 10,
    color: '#475569',
    fontWeight: '700',
    letterSpacing: 1,
    marginHorizontal: 12,
  },
  versionText: {
    fontSize: 11,
    color: '#334155',
    fontWeight: '500',
  },
});
