//  D:\Projects\InstagramApp\Codes\forntend\instagram\src\screens\settings\AccountPrivacyScreen.tsx
import React from 'react';
import { View, Text, Switch, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { useGetMeQuery, useUpdatePrivacyMutation } from '../../store/api/services';
import { useAppTheme } from '../../theme/ThemeContext';

export const AccountPrivacyScreen = () => {
  const { theme } = useAppTheme();
  const { data: user, isLoading } = useGetMeQuery();
  const [updatePrivacy, { isLoading: updating }] = useUpdatePrivacyMutation();
  const isPrivate = !!user?.profile?.is_private;

  const onToggle = async () => {
    try {
      await updatePrivacy({ is_private: !isPrivate }).unwrap();
      Alert.alert('Privacy Updated', `Your account is now ${!isPrivate ? 'Private' : 'Public'}`);
    } catch (e) {
      Alert.alert('Error', 'Failed to update privacy setting.');
    }
  };

  if (isLoading)
    return <ActivityIndicator size="large" color={theme.colors.primary} style={{ flex: 1 }} />;

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Text style={[styles.title, { color: theme.colors.text }]}>Account Privacy</Text>
      <View style={styles.row}>
        <Text style={[
          styles.status,
          isPrivate
            ? {
                color: '#388e3c', // light green text
                backgroundColor: '#e8f5e9', // light green background
                borderColor: '#c8e6c9'
              }
            : {
                color: '#1976d2', // light blue text
                backgroundColor: '#e3f2fd', // very light blue background
                borderColor: '#90caf9'
              }
        ]}>
          {isPrivate ? 'Private' : 'Public'}
        </Text>
        <Switch
          style={styles.switch}
          value={isPrivate}
          onValueChange={onToggle}
          disabled={updating}
          thumbColor={isPrivate ? '#388e3c' : '#1976d2'}
          trackColor={{ false: '#bbb', true: '#c8e6c9' }}
        />
      </View>
      <Text style={[styles.caption, { color: theme.colors.textSecondary }]}>
        {isPrivate
          ? 'Only people you approve can follow you and see your posts and stories.'
          : 'Anyone on Instagram can follow you and see your public content instantly.'}
      </Text>
      <View style={styles.infoCard}>
        <Text style={styles.infoTitle}>How does privacy help you?</Text>
        <Text style={styles.infoText}>
          - A private account ensures your data, posts, and stories are only visible to people you accept.
        </Text>
        <Text style={styles.infoText}>
          - If you switch to public, anyone can follow you and view your content without approval.
        </Text>
        <Text style={styles.infoText}>
          - This setting does not affect your ability to find or follow others.
        </Text>
        <Text style={styles.infoText}>
          - You can change this anytime. Your current data, followers, and posts remain safe.
        </Text>
        <Text style={styles.infoText}>
          - Privacy gives you control over your social experience!
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24 },
  title: { fontSize: 22, fontWeight: 'bold', marginBottom: 30, textAlign: 'center' },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 22,
    justifyContent: 'center',
  },
  status: {
    fontSize: 18,
    fontWeight: '500',
    marginRight: 18,
    paddingVertical: 6,
    paddingHorizontal: 18,
    borderRadius: 13,
    borderWidth: 1,
    textAlign: 'center',
    minWidth: 84,
    elevation: 1,
  },
  switch: { transform: [{ scaleX: 1.18 }, { scaleY: 1.18 }] },
  caption: { marginTop: 12, fontSize: 15, textAlign: 'center' },
  infoCard: {
    marginTop: 32,
    padding: 16,
    backgroundColor: '#f2f2f7',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#eee',
  },
  infoTitle: {
    fontWeight: 'bold',
    fontSize: 16,
    marginBottom: 8,
    color: '#333',
  },
  infoText: {
    fontSize: 13.6,
    marginBottom: 4,
    color: '#555'
  },
});
