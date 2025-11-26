import React from 'react';
import { View, Text, StyleSheet, Image, ScrollView } from 'react-native';
import { useRoute } from '@react-navigation/native';
import { useGetUserProfileByUsernameQuery } from '../../store/api/services';
import { Loading } from '../../components/common/Loading';
import { useAppTheme } from '../../theme/ThemeContext';

export const UserProfileScreen = () => {
  const { theme } = useAppTheme();
  const route = useRoute();
  const username = route.params?.username;

  const { data: profile, isLoading, isError, error } = useGetUserProfileByUsernameQuery(username, { skip: !username });

  if (!username) {
    return (
      <View style={{ flex: 1, backgroundColor: theme.colors.background, justifyContent: 'center', alignItems: 'center' }}>
        <Text style={{ color: theme.colors.error }}>No username provided!</Text>
      </View>
    );
  }

  if (isLoading) return <Loading />;

  // 404/Not found
  if (
    isError ||
    !profile ||
    (error?.status === 404 ||
      (error?.data && /No UserProfile/i.test(JSON.stringify(error.data))))
  ) {
    return (
      <View style={styles.container}>
        <Text style={[styles.errorText, { color: theme.colors.error }]}>No data for this user</Text>
      </View>
    );
  }

  // Defensive: get display username
  const displayUsername =
    profile.user?.username ||
    profile.username ||
    username ||
    '';

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={[styles.header, { borderBottomColor: theme.colors.border }]}>
        <View style={styles.headerRow}>
          {profile.profile_pic ? (
            <Image source={{ uri: profile.profile_pic }} style={styles.avatar} />
          ) : (
            <View style={[styles.avatarPlaceholder, { backgroundColor: theme.colors.avatarBackground }]}>
              <Text style={styles.avatarText}>
                {displayUsername.charAt(0).toUpperCase() || '?'}
              </Text>
            </View>
          )}
        </View>
        <Text style={[styles.username, { color: theme.colors.text }]}>@{displayUsername}</Text>
        {profile.full_name ? (
          <Text style={[styles.fullName, { color: theme.colors.textSecondary }]}>{profile.full_name}</Text>
        ) : null}
        {profile.bio ? (
          <Text style={[styles.bio, { color: theme.colors.text }]}>{profile.bio}</Text>
        ) : null}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { padding: 16, borderBottomWidth: 1 },
  headerRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  avatar: { width: 80, height: 80, borderRadius: 40 },
  avatarPlaceholder: { width: 80, height: 80, borderRadius: 40, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: 32, color: '#FFFFFF', fontWeight: 'bold' },
  username: { fontSize: 18, fontWeight: 'bold', marginBottom: 4 },
  fullName: { fontSize: 16, marginBottom: 4 },
  bio: { fontSize: 14, lineHeight: 20, marginTop: 4 },
  errorText: { fontSize: 16, textAlign: 'center', marginTop: 24 },
});
