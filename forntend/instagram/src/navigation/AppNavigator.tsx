// src/navigation/AppNavigator.tsx — FIXED (only for modals, no tabs)
import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { MainTabs } from './MainTabs';  // Your MainTabs for tabs
import { FollowListModal } from '../screens/user/FollowListModal';  // Your modal
import { UserProfileScreen } from '../screens/profile/UserProfileScreen';  // Your profile
import { EditProfileScreen } from '../screens/profile/EditProfileScreen';  // Your edit
import { FollowersListScreen } from '../screens/profile/FollowersListScreen';  // Your followers

const RootStack = createNativeStackNavigator();

export const AppNavigator = () => (
  <RootStack.Navigator screenOptions={{ headerShown: false }}>
    <RootStack.Screen name="MainTabs" component={MainTabs} />  // Tabs
    <RootStack.Screen name="UserProfile" component={UserProfileScreen} />  // Profile
    <RootStack.Screen name="EditProfile" component={EditProfileScreen} />  // Edit
    <RootStack.Screen
      name="FollowersList"
      component={FollowersListScreen}
      options={{
        presentation: 'modal',
        headerShown: true,
        title: 'Followers / Following',
      }}
    />
    <RootStack.Screen
      name="FollowListModal"
      component={FollowListModal}
      options={{
        presentation: 'modal',
        headerShown: true,
        title: 'Followers / Following',
      }}
    />
  </RootStack.Navigator>
);