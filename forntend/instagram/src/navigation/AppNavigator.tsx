import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { MainTabs } from './MainTabs';
import { UserProfileScreen } from '../screens/profile/UserProfileScreen';

const RootStack = createNativeStackNavigator();

export const AppNavigator = () => (
  <RootStack.Navigator screenOptions={{ headerShown: false }}>
    <RootStack.Screen name="MainTabs" component={MainTabs} />
    <RootStack.Screen name="UserProfile" component={UserProfileScreen} />
  </RootStack.Navigator>
);
