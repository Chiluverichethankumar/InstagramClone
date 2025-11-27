import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { StatusBar } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Provider } from 'react-redux';
import { store } from './src/store/store';
import { AuthStack } from './src/navigation/AuthStack';
import { AppNavigator } from './src/navigation/AppNavigator';
import { Loading } from './src/components/common/Loading';
import { ThemeProvider, useAppTheme } from './src/theme/ThemeContext';

const AppInner = () => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const { mode } = useAppTheme();

  useEffect(() => {
    const checkAuth = async () => {
      const sessionId = await AsyncStorage.getItem('session_id');
      setIsAuthenticated(!!sessionId);
    };
    checkAuth();
    const intervalId = setInterval(checkAuth, 1000);
    return () => clearInterval(intervalId);
  }, []);

  if (isAuthenticated === null) return <Loading />;

  return (
    <>
      <StatusBar barStyle={mode === 'dark' ? 'light-content' : 'dark-content'} />
      {/* Use default navigation theme to avoid ThemeProvider crash */}
      <NavigationContainer>
        {isAuthenticated ? <AppNavigator /> : <AuthStack />}
      </NavigationContainer>
    </>
  );
};

const App = () => (
  <Provider store={store}>
    <ThemeProvider>
      <AppInner />
    </ThemeProvider>
  </Provider>
);

export default App;
