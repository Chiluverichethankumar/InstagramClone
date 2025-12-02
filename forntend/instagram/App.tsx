// App.tsx — FINAL 100% WORKING VERSION
import React, { useEffect, useState, useCallback } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { StatusBar } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Provider } from 'react-redux';
import { store } from './src/store/store';
import { AuthStack } from './src/navigation/AuthStack';   // ← FIXED: removed the word "diplomat"
import { MainTabs } from './src/navigation/MainTabs';
import { Loading } from './src/components/common/Loading';
import { AppThemeProvider, useAppTheme } from './src/theme/ThemeContext';

const AppWithTheme = () => {
  const { mode } = useAppTheme();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  const checkAuth = useCallback(async () => {
    const sessionId = await AsyncStorage.getItem('session_id');
    setIsAuthenticated(!!sessionId);
  }, []);

  useEffect(() => {
    checkAuth();
    const interval = setInterval(checkAuth, 500);
    return () => clearInterval(interval);
  }, [checkAuth]);

  if (isAuthenticated === null) return <Loading />;

  return (
    <>
      <StatusBar barStyle={mode === 'dark' ? 'light-content' : 'dark-content'} />
      <NavigationContainer>
        {isAuthenticated ? <MainTabs /> : <AuthStack />}
      </NavigationContainer>
    </>
  );
};

const App = () => (
  <Provider store={store}>
    <AppThemeProvider>
      <AppWithTheme />
    </AppThemeProvider>
  </Provider>
);

export default App;