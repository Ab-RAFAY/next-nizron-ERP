
import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { CONFIG } from '../constants/config';
import { SplashOverlay } from '../components/SplashOverlay';

export default function LoginScreen() {
  const [fssNo, setFssNo] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showSplash, setShowSplash] = useState(false);
  const [isClient, setIsClient] = useState(false);
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
      style={styles.mainContainer}
    >
      <SplashOverlay
        visible={showSplash}
        onFinish={() => router.replace(isClient ? '/(client-tabs)' : '/(tabs)')}
      />
      <SafeAreaView style={{ flex: 1, backgroundColor: '#eff6ff' }} edges={['top', 'left', 'right']}>
        <View style={styles.backgroundGradient}>
          <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
            <View style={styles.headerSection}>
              <View style={styles.logoContainer}>
                <Image
                  source={require('../assets/images/images.png')}
                  style={styles.logoImage}
                  resizeMode="contain"
                />
              </View>
              <Text style={styles.welcomeTitle}>Nizron Tech ERP</Text>
              <Text style={styles.welcomeSubtitle}>{isClient ? 'Client Portal' : 'Employee Portal'}</Text>
            </View>

            <View style={styles.loginCard}>
              <View style={styles.tabContainer}>
                <TouchableOpacity
                  style={[styles.tab, !isClient && styles.activeTab]}
                  onPress={() => { setIsClient(false); setFssNo(''); }}
                >
                  <Text style={[styles.tabText, !isClient && styles.activeTabText]}>Employee</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.tab, isClient && styles.activeTab]}
                  onPress={() => { setIsClient(true); setFssNo(''); }}
                >
                  <Text style={[styles.tabText, isClient && styles.activeTabText]}>Client</Text>
                </TouchableOpacity>
              </View>

              <Text style={styles.cardTitle}>{isClient ? 'Client Sign In' : 'Sign In'}</Text>
              <Text style={styles.inputHint}>
                {isClient ? 'View your sites, guards and attendance data.' : 'Enter your credentials to manage your attendance and tasks.'}
              </Text>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>{isClient ? 'EMAIL ADDRESS' : 'FSS NUMBER / CNIC'}</Text>
                <TextInput
                  style={styles.input}
                  placeholder={isClient ? "email@example.com" : "000 or 1111-42347771-1"}
                  placeholderTextColor="#94a3b8"
                  value={fssNo}
                  onChangeText={handleIdentifierChange}
                  autoCapitalize="none"
                  keyboardType={isClient ? "email-address" : "numeric"}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>PASSWORD</Text>
                <TextInput
                  style={styles.input}
                  placeholder="••••••••"
                  placeholderTextColor="#94a3b8"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry
                />
              </View>

              <TouchableOpacity
                style={[styles.loginButton, loading && styles.buttonDisabled]}
                onPress={handleLogin}
                disabled={loading}
                activeOpacity={0.8}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.loginButtonText}>CONTINUE</Text>
                )}
              </TouchableOpacity>
            </View>

            <View style={styles.footerSection}>
              <Text style={styles.footerText}>Authorized Personnel Only</Text>
              <View style={styles.footerDivider} />
              <Text style={styles.versionText}>v1.0.4 Premium</Text>
            </View>
          </ScrollView>
        </View>
      </SafeAreaView>
    </KeyboardAvoidingView >
  );
}

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  backgroundGradient: {
    flex: 1,
    backgroundColor: '#eff6ff', // Light blue foundation
  },
  scrollContent: {
    flexGrow: 1,
    padding: 24,
    justifyContent: 'center',
  },
  headerSection: {
    alignItems: 'center',
    marginBottom: 40,
    marginTop: 40,
  },
  logoContainer: {
    width: 100,
    height: 100,
    backgroundColor: '#fff',
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
    overflow: 'hidden',
  },
  logoImage: {
    width: '100%',
    height: '100%',
  },
  logoText: {
    color: '#fff',
    fontSize: 24,
    fontWeight: '900',
    letterSpacing: 1,
  },
  welcomeTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#1e293b',
    letterSpacing: -0.5,
  },
  welcomeSubtitle: {
    fontSize: 16,
    color: '#64748b',
    marginTop: 4,
    fontWeight: '500',
  },
  loginCard: {
    backgroundColor: '#fff',
    borderRadius: 32,
    padding: 32,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.08,
    shadowRadius: 30,
    elevation: 4,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#f1f5f9',
    borderRadius: 12,
    padding: 4,
    marginBottom: 24,
  },
  tab: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 8,
  },
  activeTab: {
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748b',
  },
  activeTabText: {
    color: '#1e293b',
  },
  cardTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: 8,
  },
  inputHint: {
    fontSize: 14,
    color: '#94a3b8',
    marginBottom: 32,
    lineHeight: 20,
  },
  inputGroup: {
    marginBottom: 24,
  },
  label: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748b',
    marginBottom: 8,
    letterSpacing: 1,
  },
  input: {
    backgroundColor: '#f8fafc',
    borderRadius: 16,
    padding: 18,
    color: '#1e293b',
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    fontWeight: '500',
  },
  loginButton: {
    backgroundColor: '#1e293b',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    shadowColor: '#1e293b',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  loginButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 1,
  },
  forgotButton: {
    alignItems: 'center',
    marginTop: 24,
  },
  forgotText: {
    color: '#2563eb',
    fontSize: 14,
    fontWeight: '600',
  },
  footerSection: {
    alignItems: 'center',
    marginTop: 40,
    marginBottom: 20,
  },
  footerText: {
    fontSize: 13,
    color: '#94a3b8',
    fontWeight: '600',
  },
  footerDivider: {
    width: 40,
    height: 2,
    backgroundColor: '#e2e8f0',
    marginVertical: 12,
  },
  versionText: {
    fontSize: 11,
    color: '#cbd5e1',
    fontWeight: '700',
  },
});
