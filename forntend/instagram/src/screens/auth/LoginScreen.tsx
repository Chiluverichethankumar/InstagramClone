// src/screens/auth/LoginScreen.tsx
import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Alert, ScrollView, StyleSheet } from 'react-native';
import { Input } from '../../components/common/Input';
import { Loading } from '../../components/common/Loading';
import { useAuth } from '../../hooks/useAuth';
import { useNavigation } from '@react-navigation/native';
import { useAppTheme } from '../../theme/ThemeContext';

export const LoginScreen = () => {
  const navigation = useNavigation<any>();
  const { handleLogin, isLoginLoading } = useAuth();
  const [form, setForm] = useState({ username: '', password: '' });
  const [error, setError] = useState<string | null>(null);
  const { theme } = useAppTheme(); // ← fixed: only need theme

  const onChange = (key: keyof typeof form, value: string) => {
    setForm(prev => ({ ...prev, [key]: value }));
  };

  const validate = () => {
    if (!form.username || !form.password) {
      Alert.alert('Both fields are required');
      return false;
    }
    return true;
  };

  const onSubmit = async () => {
    if (!validate()) return;
    setError(null);
    try {
      const result = await handleLogin({ username: form.username, password: form.password });
      if (!result.success && result.error) {
        setError(result.error);
      }
    } catch (e: any) {
      setError(e.message || 'Login failed');
    }
  };

  if (isLoginLoading) return <Loading />;

  return (
    <ScrollView
      contentContainerStyle={[styles.container, { backgroundColor: theme.colors.background }]}
      keyboardShouldPersistTaps="handled"
    >
      <View style={styles.logoContainer}>
        <Text style={[styles.logo, { color: theme.colors.text }]}>Instagram</Text>
      </View>

      {/* FIXED: error is now properly wrapped */}
      {error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      <View style={styles.formContainer}>
        <Input
          value={form.username}
          onChangeText={v => onChange('username', v)}
          placeholder="Username"
        />
        <Input
          value={form.password}
          onChangeText={v => onChange('password', v)}
          placeholder="Password"
          secureTextEntry
        />

        <TouchableOpacity
          style={[styles.button, { backgroundColor: theme.colors.primary }]}
          onPress={onSubmit}
        >
          <Text style={styles.buttonText}>Log In</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.forgotPassword}>
          <Text style={[styles.forgotPasswordText, { color: theme.colors.primary }]}>
            Forgot password?
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.divider}>
        <View style={[styles.dividerLine, { backgroundColor: theme.colors.border }]} />
        <Text style={[styles.dividerText, { color: theme.colors.textSecondary }]}>OR</Text>
        <View style={[styles.dividerLine, { backgroundColor: theme.colors.border }]} />
      </View>

      <View style={[styles.signupContainer, { borderTopColor: theme.colors.border }]}>
        <Text style={[styles.signupText, { color: theme.colors.text }]}>
          Don't have an account?{' '}
        </Text>
        <TouchableOpacity onPress={() => navigation.navigate('Signup')}>
          <Text style={[styles.signupLink, { color: theme.colors.primary }]}>Sign up</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flexGrow: 1, paddingHorizontal: 24, paddingVertical: 32, justifyContent: 'center' },
  logoContainer: { alignItems: 'center', marginBottom: 32 },
  logo: { fontSize: 48, fontWeight: 'bold', fontFamily: 'cursive' },
  errorContainer: { padding: 12, backgroundColor: '#ffebee', borderRadius: 8, marginBottom: 16 },
  errorText: { color: 'red', textAlign: 'center', fontSize: 14 },
  formContainer: { width: '100%' },
  button: { paddingVertical: 12, borderRadius: 8, marginTop: 16 },
  buttonText: { textAlign: 'center', fontWeight: '600', fontSize: 16, color: '#fff' },
  forgotPassword: { alignItems: 'center', marginTop: 16 },
  forgotPasswordText: { fontSize: 14 },
  divider: { flexDirection: 'row', alignItems: 'center', marginVertical: 24 },
  dividerLine: { flex: 1, height: 1 },
  dividerText: { marginHorizontal: 16, fontWeight: '600', fontSize: 14 },
  signupContainer: { flexDirection: 'row', justifyContent: 'center', paddingVertical: 20, borderTopWidth: 1 },
  signupText: { fontSize: 14 },
  signupLink: { fontWeight: '600', fontSize: 14 },
});