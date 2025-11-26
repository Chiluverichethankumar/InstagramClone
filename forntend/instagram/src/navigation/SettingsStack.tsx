import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SettingsScreen } from '../screens/settings/SettingsScreen';
import { AccountPrivacyScreen } from '../screens/settings/AccountPrivacyScreen';

const Stack = createNativeStackNavigator();

export const SettingsStack = () => (
  <Stack.Navigator>
    <Stack.Screen name="Settings" component={SettingsScreen} options={{ headerShown: false }} />
    <Stack.Screen name="AccountPrivacy" component={AccountPrivacyScreen} options={{ title: 'Account Privacy' }} />
  </Stack.Navigator>
);
