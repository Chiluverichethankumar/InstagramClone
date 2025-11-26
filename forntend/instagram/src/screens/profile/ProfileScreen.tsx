import React from 'react';
import { View, Text, StyleSheet, Image, ScrollView, TouchableOpacity } from 'react-native';
import { useRoute } from '@react-navigation/native';
import {
  useGetUserQuery,
  useGetMeQuery,
  useFollowUserMutation,
  useUnfollowUserMutation,
  useSendFriendRequestMutation,
} from '../../store/api/services';
import { Loading } from '../../components/common/Loading';
import { useAppTheme } from '../../theme/ThemeContext';

export const ProfileScreen = () => {
  const { theme } = useAppTheme();
  const route = useRoute();

  // Defensive: ensure param is an integer
  const rawUserId = route.params?.userId;
  const userId = typeof rawUserId === 'number' ? rawUserId : (rawUserId ? Number(rawUserId) : undefined);
  const isSelf = !userId;
  const { data: user, isLoading, isError } = isSelf ? useGetMeQuery() : useGetUserQuery(userId);

  const [followUser, { isLoading: followLoading }] = useFollowUserMutation();
  const [unfollowUser, { isLoading: unfollowLoading }] = useUnfollowUserMutation();
  const [sendFriendRequest, { isLoading: requestLoading }] = useSendFriendRequestMutation();

  const [followState, setFollowState] = React.useState(isSelf ? 'self' : 'not-following');

  React.useEffect(() => {
    if (isSelf) setFollowState('self');
    // TODO: Update followState using your real backend relationship flags (user.following_you etc)
  }, [userId, user]);

  if (!isSelf && (typeof userId !== 'number' || Number.isNaN(userId))) {
    return (
      <View style={{ flex: 1, backgroundColor: theme.colors.background, justifyContent: 'center', alignItems: 'center' }}>
        <Text style={{ color: theme.colors.error }}>Invalid user navigation parameter!</Text>
      </View>
    );
  }

  if (isLoading) return <Loading />;
  if (isError || !user)
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <View style={styles.errorContainer}>
          <Text style={[styles.errorText, { color: theme.colors.error }]}>{isSelf ? "Failed to load your profile" : "Failed to load user profile"}</Text>
        </View>
      </View>
    );

  let followButton = null;
  if (followState === 'self') {
    followButton = (
      <TouchableOpacity style={[styles.editButton, { borderColor: theme.colors.border }]}>
        <Text style={[styles.editButtonText, { color: theme.colors.text }]}>Edit Profile</Text>
      </TouchableOpacity>
    );
  } else if (followState === 'following') {
    followButton = (
      <TouchableOpacity
        style={[styles.unfollowButton, { borderColor: theme.colors.error }]}
        onPress={async () => {
          await unfollowUser(user.id);
          setFollowState('not-following');
        }}
        disabled={unfollowLoading}
      >
        <Text style={[styles.editButtonText, { color: theme.colors.error }]}>Unfollow</Text>
      </TouchableOpacity>
    );
  } else if (followState === 'pending') {
    followButton = (
      <View style={styles.pendingButton}>
        <Text style={[styles.editButtonText, { color: theme.colors.textSecondary }]}>Requested</Text>
      </View>
    );
  } else {
    followButton = (
      <TouchableOpacity
        style={[styles.followButton, { borderColor: theme.colors.primary }]}
        onPress={async () => {
          if (user.profile?.is_private) {
            await sendFriendRequest(user.id);
            setFollowState('pending');
          } else {
            await followUser(user.id);
            setFollowState('following');
          }
        }}
        disabled={followLoading || requestLoading}
      >
        <Text style={[styles.editButtonText, { color: theme.colors.primary }]}>
          {user.profile?.is_private ? 'Request' : 'Follow'}
        </Text>
      </TouchableOpacity>
    );
  }

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={[styles.header, { borderBottomColor: theme.colors.border }]}>
        <View style={styles.headerRow}>
          <View style={styles.avatarContainer}>
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
          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <Text style={[styles.statNumber, { color: theme.colors.text }]}>0</Text>
              <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>Posts</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={[styles.statNumber, { color: theme.colors.text }]}>0</Text>
              <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>Followers</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={[styles.statNumber, { color: theme.colors.text }]}>0</Text>
              <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>Following</Text>
            </View>
          </View>
        </View>
        <View style={styles.profileInfo}>
          <Text style={[styles.username, { color: theme.colors.text }]}>@{user.username}</Text>
          <Text style={[styles.fullName, { color: theme.colors.textSecondary }]}>{user.profile?.full_name || 'No name set'}</Text>
          <Text style={[styles.email, { color: theme.colors.textSecondary }]}>{user.email}</Text>
          {user.profile?.bio && <Text style={[styles.bio, { color: theme.colors.text }]}>{user.profile.bio}</Text>}
        </View>
        {followButton}
      </View>
      <View style={styles.postsContainer}>
        <Text style={[styles.noPostsText, { color: theme.colors.textSecondary }]}>No posts yet</Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { padding: 16, borderBottomWidth: 1 },
  headerRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  avatarContainer: { marginRight: 24 },
  avatar: { width: 80, height: 80, borderRadius: 40 },
  avatarPlaceholder: { width: 80, height: 80, borderRadius: 40, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: 32, color: '#FFFFFF', fontWeight: 'bold' },
  statsContainer: { flex: 1, flexDirection: 'row', justifyContent: 'space-around' },
  statItem: { alignItems: 'center' },
  statNumber: { fontSize: 18, fontWeight: 'bold' },
  statLabel: { fontSize: 14 },
  profileInfo: { marginBottom: 16 },
  username: { fontSize: 18, fontWeight: 'bold', marginBottom: 4 },
  fullName: { fontSize: 16, fontWeight: '600', marginBottom: 4 },
  email: { fontSize: 14, marginBottom: 8 },
  bio: { fontSize: 14, lineHeight: 20, marginTop: 4 },
  editButton: { borderWidth: 1, borderRadius: 6, paddingVertical: 8, alignItems: 'center', marginTop: 4 },
  editButtonText: { fontSize: 14, fontWeight: '600' },
  followButton: { borderWidth: 1, borderRadius: 6, padding: 8, alignItems: 'center', marginTop: 4 },
  unfollowButton: { borderWidth: 1, borderRadius: 6, padding: 8, alignItems: 'center', marginTop: 4 },
  pendingButton: { borderWidth: 1, borderRadius: 6, padding: 8, alignItems: 'center', marginTop: 4 },
  postsContainer: { padding: 24, alignItems: 'center' },
  noPostsText: { fontSize: 16 },
  errorContainer: { padding: 24 },
  errorText: { fontSize: 16, textAlign: 'center', marginTop: 24 },
});
