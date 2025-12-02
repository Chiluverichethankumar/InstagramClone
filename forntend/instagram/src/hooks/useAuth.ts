// src/hooks/useAuth.ts
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  useSignupMutation,
  useLoginMutation,
  useLogoutMutation,
  api,
} from '../store/api/services';
import { AuthResponse, SignupPayload, LoginPayload } from '../types';

interface AuthResult {
  success: boolean;
  error?: string;
}

export const useAuth = () => {
  const [signup, { isLoading: isSignupLoading, error: signupError }] =
    useSignupMutation();
  const [login, { isLoading: isLoginLoading, error: loginError }] =
    useLoginMutation();
  const [logout, { isLoading: isLogoutLoading, error: logoutError }] =
    useLogoutMutation();

  const handleSignup = async (payload: SignupPayload): Promise<AuthResult> => {
    try {
      const result: AuthResponse = await signup(payload).unwrap();
      await AsyncStorage.setItem('session_id', result.session_id);
      return { success: true };
    } catch (e: any) {
      const errorMessage =
        e?.data?.error || e?.data?.message || e?.message || 'Signup failed';
      return { success: false, error: errorMessage };
    }
  };

  const handleLogin = async (payload: LoginPayload): Promise<AuthResult> => {
    try {
      const result: AuthResponse = await login(payload).unwrap();
      await AsyncStorage.setItem('session_id', result.session_id);
      console.log('SESSION FROM APP LOGIN:', result.session_id);
      return { success: true };
    } catch (e: any) {
      const errorMessage =
        e?.data?.error || e?.data?.message || e?.message || 'Login failed';
      return { success: false, error: errorMessage };
    }
  };

  const handleLogout = async (): Promise<void> => {
    try {
      await logout().unwrap();
    } catch (_e) {
      // ignore
    }
    await AsyncStorage.removeItem('session_id');
    api.util.resetApiState();
  };

  return {
    handleSignup,
    handleLogin,
    handleLogout,
    isSignupLoading,
    signupError,
    isLoginLoading,
    loginError,
    isLogoutLoading,
    logoutError,
  };
};
