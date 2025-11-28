// D:\Projects\InstagramApp\Codes\forntend\instagram\src\screens\profile\MyProfileScreen.tsx

import React from 'react';
import { View, Text, StyleSheet, Image, ScrollView, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useGetMeQuery } from '../../store/api/services';
import { Loading } from '../../components/common/Loading';
import { useAppTheme } from '../../theme/ThemeContext';
import Icon from 'react-native-vector-icons/Ionicons';

// Custom Button Component for better styling and reusability
const ProfileButton: React.FC<{ title: string; onPress: () => void; isPrimary?: boolean }> = ({
  title,
  onPress,
  isPrimary = false,
}) => {
  const { theme } = useAppTheme();
  return (
    <TouchableOpacity
      onPress={onPress}
      style={[
        styles.profileButton,
        {
          // Using hardcoded colors for typical Instagram look, but you can revert to theme
          backgroundColor: isPrimary ? '#0095f6' : theme.colors.background,
          borderColor: isPrimary ? '#0095f6' : '#dbdbdb', // Light grey border
        },
      ]}
    >
      <Text
        style={[
          styles.profileButtonText,
          { color: isPrimary ? theme.colors.background : theme.colors.text },
        ]}
      >
        {title}
      </Text>
    </TouchableOpacity>
  );
};

// Component to hold the primary actions for the logged-in user
const ProfileActionButtons: React.FC<{ navigation: any }> = ({ navigation }) => {
  const { theme } = useAppTheme();
  return (
    <View style={styles.actionButtonsContainer}>
      {/* Edit Profile Button */}
      <ProfileButton
        title="Edit Profile"
        onPress={() => {
          // 🚀 FIX: UNCOMMENT AND ENABLE NAVIGATION TO EDIT PROFILE SCREEN
          navigation.navigate('EditProfile');
        }}
      />
      {/* Share Profile Button */}
      <ProfileButton
        title="Share Profile"
        onPress={() => {
          // Implement share functionality
          console.log('Share Profile action');
        }}
      />
      {/* Small Action Button (often for adding contacts or discovery) */}
      <TouchableOpacity
        style={[styles.smallActionButton, { borderColor: theme.colors.border }]}
        onPress={() => {
          console.log('Add/Discover action');
        }}
      >
        <Icon name="person-add-outline" size={18} color={theme.colors.text} />
      </TouchableOpacity>
    </View>
  );
};

export const MyProfileScreen: React.FC = () => {
  const { theme } = useAppTheme();
  const navigation = useNavigation<any>();

  // Fetch the logged-in user's profile data using useGetMeQuery
  const {
    data: profile,
    isLoading,
    isError,
  } = useGetMeQuery(); // No arguments needed

  if (isLoading) return <Loading />;

  if (isError || !profile) {
    return (
      <View style={styles.container}>
        <Text style={[styles.errorText, { color: theme.colors.error }]}>
          Please log in to view your profile.
        </Text>
      </View>
    );
  }

  // Ensure we have the user ID for subsequent actions/queries
  const userId = profile.user?.id || profile.id;

  const displayUsername = profile.user?.username || profile.username || '';
  const isPrivate = !!profile.is_private;

  const postsCount = profile.posts_count ?? 0;
  const followersCount = profile.followers_count ?? 0;
  const followingCount = profile.following_count ?? 0;
  
  // Get full_name and bio from the top-level profile object
  const fullName = profile.full_name || profile.user?.full_name || '';
  const bio = profile.bio || profile.user?.bio || '';
  const profilePic = profile.profile_pic || profile.user?.profile_pic;


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
          <Text style={[styles.usernameHeader, { color: theme.colors.text }]}>{displayUsername}</Text>
          <Icon
            name="chevron-down-outline"
            size={18}
            color="#555"
            style={{ marginLeft: 6 }}
          />
        </View>
        <View style={{ flexDirection: 'row' }}>
          {/* New Post Button */}
          <TouchableOpacity onPress={() => console.log('New Post')}>
            <Icon
              name="add-square-outline"
              size={27}
              color={theme.colors.text}
              style={{ marginHorizontal: 8 }}
            />
          </TouchableOpacity>
          {/* Menu/Settings Button */}
          <TouchableOpacity onPress={() => navigation.navigate('Settings')}>
            <Icon
              name="menu-outline"
              size={27}
              color={theme.colors.text}
              style={{ marginHorizontal: 4 }}
            />
          </TouchableOpacity>
        </View>
      </View>

      {/* Avatar + stats row */}
      <View style={styles.profileInfo}>
        <Image
          source={
            profilePic
              ? { uri: profilePic }
              : require('../../assets/avatar-placeholder.png')
          }
          style={styles.avatar}
        />
        <View style={styles.statsContainer}>
          <View style={styles.statBox}>
            <Text style={[styles.statNum, { color: theme.colors.text }]}>{postsCount}</Text>
            <Text style={styles.statLabel}>Posts</Text>
          </View>
          {/* Followers Navigation */}
          <TouchableOpacity
            style={styles.statBox}
            onPress={() => navigation.navigate('FollowersList', { userId: userId, username: displayUsername, type: 'followers' })}>
            <Text style={[styles.statNum, { color: theme.colors.text }]}>{followersCount}</Text>
            <Text style={styles.statLabel}>Followers</Text>
          </TouchableOpacity>
          {/* Following Navigation */}
          <TouchableOpacity
            style={styles.statBox}
            onPress={() => navigation.navigate('FollowersList', { userId: userId, username: displayUsername, type: 'following' })}>
            <Text style={[styles.statNum, { color: theme.colors.text }]}>{followingCount}</Text>
            <Text style={styles.statLabel}>Following</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Name and bio */}
      <Text style={[styles.fullName, { color: theme.colors.text }]}>
        {fullName}
      </Text>
      {bio ? (
        <Text style={[styles.bio, { color: theme.colors.textSecondary }]}>
          {bio}
        </Text>
      ) : null}

      {/* ACTION BUTTONS (Edit Profile, Share Profile) */}
      <ProfileActionButtons navigation={navigation} />

      {/* Spacer */}
      <View style={{ height: 16 }} />

      {/* Placeholder for post grid/tabs */}
      <View style={styles.tabsContainer}>
        <Icon name="grid-outline" size={25} color={theme.colors.text} style={styles.tabIcon} />
        <Icon name="person-circle-outline" size={25} color={theme.colors.textSecondary} style={styles.tabIcon} />
      </View>

      <View style={{ height: 500 }} />

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
    color: '#222', // Overridden by inline theme color in component
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
    color: '#222', // Overridden by inline theme color in component
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
  // --- Styles for Buttons ---
  actionButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginTop: 10,
  },
  profileButton: {
    flex: 1,
    marginRight: 8,
    height: 30,
    borderRadius: 6,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  smallActionButton: {
    width: 30,
    height: 30,
    borderRadius: 6,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  // --- Styles for Tabs ---
  tabsContainer: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: '#eee',
    justifyContent: 'space-around',
  },
  tabIcon: {
    paddingVertical: 10,
  }
});