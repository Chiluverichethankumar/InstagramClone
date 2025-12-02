// src/navigation/MainTabs.tsx — FINAL CORRECT VERSION
import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { HomeStack } from './HomeStack';
import { ProfileStack } from '../screens/profile/ProfileStack'; // ← CORRECT PATH
import Icon from 'react-native-vector-icons/Ionicons';
import { useAppTheme } from '../theme/ThemeContext';
import { UserSearchScreen } from '../screens/user/UserSearchScreen';

const Tab = createBottomTabNavigator();

export const MainTabs = () => {
  const { theme } = useAppTheme();

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: theme.colors.tabBarBackground,
          borderTopWidth: 1,
          borderTopColor: theme.colors.border,
        },
        tabBarActiveTintColor: theme.colors.tabBarActive,
        tabBarInactiveTintColor: theme.colors.tabBarInactive,
      }}
    >
      <Tab.Screen
        name="HomeTab"
        component={HomeStack}
        options={{
          tabBarLabel: () => null,
          tabBarIcon: ({ color }) => <Icon name="home-outline" size={28} color={color} />,
        }}
      />

      <Tab.Screen
        name="SearchTab"
        component={UserSearchScreen}
        options={{
          tabBarLabel: () => null,
          tabBarIcon: ({ color }) => <Icon name="search-outline" size={28} color={color} />,
        }}
      />

      {/* THIS IS THE KEY — MUST BE "ProfileTab" */}
      <Tab.Screen
        name="ProfileTab"
        component={ProfileStack}
        options={{
          tabBarLabel: () => null,
          tabBarIcon: ({ color }) => <Icon name="person-outline" size={28} color={color} />,
        }}
      />
    </Tab.Navigator>
  );
};