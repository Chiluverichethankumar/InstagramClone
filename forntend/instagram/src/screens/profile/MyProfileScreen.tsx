import React from 'react';
import { View, Text, StyleSheet, Image, ScrollView } from 'react-native';
import { useGetMeQuery } from '../../store/api/services';
import { Loading } from '../../components/common/Loading';
import { useAppTheme } from '../../theme/ThemeContext';

export const MyProfileScreen = () => {
  const { theme } = useAppTheme();
  const { data: user, isLoading, isError } = useGetMeQuery();

  if (isLoading) return <Loading />;
  if (isError || !user) {
    return (
      <View style={styles.container}>
        <Text style={[styles.errorText, { color: theme.colors.error }]}>Failed to load your profile</Text>
      </View>
    );
  }

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={[styles.header, { borderBottomColor: theme.colors.border }]}>
        <View style={styles.headerRow}>
          {user.profile?.profile_pic ? (
            <Image source={{ uri: user.profile.profile_pic }} style={styles.avatar} />
          ) : (
            <View style={[styles.avatarPlaceholder, { backgroundColor: theme.colors.avatarBackground }]}>
              <Text style={styles.avatarText}>
                {user.username?.charAt(0).toUpperCase() || '?'}
              </Text>
            </View>
          )}
        </View>
        <Text style={[styles.username, { color: theme.colors.text }]}>@{user.username}</Text>
        <Text style={[styles.fullName, { color: theme.colors.textSecondary }]}>{user.profile?.full_name || ''}</Text>
        {user.profile?.bio && (
          <Text style={[styles.bio, { color: theme.colors.text }]}>{user.profile.bio}</Text>
        )}
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
