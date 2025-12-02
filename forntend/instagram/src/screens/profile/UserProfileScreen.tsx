// src/screens/profile/UserProfileScreen.tsx — corrected & robust version
import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  RefreshControl,
  Dimensions,
  SafeAreaView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import {
  useGetUserProfileByUsernameQuery,
  useFollowUserMutation,
  useUnfollowUserMutation,
  useGetMeQuery,
  useGetUserPostsQuery,
} from '../../store/api/services';
import { useAppTheme } from '../../theme/ThemeContext';
import Icon from 'react-native-vector-icons/Ionicons';

const { width } = Dimensions.get('window');
const ITEM_WIDTH = Math.floor(width / 3);

export const UserProfileScreen: React.FC = () => {
  const route = useRoute<any>();
  const navigation = useNavigation<any>();
  const { theme } = useAppTheme();

  const username = route.params?.username as string | undefined;
  const userIdFromParams = route.params?.userId as number | undefined;

  const { data: currentUser, isLoading: meLoading } = useGetMeQuery();

  const {
    data: profile,
    isLoading: profileLoading,
    isError: profileError,
    refetch: refetchProfile,
  } = useGetUserProfileByUsernameQuery(username ?? '', { skip: !username });

  // userId resolution (support multiple shapes: profile.user.id or profile.id or route param)
  const userId = useMemo<number | undefined>(() => {
    if (userIdFromParams) return userIdFromParams;
    if (!profile) return undefined;
    // profile may be nested: { user: { id, username, ... }, id, ... }
    return profile.user?.id ?? profile.id ?? undefined;
  }, [profile, userIdFromParams]);

  const isOwnProfile = Boolean(
    currentUser && (currentUser.username === username || currentUser.id === userId)
  );

  // Derived flags from profile (support multiple shapes)
  const isPrivate = Boolean(profile?.is_private ?? profile?.user?.is_private ?? false);
  const apiIsFollowing = Boolean(profile?.is_following ?? profile?.user?.is_following ?? false);
  const apiRequestSent = Boolean(profile?.request_sent ?? profile?.user?.request_sent ?? false);

  // Posts query: only fetch when allowed (public OR own OR following)
  const { data: postsData, isLoading: postsLoading, refetch: refetchPosts } = useGetUserPostsQuery(
    { userId },
    {
      skip:
        !userId ||
        (isPrivate && !isOwnProfile && !apiIsFollowing && !apiRequestSent),
    }
  );

  // Normalize counts — support multiple response shapes
  const apiPostsCount =
    profile?.posts_count ??
    profile?.user?.posts_count ??
    // maybe backend returns posts array in profile
    (Array.isArray(profile?.posts) ? profile.posts.length : undefined);

  const apiFollowersCount =
    profile?.followers_count ??
    profile?.user?.followers_count ??
    (Array.isArray(profile?.followers) ? profile.followers.length : undefined);

  const apiFollowingCount =
    profile?.following_count ??
    profile?.user?.following_count ??
    (Array.isArray(profile?.following) ? profile.following.length : undefined);

  // Posts array from posts endpoint — normalize different fields (image, photo, media_url)
  const postsArray = (postsData?.posts ?? postsData) as any[] | undefined;

  // Local optimistic UI state for immediate responsiveness
  const [localIsFollowing, setLocalIsFollowing] = useState<boolean | null>(
    apiIsFollowing ? true : apiIsFollowing === false ? false : null
  );
  const [localRequestSent, setLocalRequestSent] = useState<boolean | null>(
    apiRequestSent ? true : apiRequestSent === false ? false : null
  );
  const [localFollowersCount, setLocalFollowersCount] = useState<number | undefined>(
    apiFollowersCount ?? undefined
  );

  // When profile loads / changes, sync local states
  useEffect(() => {
    setLocalIsFollowing(apiIsFollowing ? true : apiIsFollowing === false ? false : null);
    setLocalRequestSent(apiRequestSent ? true : apiRequestSent === false ? false : null);
    setLocalFollowersCount(apiFollowersCount ?? undefined);
  }, [apiIsFollowing, apiRequestSent, apiFollowersCount]);

  const [followUser, { isLoading: followLoading }] = useFollowUserMutation();
  const [unfollowUser, { isLoading: unfollowLoading }] = useUnfollowUserMutation();

  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await Promise.all([refetchProfile(), refetchPosts()]);
    } catch (err) {
      // ignore
    } finally {
      setRefreshing(false);
    }
  };

  // Helper to extract post image url supporting many shapes
  const getPostImage = (post: any) =>
    post?.image ?? post?.photo ?? post?.media ?? post?.media_url ?? post?.url ?? '';

  // Compute final counts (prefer local optimistic when available)
  const postsCount =
    apiPostsCount ??
    (Array.isArray(postsArray) ? postsArray.length : 0);

  const followersCount = localFollowersCount ?? apiFollowersCount ?? 0;
  const followingCount = apiFollowingCount ?? 0;

  const canSeePosts = !isPrivate || isOwnProfile || Boolean(localIsFollowing);

  const showPrivateLock = isPrivate && !isOwnProfile && !Boolean(localIsFollowing);

  // Follow / Unfollow handlers with optimistic UI update + rollback on error
  const handleFollow = async () => {
    if (!userId || isOwnProfile) return;
    // optimistic
    const prevFollowing = localIsFollowing;
    const prevFollowersCount = localFollowersCount;
    setLocalIsFollowing(true);
    setLocalRequestSent(false);
    setLocalFollowersCount((c) => (typeof c === 'number' ? c + 1 : 1));

    try {
      await followUser(userId).unwrap();
      // refresh authoritative data
      refetchProfile();
      refetchPosts();
    } catch (err: any) {
      // rollback
      setLocalIsFollowing(prevFollowing ?? false);
      setLocalFollowersCount(prevFollowersCount);
      Alert.alert('Failed', err?.data?.error ?? 'Unable to follow user');
    }
  };

  const handleUnfollow = async () => {
    if (!userId || isOwnProfile) return;
    // optimistic
    const prevFollowing = localIsFollowing;
    const prevFollowersCount = localFollowersCount;
    setLocalIsFollowing(false);
    setLocalFollowersCount((c) => (typeof c === 'number' ? Math.max(0, c - 1) : 0));

    try {
      await unfollowUser(userId).unwrap();
      // refresh authoritative data
      refetchProfile();
      refetchPosts();
    } catch (err: any) {
      // rollback
      setLocalIsFollowing(prevFollowing ?? false);
      setLocalFollowersCount(prevFollowersCount);
      Alert.alert('Failed', err?.data?.error ?? 'Unable to unfollow user');
    }
  };

  const openFollowers = () => {
    if (!userId) return;
    navigation.navigate('ProfileTab', {
      screen: 'FollowListModal',
      params: { userId, username, type: 'followers' },
    });
  };

  const openFollowing = () => {
    if (!userId) return;
    navigation.navigate('ProfileTab', {
      screen: 'FollowListModal',
      params: { userId, username, type: 'following' },
    });
  };

  if (profileLoading || meLoading) {
    return (
      <SafeAreaView style={[styles.center, { backgroundColor: theme.colors.background }]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </SafeAreaView>
    );
  }

  if (profileError || !profile) {
    return (
      <SafeAreaView style={[styles.center, { backgroundColor: theme.colors.background }]}>
        <Text style={{ color: theme.colors.textSecondary }}>User not found</Text>
      </SafeAreaView>
    );
  }

  // Final normalized profile fields
  const profilePic =
    profile?.profile_pic ?? profile?.user?.profile_pic ?? undefined;
  const displayName =
    profile?.full_name ?? profile?.user?.full_name ?? username ?? '';
  const bio = profile?.bio ?? profile?.user?.bio ?? '';

  // posts array to render: supports postsData.posts or postsData (array) or profile.posts
  const renderedPosts: any[] = (() => {
    if (!canSeePosts) return [];
    if (Array.isArray(postsArray)) return postsArray;
    if (Array.isArray(profile?.posts)) return profile.posts;
    return [];
  })();

  const renderPostItem = ({ item }: { item: any }) => {
    const img = getPostImage(item);
    const postId = item?.id ?? item?.post_id ?? String(Math.random());
    return (
      <View style={styles.postItem} key={postId}>
        {img ? (
          <Image source={{ uri: img }} style={styles.postImage} />
        ) : (
          <View style={[styles.postImage, { backgroundColor: theme.colors.card }]} />
        )}
        {item?.is_video && (
          <Icon name="play" size={24} color="#fff" style={styles.videoIcon} />
        )}
      </View>
    );
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <FlatList
        data={renderedPosts}
        numColumns={3}
        keyExtractor={(item) => String(item?.id ?? item?.post_id ?? JSON.stringify(item))}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.colors.primary} />
        }
        ListHeaderComponent={
          <>
            <View style={styles.header}>
              <Text style={[styles.username, { color: theme.colors.text }]}>{username}</Text>

              <View style={styles.profileRow}>
                <View style={styles.avatarContainer}>
                  {profilePic ? (
                    <Image source={{ uri: profilePic }} style={styles.avatar} />
                  ) : (
                    <Image
                      source={require('../../assets/default-avatar.png')}
                      style={styles.avatar}
                    />
                  )}
                </View>

                <View style={styles.statsContainer}>
                  <View style={styles.stat}>
                    <Text style={[styles.statNumber, { color: theme.colors.text }]}>{postsCount}</Text>
                    <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>posts</Text>
                  </View>

                  <TouchableOpacity onPress={openFollowers} style={styles.stat}>
                    <Text style={[styles.statNumber, { color: theme.colors.text }]}>{followersCount}</Text>
                    <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>followers</Text>
                  </TouchableOpacity>

                  <TouchableOpacity onPress={openFollowing} style={styles.stat}>
                    <Text style={[styles.statNumber, { color: theme.colors.text }]}>{followingCount}</Text>
                    <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>following</Text>
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.infoSection}>
                {displayName ? <Text style={[styles.fullName, { color: theme.colors.text }]}>{displayName}</Text> : null}
                {bio ? <Text style={[styles.bio, { color: theme.colors.textSecondary }]}>{bio}</Text> : null}
              </View>

              {/* Buttons */}
              {isOwnProfile ? (
                <View style={styles.ownProfileButtons}>
                  <TouchableOpacity
                    style={[styles.editButton, { borderColor: theme.colors.border }]}
                    onPress={() => navigation.navigate('ProfileTab', { screen: 'MyProfile' })}
                  >
                    <Text style={[styles.editText, { color: theme.colors.text }]}>Edit Profile</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.shareButton, { borderColor: theme.colors.border }]}
                    onPress={() => Alert.alert('Share', 'Share profile')}
                  >
                    <Icon name="share-social-outline" size={20} color={theme.colors.text} />
                  </TouchableOpacity>
                </View>
              ) : (
                <View style={styles.actionButtons}>
                  {localIsFollowing ? (
                    <View style={styles.followingRow}>
                      <TouchableOpacity
                        style={[styles.messageBtn, { borderColor: theme.colors.border }]}
                        onPress={() => navigation.navigate('ProfileTab', { screen: 'UserProfile', params: { username, userId } })}
                      >
                        <Text style={[styles.messageText, { color: theme.colors.text }]}>Message</Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        onPress={() =>
                          Alert.alert('Unfollow', `Unfollow @${username}?`, [
                            { text: 'Cancel', style: 'cancel' },
                            { text: 'Unfollow', style: 'destructive', onPress: handleUnfollow },
                          ])
                        }
                        disabled={unfollowLoading}
                        style={[styles.followingBtn, { borderColor: theme.colors.border }]}
                      >
                        <Text style={[styles.followingText, { color: theme.colors.text }]}>Following</Text>
                      </TouchableOpacity>

                      <TouchableOpacity style={[styles.moreBtn, { borderColor: theme.colors.border }]}>
                        <Icon name="chevron-down" size={20} color={theme.colors.text} />
                      </TouchableOpacity>
                    </View>
                  ) : localRequestSent ? (
                    <TouchableOpacity
                      onPress={() => {
                        // allow cancel request via unfollow endpoint if backend supports it; otherwise wire cancel request API
                        handleUnfollow();
                      }}
                      disabled={followLoading}
                      style={[styles.requestedBtn, { borderColor: theme.colors.border }]}
                    >
                      <Text style={[styles.requestedText, { color: theme.colors.text }]}>Requested</Text>
                    </TouchableOpacity>
                  ) : (
                    <TouchableOpacity
                      onPress={handleFollow}
                      disabled={followLoading}
                      style={[styles.followBtn, { backgroundColor: theme.colors.primary }]}
                    >
                      <Text style={styles.followText}>{followLoading ? 'Loading...' : isPrivate ? 'Request' : 'Follow'}</Text>
                    </TouchableOpacity>
                  )}
                </View>
              )}
            </View>

            <View style={[styles.tabBar, { borderTopColor: theme.colors.border }]}>
              <TouchableOpacity style={styles.tabActive}>
                <Icon name="grid-outline" size={26} color={theme.colors.text} />
              </TouchableOpacity>
              <TouchableOpacity style={styles.tabInactive}>
                <Icon name="videocam-outline" size={26} color={theme.colors.textSecondary} />
              </TouchableOpacity>
              <TouchableOpacity style={styles.tabInactive}>
                <Icon name="person-circle-outline" size={26} color={theme.colors.textSecondary} />
              </TouchableOpacity>
            </View>

            {showPrivateLock && (
              <View style={styles.privateLock}>
                <Icon name="lock-closed" size={64} color={theme.colors.textSecondary} />
                <Text style={[styles.privateTitle, { color: theme.colors.text }]}>This account is private</Text>
                <Text style={[styles.privateSubtitle, { color: theme.colors.textSecondary }]}>
                  Follow to see their photos and videos.
                </Text>
              </View>
            )}
          </>
        }
        renderItem={renderPostItem}
        columnWrapperStyle={{ justifyContent: 'flex-start' }}
        ListEmptyComponent={
          canSeePosts && renderedPosts.length === 0 ? (
            <View style={styles.noPosts}>
              <Icon name="camera-outline" size={64} color={theme.colors.textSecondary} />
              <Text style={[styles.noPostsText, { color: theme.colors.text }]}>No Posts Yet</Text>
            </View>
          ) : null
        }
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { padding: 16 },
  username: { fontSize: 20, fontWeight: '700', marginBottom: 12 },
  profileRow: { flexDirection: 'row', alignItems: 'center' },
  avatarContainer: { marginRight: 30 },
  avatar: { width: 88, height: 88, borderRadius: 44 },
  statsContainer: { flex: 1, flexDirection: 'row', justifyContent: 'space-around' },
  stat: { alignItems: 'center' },
  statNumber: { fontSize: 18, fontWeight: '700' },
  statLabel: { fontSize: 13, marginTop: 2 },
  infoSection: { marginTop: 12 },
  fullName: { fontWeight: '600', fontSize: 14 },
  bio: { marginTop: 4, fontSize: 14, lineHeight: 20 },
  ownProfileButtons: { flexDirection: 'row', marginTop: 12 },
  editButton: { flex: 1, borderWidth: 1, paddingVertical: 8, borderRadius: 6, alignItems: 'center', marginRight: 8 },
  editText: { fontWeight: '600' },
  shareButton: { width: 44, borderWidth: 1, borderRadius: 6, alignItems: 'center', justifyContent: 'center' },
  actionButtons: { marginTop: 12 },
  followingRow: { flexDirection: 'row' },
  messageBtn: { flex: 1, borderWidth: 1, paddingVertical: 8, borderRadius: 6, alignItems: 'center', marginRight: 8 },
  messageText: { fontWeight: '600' },
  followingBtn: { flex: 1, borderWidth: 1, paddingVertical: 8, borderRadius: 6, alignItems: 'center', marginRight: 8 },
  followingText: { fontWeight: '600' },
  moreBtn: { width: 44, borderWidth: 1, borderRadius: 6, alignItems: 'center', justifyContent: 'center' },
  requestedBtn: { borderWidth: 1, paddingVertical: 8, borderRadius: 6, alignItems: 'center' },
  requestedText: { fontWeight: '600' },
  followBtn: { paddingVertical: 8, borderRadius: 6, alignItems: 'center' },
  followText: { color: '#fff', fontWeight: '700', paddingHorizontal: 24 },
  tabBar: { flexDirection: 'row', borderTopWidth: 1, height: 44, alignItems: 'center', justifyContent: 'space-around', marginTop: 12 },
  tabActive: { flex: 1, alignItems: 'center', paddingVertical: 10 },
  tabInactive: { flex: 1, alignItems: 'center', paddingVertical: 10 },
  privateLock: { alignItems: 'center', paddingTop: 60 },
  privateTitle: { fontSize: 20, fontWeight: 'bold', marginTop: 20 },
  privateSubtitle: { marginTop: 8, textAlign: 'center', paddingHorizontal: 40 },
  postItem: { width: ITEM_WIDTH, height: ITEM_WIDTH, padding: 0.5 },
  postImage: { width: '100%', height: '100%' },
  videoIcon: { position: 'absolute', top: '40%', left: '40%' },
  noPosts: { alignItems: 'center', paddingTop: 60 },
  noPostsText: { fontSize: 18, marginTop: 16, fontWeight: '600' },
});
