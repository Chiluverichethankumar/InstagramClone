import React, { useEffect, useState } from 'react';
import { NavigationContainer, DefaultTheme, DarkTheme } from '@react-navigation/native';
import { StatusBar } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Provider } from 'react-redux';
import { store } from './src/store/store';
import { AuthStack } from './src/navigation/AuthStack';
import { MainTabs } from './src/navigation/MainTabs';
import { Loading } from './src/components/common/Loading';
import { ThemeProvider, useAppTheme } from './src/theme/ThemeContext';

const AppInner = () => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const { mode } = useAppTheme(); // Call hooks always at the top
  const navTheme = mode === 'dark' ? DarkTheme : DefaultTheme;

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
      <NavigationContainer theme={navTheme}>
        {isAuthenticated ? <MainTabs /> : <AuthStack />}
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
