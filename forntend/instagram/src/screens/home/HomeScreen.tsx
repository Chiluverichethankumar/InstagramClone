import React from 'react';
import { View, Text, StyleSheet, Image, ScrollView } from 'react-native';
import { useGetMeQuery } from '../../store/api/services';
import { Loading } from '../../components/common/Loading';
import { useAppTheme } from '../../theme/ThemeContext';

export const HomeScreen = () => {
  const { data: user, isLoading, error } = useGetMeQuery();
  const { theme } = useAppTheme();

  if (isLoading) return <Loading />;
  if (error || !user) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <Text style={[styles.errorText, { color: theme.colors.error }]}>Failed to load user data</Text>
      </View>
    );
  }

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={[styles.userCard, { borderBottomColor: theme.colors.border, backgroundColor: theme.colors.card }]}>
        <View style={styles.avatarContainer}>
          {user.profile?.profile_pic ? (
            <Image source={{ uri: user.profile.profile_pic }} style={styles.avatar} />
          ) : (
            <View style={[styles.avatarPlaceholder, { backgroundColor: theme.colors.avatarBackground }]}>
              <Text style={styles.avatarText}>{user.username?.charAt(0).toUpperCase() || '?'}</Text>
            </View>
          )}
        </View>
        <Text style={[styles.username, { color: theme.colors.text }]}>@{user.username}</Text>
        <Text style={[styles.fullName, { color: theme.colors.textSecondary }]}>{user.profile?.full_name || 'No name set'}</Text>
        <Text style={[styles.email, { color: theme.colors.textSecondary }]}>{user.email}</Text>
        {user.profile?.bio && <Text style={[styles.bio, { color: theme.colors.text }]}>{user.profile.bio}</Text>}
      </View>
      <View style={styles.feedContainer}>
        <Text style={[styles.feedTitle, { color: theme.colors.text }]}>Your Feed</Text>
        <Text style={[styles.feedSubtitle, { color: theme.colors.textSecondary }]}>
          Posts from people you follow will appear here
        </Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  userCard: { alignItems: 'center', padding: 24, borderBottomWidth: 1 },
  avatarContainer: { marginBottom: 16 },
  avatar: { width: 100, height: 100, borderRadius: 50 },
  avatarPlaceholder: { width: 100, height: 100, borderRadius: 50, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: 40, color: '#FFFFFF', fontWeight: 'bold' },
  username: { fontSize: 24, fontWeight: 'bold', marginBottom: 4 },
  fullName: { fontSize: 16, marginBottom: 4 },
  email: { fontSize: 14, marginBottom: 12 },
  bio: { fontSize: 14, textAlign: 'center', marginTop: 8 },
  feedContainer: { padding: 24, alignItems: 'center' },
  feedTitle: { fontSize: 20, fontWeight: '600', marginBottom: 8 },
  feedSubtitle: { fontSize: 14, textAlign: 'center' },
  errorText: { fontSize: 16, textAlign: 'center', marginTop: 24 },
});
