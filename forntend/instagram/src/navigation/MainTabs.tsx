import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { HomeStack } from '../navigation/HomeStack';
import { UserSearchScreen } from '../screens/user/UserSearchScreen';
import { ProfileStack } from '../screens/profile/ProfileStack';
import { useAppTheme } from '../theme/ThemeContext';
import Icon from 'react-native-vector-icons/Ionicons';

const Tab = createBottomTabNavigator();

export const MainTabs = () => {
  const { theme } = useAppTheme();
  return (
    <Tab.Navigator
      initialRouteName="Home"
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: {
          backgroundColor: theme.colors.tabBarBackground,
          borderTopColor: theme.colors.border,
          elevation: 0,
        },
        tabBarIcon: ({ color, focused }) => {
          let iconName = 'home-outline';
          if (route.name === 'Home') iconName = focused ? 'home' : 'home-outline';
          else if (route.name === 'Explore') iconName = focused ? 'search' : 'search-outline';
          else if (route.name === 'Profile') iconName = focused ? 'person' : 'person-outline';
          return <Icon name={iconName} size={24} color={color} />;
        },
      })}
    >
      <Tab.Screen
        name="Home"
        component={HomeStack}
        options={{ tabBarLabel: 'Home' }}
      />
      <Tab.Screen
        name="Explore"
        component={UserSearchScreen}
        options={{ tabBarLabel: 'Search' }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileStack} // << DON'T use MyProfileScreen here!
        options={{ tabBarLabel: 'Profile' }}
      />
 
    </Tab.Navigator>
  );
};
