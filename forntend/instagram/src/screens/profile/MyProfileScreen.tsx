import React from 'react';
import { View, Text, StyleSheet, Image, ScrollView, TouchableOpacity } from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { useGetMeQuery, useGetUserProfileByUsernameQuery } from '../../store/api/services';
import { Loading } from '../../components/common/Loading';
import { useAppTheme } from '../../theme/ThemeContext';
import Icon from 'react-native-vector-icons/Ionicons';

export const MyProfileScreen: React.FC = () => {
  const { theme } = useAppTheme();
  const route = useRoute<any>();
  const navigation = useNavigation<any>();

  // If a username is passed via route (e.g. deep link), use it; otherwise use current user
  const routeUsername: string | undefined = route.params?.username;

  const {
    data: me,
    isLoading: isLoadingMe,
    isError: isErrorMe,
  } = useGetMeQuery(undefined, { skip: !!routeUsername });

  const username: string | undefined = routeUsername || me?.username;

  const {
    data: profile,
    isLoading: isLoadingProfile,
    isError: isErrorProfile,
    error,
  } = useGetUserProfileByUsernameQuery(username as string, { skip: !username });

  // Loading and error handling
  if (!username) {
    if (isLoadingMe) return <Loading />;
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: theme.colors.background,
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        <Text style={{ color: theme.colors.error }}>No user found!</Text>
      </View>
    );
  }

  if (isLoadingMe || isLoadingProfile) {
    return <Loading />;
  }

  if (isErrorMe || isErrorProfile || !profile) {
    return (
      <View style={styles.container}>
        <Text style={[styles.errorText, { color: theme.colors.error }]}>
          No data for this user
        </Text>
      </View>
    );
  }

  // Profile shape from /profiles/{username}/
  const displayUsername =
    profile.user?.username || profile.username || username || '';
  const isPrivate = !!profile.is_private;

  const postsCount = profile.posts_count ?? 0;
  const followersCount = profile.followers_count ?? 0;
  const followingCount = profile.following_count ?? 0;

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      {/* Header with username and settings */}
      <View style={styles.headerIcons}>
        <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center' }}>
          {isPrivate && (
            <Icon
              name="lock-closed-outline"
              size={20}
              color="#555"
              style={{ marginRight: 6 }}
            />
          )}
          <Text style={styles.usernameHeader}>{displayUsername}</Text>
          <Icon
            name="chevron-down-outline"
            size={18}
            color="#555"
            style={{ marginLeft: 6 }}
          />
        </View>
        <View style={{ flexDirection: 'row' }}>
          <TouchableOpacity onPress={() => navigation.navigate('Settings')}>
            <Icon
              name="settings-outline"
              size={27}
              color="#222"
              style={{ marginHorizontal: 8 }}
            />
          </TouchableOpacity>
          <TouchableOpacity>
            <Icon
              name="menu-outline"
              size={27}
              color="#222"
              style={{ marginHorizontal: 4 }}
            />
          </TouchableOpacity>
        </View>
      </View>

      {/* Avatar + stats row */}
      <View style={styles.profileInfo}>
        <Image
          source={
            profile.profile_pic
              ? { uri: profile.profile_pic }
              : require('../../assets/avatar-placeholder.png')
          }
          style={styles.avatar}
        />
        <View style={styles.statsContainer}>
          <View style={styles.statBox}>
            <Text style={styles.statNum}>{postsCount}</Text>
            <Text style={styles.statLabel}>Posts</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statNum}>{followersCount}</Text>
            <Text style={styles.statLabel}>Followers</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statNum}>{followingCount}</Text>
            <Text style={styles.statLabel}>Following</Text>
          </View>
        </View>
      </View>

      {/* Name and bio */}
      <Text style={[styles.fullName, { color: theme.colors.text }]}>
        {profile.full_name || ''}
      </Text>
      {profile.bio ? (
        <Text style={[styles.bio, { color: theme.colors.textSecondary }]}>
          {profile.bio}
        </Text>
      ) : null}

      {/* Here you can render grid of posts using useGetPostsQuery if needed */}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  headerIcons: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 18,
    paddingHorizontal: 14,
    marginBottom: 12,
  },
  usernameHeader: {
    fontSize: 19,
    fontWeight: 'bold',
    color: '#222',
  },
  profileInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  avatar: {
    width: 97,
    height: 97,
    borderRadius: 48.5,
    marginRight: 20,
    borderWidth: 2,
    borderColor: '#eee',
  },
  statsContainer: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statBox: {
    alignItems: 'center',
  },
  statNum: {
    fontSize: 17,
    fontWeight: 'bold',
    color: '#222',
  },
  statLabel: {
    fontSize: 13,
    color: '#888',
  },
  fullName: {
    paddingHorizontal: 20,
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
    marginTop: 4,
  },
  bio: {
    paddingHorizontal: 20,
    fontSize: 14,
    lineHeight: 18,
    marginBottom: 4,
  },
  errorText: {
    fontSize: 16,
    textAlign: 'center',
    marginTop: 24,
  },
});
