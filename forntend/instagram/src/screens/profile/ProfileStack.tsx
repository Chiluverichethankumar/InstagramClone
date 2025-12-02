// D:\Projects\InstagramApp\Codes\forntend\instagram\src\screens\profile\ProfileStack.tsx
import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { MyProfileScreen } from './MyProfileScreen';
import { UserProfileScreen } from './UserProfileScreen';
import { EditProfileScreen } from './EditProfileScreen';
import { SettingsScreen } from '../settings/SettingsScreen';
import { AccountPrivacyScreen } from '../settings/AccountPrivacyScreen';

const Stack = createNativeStackNavigator();

export const ProfileStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="MyProfile" component={MyProfileScreen} />
    <Stack.Screen 
      name="UserProfile" 
      component={UserProfileScreen}
      initialParams={{ username: 'user' }}
    />
    <Stack.Screen 
      name="EditProfile" 
      component={EditProfileScreen}
      options={{ headerShown: true, title: 'Edit Profile' }}
    />
    <Stack.Screen name="Settings" component={SettingsScreen} />
    <Stack.Screen 
      name="AccountPrivacy" 
      component={AccountPrivacyScreen}
      options={{ title: 'Account Privacy' }}
    />
  </Stack.Navigator>
);
