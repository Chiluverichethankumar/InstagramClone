// src/navigation/HomeStack.tsx — KEEP YOUR OLD CODE (remove duplicate modal)
import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { HomeScreen } from '../screens/home/HomeScreen';
import { UserProfileScreen } from '../screens/profile/UserProfileScreen';
import NotificationsTab from '../screens/notifications/NotificationsTab';
import { TouchableOpacity, View, Text } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useAppTheme } from '../theme/ThemeContext';

const Stack = createNativeStackNavigator();

export const HomeStack: React.FC = () => {
  const { theme } = useAppTheme();

  return (
    <Stack.Navigator>
      <Stack.Screen
        name="HomeFeed"
        component={HomeScreen}
        options={({ navigation }) => ({
          headerTitle: () => (
            <Text
              style={{
                fontFamily: 'Billabong',
                fontSize: 30,
                color: theme.colors.text,
              }}
            >
              Instagram
            </Text>
          ),
          headerRight: () => (
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <TouchableOpacity
                onPress={() => navigation.navigate('NotificationsTab')}
                style={{ marginRight: 20 }}
              >
                <Icon name="heart-outline" size={28} color={theme.colors.primary} />
              </TouchableOpacity>
            </View>
          ),
        })}
      />
      <Stack.Screen
        name="UserProfile"
        component={UserProfileScreen}
        options={{ headerTitle: '' }}
      />
      <Stack.Screen
        name="NotificationsTab"
        component={NotificationsTab}
        options={{ headerTitle: 'Requests' }}
      />
      {/* Remove FollowListModal — it's in AppNavigator now */}
    </Stack.Navigator>
  );
};