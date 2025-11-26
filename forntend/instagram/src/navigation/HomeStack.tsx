import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { HomeScreen } from '../screens/home/HomeScreen';
import { UserSearchScreen } from '../screens/user/UserSearchScreen';
import { TouchableOpacity, Text } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useAppTheme } from '../theme/ThemeContext';

const Stack = createNativeStackNavigator();

export const HomeStack = () => {
  const { theme } = useAppTheme(); // Correct way; always destructure!

  return (
    <Stack.Navigator>
      <Stack.Screen
        name="Home"
        component={HomeScreen}
        options={({ navigation }) => ({
          headerTitle: () => (
            <Text style={{
              fontFamily: 'Billabong',
              fontSize: 30,
              color: theme.colors.text,
            }}>
              Instagram
            </Text>
          ),
          headerRight: () => (
            <TouchableOpacity onPress={() => navigation.navigate('UserSearch')} style={{ marginRight: 16 }}>
              <Icon name="search" size={28} color={theme.colors.primary} />
            </TouchableOpacity>
          ),
        })}
      />
      <Stack.Screen
        name="UserSearch"
        component={UserSearchScreen}
        options={{
          headerTitle: '',
          headerRight: () => (
            <Icon name="search" size={28} color={theme.colors.primary} style={{ marginRight: 16 }} />
          ),
        }}
      />
    </Stack.Navigator>
  );
};
