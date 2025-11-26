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
  const [signup, { isLoading: isSignupLoading, error: signupError }] = useSignupMutation();
  const [login, { isLoading: isLoginLoading, error: loginError }] = useLoginMutation();
  const [logout, { isLoading: isLogoutLoading, error: logoutError }] = useLogoutMutation();

  // Handle signup with error catching
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

  // Handle login with error catching
  const handleLogin = async (payload: LoginPayload): Promise<AuthResult> => {
    try {
      const result: AuthResponse = await login(payload).unwrap();
      await AsyncStorage.setItem('session_id', result.session_id);
      return { success: true };
    } catch (e: any) {
      const errorMessage =
        e?.data?.error || e?.data?.message || e?.message || 'Login failed';
      return { success: false, error: errorMessage };
    }
  };

  // Handle logout with error catching and API state reset
  const handleLogout = async (): Promise<void> => {
    try {
      await logout().unwrap();
    } catch (_e) {
      // Ignore server errors on logout
    }
    await AsyncStorage.removeItem('session_id');
    api.util.resetApiState(); // clears cached user data, triggers UI update
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
