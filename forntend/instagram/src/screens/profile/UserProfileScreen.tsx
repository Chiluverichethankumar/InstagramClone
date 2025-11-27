import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Image, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import {
  useGetUserProfileByUsernameQuery,
  useGetFollowersQuery,
  useGetFollowingQuery,
  useFollowUserMutation,
  useUnfollowUserMutation,
} from '../../store/api/services';
import { Loading } from '../../components/common/Loading';
import { useAppTheme } from '../../theme/ThemeContext';

type FollowState = 'not-following' | 'following' | 'pending';

export const UserProfileScreen: React.FC = () => {
  const { theme } = useAppTheme();
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const username: string | undefined = route.params?.username;

  const {
    data: profile,
    isLoading,
    isError,
  } = useGetUserProfileByUsernameQuery(username as string, { skip: !username });

  // backend profile: { id: 2, user: { id: 7, ... } }
  const userId: number | undefined = profile?.user?.id;

  const { data: followers = [] } = useGetFollowersQuery(userId!, { skip: !userId });
  const { data: following = [] } = useGetFollowingQuery(userId!, { skip: !userId });

  const [followUser, { isLoading: followLoading }] = useFollowUserMutation();
  const [unfollowUser, { isLoading: unfollowLoading }] = useUnfollowUserMutation();

  const [followState, setFollowState] = useState<FollowState>('not-following');

  useEffect(() => {
    if (!profile) return;

    if (profile.is_following) {
      setFollowState('following');
    } else if (profile.request_sent) {
      setFollowState('pending');
    } else {
      setFollowState('not-following');
    }
  }, [profile]);

  if (!username) return <Text>No username provided!</Text>;
  if (isLoading || (!profile && !isError)) return <Loading />;
  if (isError || !profile) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>No data for this user</Text>
      </View>
    );
  }

  const displayUsername =
    profile.user?.username || profile.username || username || '';

  const handleFollowPress = async () => {
    if (!userId) {
      Alert.alert('Error', 'Cannot follow: invalid user id');
      return;
    }

    try {
      const res: any = await followUser(userId).unwrap();
      console.log('followUser response:', res);

      if (profile.is_private) {
        // Private account → any 200 means treat as "Requested"
        setFollowState('pending');
      } else {
        // Public account
        setFollowState('following');
      }
    } catch (e: any) {
      console.log('followUser error:', e);
      const msg =
        e?.data?.error || e?.data?.message || e?.message || 'Action failed';
      Alert.alert('Error', msg);
    }
  };

  const handleUnfollowPress = async () => {
    if (!userId) {
      Alert.alert('Error', 'Cannot unfollow: invalid user id');
      return;
    }

    try {
      const res: any = await unfollowUser(userId).unwrap();
      console.log('unfollowUser response:', res);
      setFollowState('not-following');
    } catch (e: any) {
      console.log('unfollowUser error:', e);
      const msg =
        e?.data?.error || e?.data?.message || e?.message || 'Unfollow failed';
      Alert.alert('Error', msg);
    }
  };

  let followButton = null;
  if (followState === 'following') {
    followButton = (
      <TouchableOpacity
        onPress={handleUnfollowPress}
        style={styles.unfollowButton}
        disabled={unfollowLoading}
      >
        <Text style={styles.unfollowText}>Unfollow</Text>
      </TouchableOpacity>
    );
  } else if (followState === 'pending') {
    followButton = (
      <View style={styles.requestedButton}>
        <Text style={styles.requestedText}>Requested</Text>
      </View>
    );
  } else {
    followButton = (
      <TouchableOpacity
        onPress={handleFollowPress}
        style={styles.followButton}
        disabled={followLoading}
      >
        <Text style={styles.followText}>
          {profile.is_private ? 'Request' : 'Follow'}
        </Text>
      </TouchableOpacity>
    );
  }

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={styles.header}>
        <View style={styles.headerRow}>
          {profile.profile_pic ? (
            <Image source={{ uri: profile.profile_pic }} style={styles.avatar} />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Text style={styles.avatarText}>
                {displayUsername.charAt(0).toUpperCase()}
              </Text>
            </View>
          )}

          <TouchableOpacity
            onPress={() =>
              navigation.navigate('FollowListModal', { userId, type: 'followers' })
            }
            style={styles.countBox}
          >
            <Text style={styles.countNum}>{followers.length}</Text>
            <Text style={styles.countLabel}>Followers</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() =>
              navigation.navigate('FollowListModal', { userId, type: 'following' })
            }
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
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { padding: 16, borderBottomWidth: 1, borderBottomColor: '#e6e6e6' },
  headerRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginRight: 16,
    borderWidth: 1,
    borderColor: '#eee',
  },
  avatarPlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#67a4ec',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  avatarText: { color: '#fff', fontSize: 36, fontWeight: 'bold' },
  username: { fontSize: 18, fontWeight: 'bold', marginBottom: 4 },
  fullName: { fontSize: 16, color: '#666', marginBottom: 2 },
  bio: { fontSize: 14, color: '#444', marginTop: 4, marginBottom: 12 },
  countBox: { alignItems: 'center', marginHorizontal: 10 },
  countNum: { fontSize: 18, fontWeight: 'bold' },
  countLabel: { fontSize: 13, color: '#888' },

  followButton: {
    marginTop: 8,
    backgroundColor: '#3897f0',
    borderRadius: 4,
    paddingVertical: 7,
    alignItems: 'center',
  },
  followText: { color: '#fff', fontWeight: '600', fontSize: 15 },

  unfollowButton: {
    marginTop: 8,
    backgroundColor: '#fff',
    borderColor: '#bbb',
    borderWidth: 1,
    borderRadius: 4,
    paddingVertical: 7,
    alignItems: 'center',
  },
  unfollowText: { color: '#333', fontWeight: '600', fontSize: 15 },

  requestedButton: {
    marginTop: 8,
    backgroundColor: '#efefef',
    borderRadius: 4,
    paddingVertical: 7,
    alignItems: 'center',
  },
  requestedText: { color: '#999', fontWeight: '600', fontSize: 15 },

  errorText: { fontSize: 16, textAlign: 'center', marginTop: 24, color: 'red' },
});
