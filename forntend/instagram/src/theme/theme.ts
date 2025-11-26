import { ColorSchemeName } from 'react-native';

export type ThemeMode = 'light' | 'dark';

export interface AppTheme {
  mode: ThemeMode;
  colors: {
    background: string;
    card: string;
    border: string;
    primary: string;
    text: string;
    textSecondary: string;
    inputBackground: string;
    inputBorder: string;
    placeholder: string;
    error: string;
    tabBarBackground: string;
    tabBarActive: string;
    tabBarInactive: string;
    avatarBackground: string;
    buttonText: string;
  };
}

export const getTheme = (scheme: ColorSchemeName): AppTheme => {
  const isDark = scheme === 'dark';

  if (isDark) {
    return {
      mode: 'dark',
      colors: {
        background: '#000000',
        card: '#000000',
        border: '#262626',
        primary: '#3797F0',
        text: '#FFFFFF',
        textSecondary: '#A8A8A8',
        inputBackground: '#121212',
        inputBorder: '#2C2C2C',
        placeholder: '#7F7F7F',
        error: '#F87171',
        tabBarBackground: '#000000',
        tabBarActive: '#FFFFFF',
        tabBarInactive: '#A8A8A8',
        avatarBackground: '#3797F0',
        buttonText: '#FFFFFF',
      },
    };
  }

  return {
    mode: 'light',
    colors: {
      background: '#FFFFFF',
      card: '#FFFFFF',
      border: '#DBDBDB',
      primary: '#3797F0',
      text: '#262626',
      textSecondary: '#8E8E8E',
      inputBackground: '#FAFAFA',
      inputBorder: '#DBDBDB',
      placeholder: '#8E8E8E',
      error: '#EF4444',
      tabBarBackground: '#FFFFFF',
      tabBarActive: '#262626',
      tabBarInactive: '#8E8E8E',
      avatarBackground: '#3797F0',
      buttonText: '#FFFFFF',
    },
  };
};
