import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SignupScreen } from '../screens/auth/SignupScreen';
import { LoginScreen } from '../screens/auth/LoginScreen';

export type AuthStackParamList = {
  Signup: undefined;
  Login: undefined;
};

const AuthStackNavigator = createNativeStackNavigator<AuthStackParamList>();

export const AuthStack = () => (
  <AuthStackNavigator.Navigator initialRouteName="Login" screenOptions={{ headerShown: false }}>
    <AuthStackNavigator.Screen name="Login" component={LoginScreen} />
    <AuthStackNavigator.Screen name="Signup" component={SignupScreen} />
  </AuthStackNavigator.Navigator>
);
