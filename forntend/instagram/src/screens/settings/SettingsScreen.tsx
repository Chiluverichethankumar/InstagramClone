import React from 'react';
import { View, Text, TouchableOpacity, Alert, StyleSheet, Switch } from 'react-native';
import { useAuth } from '../../hooks/useAuth';
import { useAppTheme } from '../../theme/ThemeContext';
import { useNavigation } from '@react-navigation/native';

export const SettingsScreen = () => {
  const { handleLogout } = useAuth();
  const navigation = useNavigation();
  const { theme, mode, setMode } = useAppTheme();

  const onLogout = async () => {
    Alert.alert('Confirm Logout', 'Are you sure you want to log out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Logout', style: 'destructive', onPress: async () => await handleLogout() },
    ]);
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Text style={[styles.title, { color: theme.colors.text }]}>Settings</Text>

      {/* Dark/Light mode toggle */}
      <View style={styles.row}>
        <Text style={[styles.label, { color: theme.colors.text }]}>
          {mode === 'dark' ? 'Dark Mode' : 'Light Mode'}
        </Text>
        <Switch
          value={mode === 'dark'}
          onValueChange={value => setMode(value ? 'dark' : 'light')}
          thumbColor={theme.colors.primary}
        />
      </View>

      <TouchableOpacity
        style={styles.settingRow}
        onPress={() => navigation.navigate('AccountPrivacy')}
      >
        <Text style={[styles.settingLabel, { color: theme.colors.text }]}>Account Privacy</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.button, { backgroundColor: theme.colors.error }]}
        onPress={onLogout}
        testID="settings-logout-button"
      >
        <Text style={styles.buttonText}>Log Out</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'stretch', // use 'stretch' for full-width rows
    padding: 24,
    backgroundColor: '#fff'
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 32,
    textAlign: 'center'
  },
  button: {
    marginTop: 40,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
    justifyContent: 'space-between',
    paddingHorizontal: 4
  },
  label: {
    fontSize: 18,
    marginRight: 16,
  },
  settingRow: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderColor: '#eee',
    paddingHorizontal: 4,
    marginBottom: 8
  },
  settingLabel: { fontSize: 16, fontWeight: '500' },
});
