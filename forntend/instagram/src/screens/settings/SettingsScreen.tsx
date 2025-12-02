// src/screens/settings/SettingsScreen.tsx
import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Switch,
  Alert,
  ScrollView,
  SafeAreaView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../../hooks/useAuth';
import { useAppTheme } from '../../theme/ThemeContext';

export const SettingsScreen = () => {
  const navigation = useNavigation<any>();
  const { handleLogout } = useAuth();
  const { theme, mode, setMode } = useAppTheme();

  const logout = () => {
    Alert.alert('Log Out', 'Are you sure you want to log out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Log Out', style: 'destructive', onPress: handleLogout },
    ]);
  };

  const Row = ({ title, onPress }: { title: string; onPress?: () => void }) => (
    <TouchableOpacity style={styles.row} onPress={onPress} disabled={!onPress}>
      <Text style={styles.rowText}>{title}</Text>
      <Text style={styles.arrow}>›</Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <ScrollView contentContainerStyle={{ paddingBottom: 50 }}>
        <Text style={styles.header}>Settings</Text>

        {/* Appearance */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>APPEARANCE</Text>
          <View style={styles.row}>
            <Text style={styles.rowText}>{mode === 'dark' ? 'Dark Mode' : 'Light Mode'}</Text>
            <Switch
              value={mode === 'dark'}
              onValueChange={(v) => setMode(v ? 'dark' : 'light')}
              trackColor={{ true: '#3897f0', false: '#aaa' }}
            />
          </View>
        </View>

        {/* Your Account */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>YOUR ACCOUNT</Text>
          <Row title="Account Privacy" onPress={() => navigation.navigate('AccountPrivacy')} />
          <Row title="Close Friends" />
          <Row title="Favorites" />
          <Row title="Saved" />
          <Row title="Your Activity" />
        </View>

        {/* How You Use Instagram */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>HOW YOU USE INSTAGRAM</Text>
          <Row title="Notifications" />
          <Row title="Time Spent" />
          <Row title="Muted Accounts" />
          <Row title="Hidden Words" />
        </View>

        {/* Who Can See Your Content */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>WHO CAN SEE YOUR CONTENT</Text>
          <Row title="Blocked Accounts" />
          <Row title="Hide Story From" />
          <Row title="Comments" />
          <Row title="Tags and Mentions" />
          <Row title="Messages and Story Replies" />
        </View>

        {/* Your App and Media */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>YOUR APP AND MEDIA</Text>
          <Row title="Archiving and Downloading" />
          <Row title="Original Photos" />
          <Row title="Data Saver" />
          <Row title="Cellular Data Use" />
        </View>

        {/* For Professionals */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>FOR PROFESSIONALS</Text>
          <Row title="Switch to Professional Account" />
          <Row title="Branded Content" />
        </View>

        {/* More Info and Support */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>MORE INFO AND SUPPORT</Text>
          <Row title="Help" />
          <Row title="Report a Problem" />
          <Row title="About" />
        </View>

        {/* Log Out */}
        <TouchableOpacity style={styles.logoutButton} onPress={logout}>
          <Text style={styles.logoutText}>Log Out</Text>
        </TouchableOpacity>

        <Text style={styles.footer}>Meta</Text>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  header: { fontSize: 34, fontWeight: 'bold', paddingHorizontal: 20, marginTop: 20 },
  section: { marginTop: 20, backgroundColor: 'white', borderTopWidth: 0.5, borderBottomWidth: 0.5, borderColor: '#dbdbdb' },
  sectionTitle: { fontSize: 13, fontWeight: '600', color: '#8e8e93', paddingHorizontal: 16, paddingTop: 16, paddingBottom: 8 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 16, borderBottomWidth: StyleSheet.hairlineWidth, borderColor: '#dbdbdb' },
  rowText: { fontSize: 17 },
  arrow: { fontSize: 28, color: '#c7c7cc' },
  logoutButton: { marginTop: 60, paddingVertical: 16, backgroundColor: 'white', alignItems: 'center' },
  logoutText: { color: '#e74c3c', fontSize: 18, fontWeight: '600' },
  footer: { textAlign: 'center', marginTop: 40, color: '#8e8e93', fontSize: 13, fontWeight: '600' },
});