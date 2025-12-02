// src/screens/profile/MyProfileScreen.tsx
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  ScrollView,
  TouchableOpacity,
  FlatList,
  Dimensions,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useGetMeQuery, useGetUserPostsQuery } from '../../store/api/services';
import { Loading } from '../../components/common/Loading';
import { useAppTheme } from '../../theme/ThemeContext';
import Icon from 'react-native-vector-icons/Ionicons';

const { width } = Dimensions.get('window');
const POST_SIZE = width / 3;

export const MyProfileScreen: React.FC = () => {
  const { theme } = useAppTheme();
  const navigation = useNavigation<any>();
  const { data: profile, isLoading: profileLoading } = useGetMeQuery();
  const { data: postsData, isLoading: postsLoading } = useGetUserPostsQuery({ limit: 30 });

  if (profileLoading || postsLoading) return <Loading />;

  if (!profile) {
    return (
      <View style={[styles.center, { backgroundColor: theme.colors.background }]}>
        <Text style={{ color: theme.colors.text }}>Please log in</Text>
      </View>
    );
  }

  const user = profile.user || profile;
  const posts = postsData?.posts || [];

  const stats = [
    { count: posts.length, label: 'posts' },
    { count: user.followers_count || 0, label: 'followers', type: 'followers' },
    { count: user.following_count || 0, label: 'following', type: 'following' },
  ];

  const openFollowersList = (type: 'followers' | 'following') => {
    navigation.navigate('FollowersList', {
      userId: user.id,
      username: user.username,
      type,
    });
  };

  const renderPost = ({ item }: any) => (
    <TouchableOpacity style={styles.postItem}>
      <Image source={{ uri: item.media_url }} style={styles.postImage} />
      <View style={styles.postOverlay}>
        <View style={styles.postStats}>
          <Icon name="heart" size={16} color="white" />
          <Text style={styles.postStatText}>{item.likes_count || 0}</Text>
          <Icon name="chatbubble" size={16} color="white" style={{ marginLeft: 12 }} />
          <Text style={styles.postStatText}>{item.comments_count || 0}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <ScrollView style={{ backgroundColor: theme.colors.background }}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          {user.is_private && (
            <Icon name="lock-closed" size={18} color={theme.colors.text} style={{ marginRight: 6 }} />
          )}
          <Text style={[styles.username, { color: theme.colors.text }]}>{user.username}</Text>
          <Icon name="chevron-down" size={18} color={theme.colors.text} style={{ marginLeft: 4 }} />
        </View>
        <View style={styles.headerRight}>
          <TouchableOpacity>
            <Icon name="add-circle-outline" size={28} color={theme.colors.text} style={{ marginRight: 16 }} />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => navigation.navigate('Settings')}>
            <Icon name="menu-outline" size={28} color={theme.colors.text} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Profile Info */}
      <View style={styles.profileInfo}>
        <Image
          source={
            user.profile_pic
              ? { uri: user.profile_pic }
              : require('../../assets/avatar-placeholder.png')
          }
          style={styles.avatar}
        />

        <View style={styles.stats}>
          {stats.map((stat, index) => (
            <TouchableOpacity
              key={index}
              style={styles.stat}
              onPress={() => stat.type && openFollowersList(stat.type as any)}
            >
              <Text style={[styles.statCount, { color: theme.colors.text }]}>{stat.count}</Text>
              <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>{stat.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Bio */}
      <View style={styles.bioContainer}>
        {user.full_name && (
          <Text style={[styles.fullName, { color: theme.colors.text }]}>{user.full_name}</Text>
        )}
        {user.bio ? (
          <Text style={[styles.bio, { color: theme.colors.text }]}>{user.bio}</Text>
        ) : (
          <Text style={[styles.bio, { color: theme.colors.textSecondary, fontStyle: 'italic' }]}>
            No bio yet.
          </Text>
        )}
      </View>

      {/* Action Buttons */}
      <View style={styles.actionButtons}>
        <TouchableOpacity
          style={[styles.editButton, { backgroundColor: theme.colors.card }]}
          onPress={() => navigation.navigate('EditProfile')}
        >
          <Text style={[styles.editButtonText, { color: theme.colors.text }]}>Edit Profile</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.editButton, { backgroundColor: theme.colors.card }]}>
          <Text style={[styles.editButtonText, { color: theme.colors.text }]}>Share Profile</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.addFriendButton, { borderColor: theme.colors.border }]}>
          <Icon name="person-add-outline" size={20} color={theme.colors.text} />
        </TouchableOpacity>
      </View>

      {/* Tabs */}
      <View style={[styles.tabs, { borderTopColor: theme.colors.border }]}>
        <View style={styles.tabActive}>
          <Icon name="grid-outline" size={26} color={theme.colors.primary} />
        </View>
        <View style={styles.tab}>
          <Icon name="person-circle-outline" size={26} color={theme.colors.textSecondary} />
        </View>
      </View>

      {/* Posts Grid */}
      {posts.length === 0 ? (
        <View style={styles.noPosts}>
          <View style={styles.noPostsIcon}>
            <Icon name="camera-outline" size={64} color={theme.colors.textSecondary} />
          </View>
          <Text style={[styles.noPostsText, { color: theme.colors.text }]}>No Posts Yet</Text>
        </View>
      ) : (
        <FlatList
          data={posts}
          numColumns={3}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderPost}
          style={styles.postsGrid}
        />
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  username: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  profileInfo: {
    flexDirection: 'row',
    padding: 20,
  },
  avatar: {
    width: 88,
    height: 88,
    borderRadius: 44,
    marginRight: 28,
  },
  stats: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  stat: {
    alignItems: 'center',
  },
  statCount: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  statLabel: {
    fontSize: 13,
    marginTop: 2,
  },
  bioContainer: {
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  fullName: {
    fontWeight: '600',
    fontSize: 14,
  },
  bio: {
    marginTop: 4,
    fontSize: 14,
    lineHeight: 20,
  },
  actionButtons: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  editButton: {
    flex: 1,
    height: 32,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#dbdbdb',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  editButtonText: {
    fontWeight: '600',
    fontSize: 14,
  },
  addFriendButton: {
    width: 36,
    height: 32,
    borderRadius: 8,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tabs: {
    flexDirection: 'row',
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  tabActive: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 2,
    borderBottomColor: '#000',
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
  },
  noPosts: {
    alignItems: 'center',
    paddingTop: 60,
  },
  noPostsIcon: {
    width: 96,
    height: 96,
    borderRadius: 48,
    borderWidth: 2,
    borderColor: '#ddd',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  noPostsText: {
    fontSize: 20,
    fontWeight: '600',
  },
  postsGrid: {
    paddingHorizontal: 0.5,
  },
  postItem: {
    width: POST_SIZE,
    height: POST_SIZE,
    margin: 0.5,
  },
  postImage: {
    width: '100%',
    height: '100%',
  },
  postOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  postStats: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  postStatText: {
    color: 'white',
    fontWeight: 'bold',
    marginLeft: 6,
    fontSize: 14,
  },
});