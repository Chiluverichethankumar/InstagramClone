// import React from 'react';
// import { View, Text, StyleSheet, Image, ScrollView, TouchableOpacity } from 'react-native';
// import { useNavigation } from '@react-navigation/native';
// import { useGetUserProfileByUsernameQuery } from '../../store/api/services';
// import { Loading } from '../../components/common/Loading';
// import { useAppTheme } from '../../theme/ThemeContext';
// import Icon from 'react-native-vector-icons/Ionicons';

// export const MyProfileScreen: React.FC = () => {
//   const { theme } = useAppTheme();
//   const navigation = useNavigation<any>();

//   // TEMP: hard-code your own username here
//   const username = 'ram';

//   const {
//     data: profile,
//     isLoading,
//     isError,
//   } = useGetUserProfileByUsernameQuery(username, { skip: !username });

//   if (isLoading) return <Loading />;

//   if (isError || !profile) {
//     return (
//       <View style={styles.container}>
//         <Text style={[styles.errorText, { color: theme.colors.error }]}>
//           No data for this user
//         </Text>
//       </View>
//     );
//   }

//   const displayUsername =
//     profile.user?.username || profile.username || username || '';
//   const isPrivate = !!profile.is_private;

//   const postsCount = profile.posts_count ?? 0;
//   const followersCount = profile.followers_count ?? 0;
//   const followingCount = profile.following_count ?? 0;

//   return (
//     <ScrollView
//       style={[styles.container, { backgroundColor: theme.colors.background }]}
//     >
//       {/* Header with username and settings */}
//       <View style={styles.headerIcons}>
//         <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center' }}>
//           {isPrivate && (
//             <Icon
//               name="lock-closed-outline"
//               size={20}
//               color="#555"
//               style={{ marginRight: 6 }}
//             />
//           )}
//           <Text style={styles.usernameHeader}>{displayUsername}</Text>
//           <Icon
//             name="chevron-down-outline"
//             size={18}
//             color="#555"
//             style={{ marginLeft: 6 }}
//           />
//         </View>
//         <View style={{ flexDirection: 'row' }}>
//           <TouchableOpacity onPress={() => navigation.navigate('Settings')}>
//             <Icon
//               name="settings-outline"
//               size={27}
//               color="#222"
//               style={{ marginHorizontal: 8 }}
//             />
//           </TouchableOpacity>
//           <TouchableOpacity>
//             <Icon
//               name="menu-outline"
//               size={27}
//               color="#222"
//               style={{ marginHorizontal: 4 }}
//             />
//           </TouchableOpacity>
//         </View>
//       </View>

//       {/* Avatar + stats row */}
//       <View style={styles.profileInfo}>
//         <Image
//           source={
//             profile.profile_pic
//               ? { uri: profile.profile_pic }
//               : require('../../assets/avatar-placeholder.png')
//           }
//           style={styles.avatar}
//         />
//         <View style={styles.statsContainer}>
//           <View style={styles.statBox}>
//             <Text style={styles.statNum}>{postsCount}</Text>
//             <Text style={styles.statLabel}>Posts</Text>
//           </View>
//           <View style={styles.statBox}>
//             <Text style={styles.statNum}>{followersCount}</Text>
//             <Text style={styles.statLabel}>Followers</Text>
//           </View>
//           <View style={styles.statBox}>
//             <Text style={styles.statNum}>{followingCount}</Text>
//             <Text style={styles.statLabel}>Following</Text>
//           </View>
//         </View>
//       </View>

//       {/* Name and bio */}
//       <Text style={[styles.fullName, { color: theme.colors.text }]}>
//         {profile.full_name || ''}
//       </Text>
//       {profile.bio ? (
//         <Text style={[styles.bio, { color: theme.colors.textSecondary }]}>
//           {profile.bio}
//         </Text>
//       ) : null}
//     </ScrollView>
//   );
// };

// const styles = StyleSheet.create({
//   container: { flex: 1 },
//   headerIcons: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     justifyContent: 'space-between',
//     paddingTop: 18,
//     paddingHorizontal: 14,
//     marginBottom: 12,
//   },
//   usernameHeader: {
//     fontSize: 19,
//     fontWeight: 'bold',
//     color: '#222',
//   },
//   profileInfo: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     paddingHorizontal: 20,
//     marginBottom: 12,
//   },
//   avatar: {
//     width: 97,
//     height: 97,
//     borderRadius: 48.5,
//     marginRight: 20,
//     borderWidth: 2,
//     borderColor: '#eee',
//   },
//   statsContainer: {
//     flex: 1,
//     flexDirection: 'row',
//     justifyContent: 'space-around',
//   },
//   statBox: {
//     alignItems: 'center',
//   },
//   statNum: {
//     fontSize: 17,
//     fontWeight: 'bold',
//     color: '#222',
//   },
//   statLabel: {
//     fontSize: 13,
//     color: '#888',
//   },
//   fullName: {
//     paddingHorizontal: 20,
//     fontSize: 16,
//     fontWeight: 'bold',
//     marginBottom: 4,
//     marginTop: 4,
//   },
//   bio: {
//     paddingHorizontal: 20,
//     fontSize: 14,
//     lineHeight: 18,
//     marginBottom: 4,
//   },
//   errorText: {
//     fontSize: 16,
//     textAlign: 'center',
//     marginTop: 24,
//   },
// });

import React from 'react';
import { View, Text, StyleSheet, Image, ScrollView, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useGetMeQuery } from '../../store/api/services'; // <-- CHANGED HOOK
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
          backgroundColor: isPrimary ? theme.colors.primary : theme.colors.background,
          borderColor: isPrimary ? theme.colors.primary : theme.colors.border,
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
          // Navigate to a dedicated Edit Profile screen
          // navigation.navigate('EditProfile');
          console.log('Navigate to Edit Profile');
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
          {/* New Post Button */}
          <TouchableOpacity onPress={() => console.log('New Post')}>
            <Icon
              name="add-square-outline"
              size={27}
              color="#222"
              style={{ marginHorizontal: 8 }}
            />
          </TouchableOpacity>
          {/* Menu/Settings Button */}
          <TouchableOpacity onPress={() => navigation.navigate('Settings')}>
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
          {/* Followers Navigation */}
          <TouchableOpacity
            style={styles.statBox}
            onPress={() => navigation.navigate('FollowersList', { userId: userId, initialTab: 'Followers' })}>
            <Text style={styles.statNum}>{followersCount}</Text>
            <Text style={styles.statLabel}>Followers</Text>
          </TouchableOpacity>
          {/* Following Navigation */}
          <TouchableOpacity
            style={styles.statBox}
            onPress={() => navigation.navigate('FollowersList', { userId: userId, initialTab: 'Following' })}>
            <Text style={styles.statNum}>{followingCount}</Text>
            <Text style={styles.statLabel}>Following</Text>
          </TouchableOpacity>
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

      {/* ACTION BUTTONS (Edit Profile, Share Profile) */}
      <ProfileActionButtons navigation={navigation} />

      {/* Spacer */}
      <View style={{ height: 16 }} />

      {/* Placeholder for post grid/tabs */}
      <View style={styles.tabsContainer}>
        <Icon name="grid-outline" size={25} color="#222" style={styles.tabIcon} />
        <Icon name="person-circle-outline" size={25} color="#999" style={styles.tabIcon} />
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