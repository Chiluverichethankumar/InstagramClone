import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { MainTabs } from './MainTabs';
import { UserProfileScreen } from '../screens/profile/UserProfileScreen';
import { FollowListModal } from '../screens/user/FollowListModal'; // <-- ADD THIS LINE

const RootStack = createNativeStackNavigator();

export const AppNavigator = () => (
  <RootStack.Navigator screenOptions={{ headerShown: false }}>
    <RootStack.Screen name="MainTabs" component={MainTabs} />
    <RootStack.Screen name="UserProfile" component={UserProfileScreen} />
    {/* Register the modal here so EVERYWHERE in the app can open it */}
    <RootStack.Screen
      name="FollowListModal"
      component={FollowListModal}
      options={{ presentation: 'modal', headerShown: true, title: 'Followers / Following' }}
    />
  </RootStack.Navigator>
);
