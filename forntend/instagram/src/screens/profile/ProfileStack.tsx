import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { MyProfileScreen } from './MyProfileScreen';
import { SettingsScreen } from '../settings/SettingsScreen';
import { AccountPrivacyScreen } from '../settings/AccountPrivacyScreen';
import { FollowListModal } from '../user/FollowListModal';
import { UserProfileScreen } from './UserProfileScreen';

const Stack = createNativeStackNavigator();

export const ProfileStack = () => (
  <Stack.Navigator>
    <Stack.Screen name="MyProfile" component={MyProfileScreen} options={{ headerShown: false }} />
    <Stack.Screen name="Settings" component={SettingsScreen} />
    <Stack.Screen name="AccountPrivacy" component={AccountPrivacyScreen} />
    <Stack.Screen name="FollowListModal" component={FollowListModal} options={{ presentation: 'modal', title: 'Followers / Following' }} />
    <Stack.Screen name="UserProfile" component={UserProfileScreen} />
  </Stack.Navigator>
);
