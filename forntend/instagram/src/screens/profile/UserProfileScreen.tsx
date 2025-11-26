import React from 'react';
import { View, Text, StyleSheet, Image, ScrollView, TouchableOpacity } from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import {
  useGetUserProfileByUsernameQuery,
  useGetFollowersQuery,
  useGetFollowingQuery,
  useFollowUserMutation,
  useUnfollowUserMutation,
  useSendFriendRequestMutation
} from '../../store/api/services';
import { Loading } from '../../components/common/Loading';
import { useAppTheme } from '../../theme/ThemeContext';

export const UserProfileScreen = () => {
  const { theme } = useAppTheme();
  const navigation = useNavigation();
  const route = useRoute();
  const username = route.params?.username;

  const { data: profile, isLoading, isError, error } = useGetUserProfileByUsernameQuery(username, { skip: !username });
  const userId = profile?.user?.id || profile?.id;

  // Followers/Following counts
  const { data: followers = [] } = useGetFollowersQuery(userId, { skip: !userId });
  const { data: following = [] } = useGetFollowingQuery(userId, { skip: !userId });

  // Follow/Unfollow/Request
  const [followUser, { isLoading: followLoading }] = useFollowUserMutation();
  const [unfollowUser, { isLoading: unfollowLoading }] = useUnfollowUserMutation();
  const [sendFriendRequest, { isLoading: requestLoading }] = useSendFriendRequestMutation();

  // For actual "Follow" state, you may want to get this from backend for authenticated user
  const [followState, setFollowState] = React.useState('not-following'); // logic to update this accordingly

  if (!username) return <Text>No username provided!</Text>;
  if (isLoading) return <Loading />;
  if (isError || !profile) return <View style={styles.container}><Text style={styles.errorText}>No data for this user</Text></View>;

  const displayUsername = profile.user?.username || profile.username || username || '';

  let followButton = null;
  if (followState === 'following') {
    followButton = (
      <TouchableOpacity
        onPress={async () => {
          await unfollowUser(userId);
          setFollowState('not-following');
        }}
        style={styles.unfollowButton}
        disabled={unfollowLoading}
      >
        <Text style={styles.unfollowText}>Unfollow</Text>
      </TouchableOpacity>
    );
  } else if (followState === 'pending') {
    followButton = (
      <View style={styles.pendingButton}>
        <Text style={styles.pendingText}>Requested</Text>
      </View>
    );
  } else {
    followButton = (
      <TouchableOpacity
        onPress={async () => {
          if (profile.is_private) {
            await sendFriendRequest(userId);
            setFollowState('pending');
          } else {
            await followUser(userId);
            setFollowState('following');
          }
        }}
        style={styles.followButton}
        disabled={followLoading || requestLoading}
      >
        <Text style={styles.followText}>{profile.is_private ? 'Request' : 'Follow'}</Text>
      </TouchableOpacity>
    );
  }

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={styles.header}>
        <View style={styles.headerRow}>
          {/* Avatar */}
          {profile.profile_pic ? (
            <Image source={{ uri: profile.profile_pic }} style={styles.avatar} />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Text style={styles.avatarText}>{displayUsername.charAt(0).toUpperCase()}</Text>
            </View>
          )}
          {/* Followers */}
          <TouchableOpacity
            onPress={() => navigation.navigate('FollowListModal', { userId, type: 'followers' })}
            style={styles.countBox}
          >
            <Text style={styles.countNum}>{followers.length}</Text>
            <Text style={styles.countLabel}>Followers</Text>
          </TouchableOpacity>
          {/* Following */}
          <TouchableOpacity
            onPress={() => navigation.navigate('FollowListModal', { userId, type: 'following' })}
            style={styles.countBox}
          >
            <Text style={styles.countNum}>{following.length}</Text>
            <Text style={styles.countLabel}>Following</Text>
          </TouchableOpacity>
        </View>
        <Text style={styles.username}>@{displayUsername}</Text>
        {profile.full_name ? <Text style={styles.fullName}>{profile.full_name}</Text> : null}
        {profile.bio ? <Text style={styles.bio}>{profile.bio}</Text> : null}
        {followButton}
      </View>
      {/* Posts grid etc can go here */}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { padding: 16, borderBottomWidth: 1, borderBottomColor: '#e6e6e6' },
  headerRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  avatar: { width: 80, height: 80, borderRadius: 40, marginRight: 16, borderWidth: 1, borderColor: '#eee' },
  avatarPlaceholder: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#67a4ec', alignItems: 'center', justifyContent: 'center', marginRight: 16 },
  avatarText: { color: '#fff', fontSize: 36, fontWeight: 'bold' },
  username: { fontSize: 18, fontWeight: 'bold', marginBottom: 4 },
  fullName: { fontSize: 16, color: '#666', marginBottom: 2 },
  bio: { fontSize: 14, color: '#444', marginTop: 4, marginBottom: 12 },
  countBox: { alignItems: 'center', marginHorizontal: 10 },
  countNum: { fontSize: 18, fontWeight: 'bold' },
  countLabel: { fontSize: 13, color: '#888' },
  followButton: { marginTop: 8, backgroundColor: '#3897f0', borderRadius: 4, paddingVertical: 7, alignItems: 'center' },
  followText: { color: '#fff', fontWeight: '600', fontSize: 15 },
  unfollowButton: { marginTop: 8, backgroundColor: '#fff', borderColor: '#bbb', borderWidth: 1, borderRadius: 4, paddingVertical: 7, alignItems: 'center' },
  unfollowText: { color: '#333', fontWeight: '600', fontSize: 15 },
  pendingButton: { marginTop: 8, backgroundColor: '#eee', borderRadius: 4, paddingVertical: 7, alignItems: 'center' },
  pendingText: { color: '#aaa', fontWeight: '600', fontSize: 15 },
  errorText: { fontSize: 16, textAlign: 'center', marginTop: 24, color: 'red' },
});
