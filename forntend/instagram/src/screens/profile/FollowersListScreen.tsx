// D:\Projects\InstagramApp\Codes\forntend\instagram\src\screens\profile\FollowersListScreen.tsx

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import {
  useGetFollowersQuery,
  useGetFollowingQuery,
} from '../../store/api/services';
import { Loading } from '../../components/common/Loading';
import { useAppTheme } from '../../theme/ThemeContext';
import Icon from 'react-native-vector-icons/Ionicons';
import { UserProfile } from '../../types'; // Assuming UserProfile is the type returned by the API

// --- Types for Navigation ---
type FollowersListRouteParams = {
  userId: number;
  initialTab: 'Followers' | 'Following';
};

// --- Custom Profile Card Component ---

const UserListItem: React.FC<{ userProfile: any; onPress: () => void }> = ({
  userProfile,
  onPress,
}) => {
  const { theme } = useAppTheme();
  
  // The UserProfileSerializer returns profile data, which contains the 'user' object inside.
  const username = userProfile.user?.username || userProfile.username;
  const fullName = userProfile.full_name;

  return (
    <TouchableOpacity style={styles.listItem} onPress={onPress}>
      <Image
        source={
          userProfile.profile_pic
            ? { uri: userProfile.profile_pic }
            : require('../../assets/avatar-placeholder.png')
        }
        style={styles.listAvatar}
      />
      <View style={styles.textContainer}>
        <Text style={[styles.listUsername, { color: theme.colors.text }]}>
          {username}
        </Text>
        {fullName ? (
          <Text style={[styles.listFullName, { color: theme.colors.textSecondary }]}>
            {fullName}
          </Text>
        ) : null}
      </View>
      {/* Example: Add a Follow/Following button placeholder here */}
      <TouchableOpacity style={[styles.followButton, {borderColor: theme.colors.border}]}>
        <Text style={styles.followButtonText}>Following</Text>
      </TouchableOpacity>
    </TouchableOpacity>
  );
};


export const FollowersListScreen: React.FC = () => {
  const { theme } = useAppTheme();
  const navigation = useNavigation<any>();
  const route = useRoute();

  // Extract params passed from MyProfileScreen
  const { userId, initialTab } = route.params as FollowersListRouteParams;
  const [activeTab, setActiveTab] = useState<'Followers' | 'Following'>(initialTab);
  
  // --- Data Fetching ---
  const { data: followersList, isLoading: isFollowersLoading } = useGetFollowersQuery(userId, {
    skip: activeTab !== 'Followers',
  });
  const { data: followingList, isLoading: isFollowingLoading } = useGetFollowingQuery(userId, {
    skip: activeTab !== 'Following',
  });

  const isLoading = isFollowersLoading || isFollowingLoading;
  const listData = activeTab === 'Followers' ? followersList : followingList;
  const listTitle = activeTab === 'Followers' ? 'Followers' : 'Following';

  // --- Render Functions ---

  const renderItem = ({ item }: { item: any }) => (
    <UserListItem
      userProfile={item}
      onPress={() => {
        // Navigate to the specific user's profile screen
        const username = item.user?.username || item.username;
        if (username) {
            navigation.navigate('UserProfileScreen', { username }); // Make sure you have this screen set up
        }
      }}
    />
  );

  if (isLoading) return <Loading />;

  return (
    <View style={[styles.screenContainer, { backgroundColor: theme.colors.background }]}>
      
      {/* Tab Bar for switching between lists */}
      <View style={[styles.tabContainer, { borderBottomColor: theme.colors.border }]}>
        <TouchableOpacity
          style={[
            styles.tabButton,
            activeTab === 'Followers' && styles.activeTab,
          ]}
          onPress={() => setActiveTab('Followers')}
        >
          <Text
            style={[
              styles.tabText,
              { color: activeTab === 'Followers' ? theme.colors.text : theme.colors.textSecondary },
            ]}
          >
            Followers ({followersList?.length ?? 0})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.tabButton,
            activeTab === 'Following' && styles.activeTab,
          ]}
          onPress={() => setActiveTab('Following')}
        >
          <Text
            style={[
              styles.tabText,
              { color: activeTab === 'Following' ? theme.colors.text : theme.colors.textSecondary },
            ]}
          >
            Following ({followingList?.length ?? 0})
          </Text>
        </TouchableOpacity>
      </View>

      {/* List Content */}
      {listData && listData.length > 0 ? (
        <FlatList
          data={listData}
          keyExtractor={(item) => (item.user?.id || item.id).toString()}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
        />
      ) : (
        <View style={styles.emptyContainer}>
          <Icon name="person-circle-outline" size={80} color={theme.colors.textSecondary} />
          <Text style={[styles.emptyText, { color: theme.colors.textSecondary }]}>
            {listTitle} list is empty.
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  screenContainer: {
    flex: 1,
  },
  // --- Tabs ---
  tabContainer: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    paddingTop: 10,
    marginBottom: 5,
  },
  tabButton: {
    flex: 1,
    paddingBottom: 10,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomColor: 'black', // Use theme.colors.primary if defined
  },
  tabText: {
    fontSize: 15,
    fontWeight: 'bold',
  },
  // --- List Items ---
  listContent: {
    paddingHorizontal: 15,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
  },
  listAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginRight: 15,
  },
  textContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  listUsername: {
    fontSize: 15,
    fontWeight: 'bold',
  },
  listFullName: {
    fontSize: 13,
  },
  followButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
    backgroundColor: 'transparent',
  },
  followButtonText: {
    fontWeight: '600',
    fontSize: 13,
    color: '#333',
  },
  // --- Empty State ---
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 50,
  },
  emptyText: {
    marginTop: 10,
    fontSize: 16,
  },
});